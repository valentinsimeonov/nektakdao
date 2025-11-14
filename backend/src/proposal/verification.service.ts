// src/proposals/verification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Proposal } from 'src/entity/proposal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { getAddress, Interface, JsonRpcProvider } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Minimal ABI for ProposalCreated event.
 */
const GOVERNOR_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'proposer', type: 'address' },
      { indexed: false, internalType: 'address[]', name: 'targets', type: 'address[]' },
      { indexed: false, internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
      { indexed: false, internalType: 'bytes[]', name: 'calldatas', type: 'bytes[]' },
      { indexed: false, internalType: 'uint256', name: 'startBlock', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'endBlock', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'description', type: 'string' },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
];

type TraceStep = {
  ts: string;
  step: string;
  ok: boolean;
  info?: any;
};

export type PreVerifyResult =
  | {
      outcome: 'CONFIRMED' | 'AWAITING_CONFIRMATIONS' | 'FAILED_TX' | 'MISMATCH';
      trace: TraceStep[];
      receipt?: any;
      authoritativeProposer?: string | null;
      confirmations?: number;
    }
  | {
      outcome: 'TX_NOT_FOUND' | 'RPC_ERROR';
      trace: TraceStep[];
      reason?: string;
    };

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private provider: JsonRpcProvider;
  private confirmationsThreshold: number;

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
  ) {
    const url = process.env.CHAIN_RPC_URL || process.env.RPC_URL || 'http://localhost:8545';
    this.provider = new JsonRpcProvider(url);
    this.confirmationsThreshold = Number(process.env.CONFIRMATIONS_REQUIRED ?? process.env.CONFIRMATIONS_THRESHOLD ?? 5);
    this.logger.log(`VerificationService initialized; RPC=${url}; confirmationsThreshold=${this.confirmationsThreshold}`);
  }

  private nowISO() {
    return new Date().toISOString();
  }

  private addTrace(trace: TraceStep[] | null, step: TraceStep): TraceStep[] {
    const arr = Array.isArray(trace) ? [...trace] : [];
    arr.push(step);
    return arr;
  }

  /**
   * Pre-verify an incoming payload BEFORE persisting to proposals table.
   * Returns a PreVerifyResult that indicates what action caller should take.
   */
  async preVerifyPayload(incoming: any): Promise<PreVerifyResult> {
    const trace: TraceStep[] = [];
    // normalize incoming proposer/governor for trace
    let normalizedProposer: string | null = null;
    if (incoming?.proposer_wallet) {
      try {
        normalizedProposer = getAddress(String(incoming.proposer_wallet));
        trace.push({ ts: this.nowISO(), step: 'normalize_proposer', ok: true, info: { normalizedProposer } });
      } catch (err) {
        trace.push({ ts: this.nowISO(), step: 'normalize_proposer', ok: false, info: { raw: incoming.proposer_wallet, err: String(err) } });
        normalizedProposer = incoming.proposer_wallet;
      }
    } else {
      trace.push({ ts: this.nowISO(), step: 'normalize_proposer', ok: false, info: { reason: 'no proposer provided' } });
    }

    // tx hash to check
    const txHash = incoming?.tx_hash ?? (incoming?.raw_receipt && incoming.raw_receipt?.transactionHash) ?? null;
    if (!txHash) {
      trace.push({ ts: this.nowISO(), step: 'no_tx_hash', ok: false, info: {} });
      return { outcome: 'TX_NOT_FOUND', trace, reason: 'no_tx_hash' };
    }

    // fetch transaction
    let fetchedTx: any = null;
    try {
      fetchedTx = await this.provider.getTransaction(txHash);
      trace.push({ ts: this.nowISO(), step: 'getTransaction', ok: true, info: { found: !!fetchedTx } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'getTransaction', ok: false, info: { err: String(err) } });
      return { outcome: 'RPC_ERROR', trace, reason: String(err) };
    }

    if (!fetchedTx) {
      trace.push({ ts: this.nowISO(), step: 'tx_not_found', ok: false, info: { txHash } });
      return { outcome: 'TX_NOT_FOUND', trace, reason: 'tx_not_on_rpc' };
    }

    // try to fetch receipt
    let receipt: any = null;
    try {
      receipt = await this.provider.getTransactionReceipt(txHash);
      trace.push({ ts: this.nowISO(), step: 'getTransactionReceipt', ok: true, info: { found: !!receipt } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'getTransactionReceipt', ok: false, info: { err: String(err) } });
      return { outcome: 'RPC_ERROR', trace, reason: String(err) };
    }

    if (!receipt) {
      trace.push({ ts: this.nowISO(), step: 'receipt_not_found', ok: false, info: {} });
      return { outcome: 'AWAITING_CONFIRMATIONS', trace, receipt: null, confirmations: 0 };
    }

    // check receipt.status
    if (receipt?.status === 0) {
      trace.push({ ts: this.nowISO(), step: 'receipt_status', ok: false, info: { status: receipt.status } });
      return { outcome: 'FAILED_TX', trace, receipt };
    }
    trace.push({ ts: this.nowISO(), step: 'receipt_status', ok: true, info: { status: receipt.status } });

    // confirmations
    let confirmations = 0;
    try {
      const currentBlock = await this.provider.getBlockNumber();
      confirmations = receipt.blockNumber ? currentBlock - receipt.blockNumber + 1 : 0;
      const hasEnoughConfs = confirmations >= this.confirmationsThreshold;
      trace.push({ ts: this.nowISO(), step: 'confirmations', ok: hasEnoughConfs, info: { confirmations, threshold: this.confirmationsThreshold } });
      if (!hasEnoughConfs) {
        // still valid tx, but not enough confirmations
        // Attempt to decode logs for authoritative proposer even if insufficient confs (useful)
      }
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'confirmations_fetch_failed', ok: false, info: { err: String(err) } });
    }

    // try decode logs to find authoritative proposer
    let authoritativeProposer: string | null = null;
    try {
      if (Array.isArray(receipt.logs) && receipt.logs.length > 0) {
        const iface = new Interface(GOVERNOR_ABI);
        for (const l of receipt.logs) {
          try {
            const parsed = iface.parseLog(l);
            if (parsed && parsed.name === 'ProposalCreated') {
              const maybe = parsed.args?.proposer ?? parsed.args?.[1] ?? null;
              if (maybe) {
                try {
                  authoritativeProposer = getAddress(String(maybe));
                  trace.push({ ts: this.nowISO(), step: 'parse_log_proposer', ok: true, info: { authoritativeProposer } });
                  break;
                } catch (normErr) {
                  authoritativeProposer = String(maybe);
                  trace.push({ ts: this.nowISO(), step: 'parse_log_proposer_normalize_failed', ok: false, info: { raw: maybe } });
                }
              }
            }
          } catch {
            // ignore non-matching logs
          }
        }
      } else {
        trace.push({ ts: this.nowISO(), step: 'no_logs', ok: false, info: {} });
      }
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'parse_logs_failed', ok: false, info: { err: String(err) } });
    }

    // fallback authoritative proposer -> tx.from
    if (!authoritativeProposer) {
      try {
        const txFrom = fetchedTx?.from ?? receipt?.from ?? null;
        if (txFrom) {
          authoritativeProposer = getAddress(String(txFrom));
          trace.push({ ts: this.nowISO(), step: 'fallback_tx_from', ok: true, info: { authoritativeProposer } });
        } else {
          trace.push({ ts: this.nowISO(), step: 'tx_from_missing', ok: false, info: {} });
        }
      } catch (err) {
        trace.push({ ts: this.nowISO(), step: 'tx_from_normalize_failed', ok: false, info: { err: String(err) } });
      }
    }

    // compare incoming proposer vs authoritative
    let verified = false;
    if (normalizedProposer && authoritativeProposer) {
      try {
        verified = getAddress(String(normalizedProposer)).toLowerCase() === getAddress(String(authoritativeProposer)).toLowerCase();
        trace.push({ ts: this.nowISO(), step: 'compare_proposers', ok: verified, info: { incoming: normalizedProposer, authoritative: authoritativeProposer } });
      } catch (err) {
        trace.push({ ts: this.nowISO(), step: 'compare_proposers_error', ok: false, info: { err: String(err) } });
      }
    } else {
      trace.push({ ts: this.nowISO(), step: 'compare_proposers_missing', ok: false, info: { normalizedProposer, authoritativeProposer } });
    }

    // description_json uuid check if present in incoming
    try {
      if (incoming?.description_json && typeof incoming.description_json === 'object') {
        const descUuid = (incoming.description_json as any)?.proposal_uuid ?? null;
        if (descUuid && incoming?.proposal_uuid && descUuid !== incoming.proposal_uuid) {
          trace.push({ ts: this.nowISO(), step: 'description_uuid_mismatch', ok: false, info: { descUuid, payloadUuid: incoming.proposal_uuid } });
          return { outcome: 'MISMATCH', trace, receipt, authoritativeProposer, confirmations };
        } else if (descUuid && incoming?.proposal_uuid && descUuid === incoming.proposal_uuid) {
          trace.push({ ts: this.nowISO(), step: 'description_uuid_match', ok: true, info: { descUuid } });
        }
      }
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'description_uuid_check_error', ok: false, info: { err: String(err) } });
    }

    // Final outcome selection
    if (receipt && receipt.status === 1 && verified && confirmations >= this.confirmationsThreshold) {
      return { outcome: 'CONFIRMED', trace, receipt, authoritativeProposer, confirmations };
    }

    if (receipt && receipt.status === 1 && confirmations < this.confirmationsThreshold) {
      // transaction mined and successful but not enough confirmations -> await
      return { outcome: 'AWAITING_CONFIRMATIONS', trace, receipt, authoritativeProposer, confirmations };
    }

    if (receipt && receipt.status === 1 && !verified) {
      return { outcome: 'MISMATCH', trace, receipt, authoritativeProposer, confirmations };
    }

    // fallback: if we've gotten here but didn't return, treat as awaiting confirmations
    return { outcome: 'AWAITING_CONFIRMATIONS', trace, receipt, authoritativeProposer, confirmations };
  }

  /**
   * Legacy verification function (post-persist) kept for worker usage.
   * You may keep the existing verifyProposal implementation for scheduled retries.
   */
  async verifyProposal(proposal: Proposal): Promise<Proposal> {
    // Existing implementation (not repeated here for brevity).
    // You can keep/adjust the current verifyProposal logic.
    // For brevity in this file snippet, call a simpler wrapper or reuse preVerifyPayload.
    // Here we call preVerifyPayload and then update the persisted Proposal accordingly.
    const incoming = { ...proposal };
    const pre = await this.preVerifyPayload(incoming);
    // apply results back to proposal and save
    let updated: any = { ...proposal };

    if (pre.outcome === 'CONFIRMED') {
      updated.status = 'CONFIRMED';
      updated.raw_receipt = (pre as any).receipt ?? updated.raw_receipt;
      updated.proposer_verified = { trace: pre.trace, verified: true, authoritativeProposer: (pre as any).authoritativeProposer ?? null };
      updated.confirmed_at = new Date();
    } else if (pre.outcome === 'AWAITING_CONFIRMATIONS') {
      updated.status = 'AWAITING_CONFIRMATIONS';
      updated.raw_receipt = (pre as any).receipt ?? updated.raw_receipt;
      updated.proposer_verified = { trace: pre.trace, verified: !!((pre as any).authoritativeProposer) };
    } else if (pre.outcome === 'FAILED_TX') {
      updated.status = 'FAILED_TX';
      updated.raw_receipt = (pre as any).receipt ?? updated.raw_receipt;
      updated.proposer_verified = { trace: pre.trace, verified: false };
    } else if (pre.outcome === 'MISMATCH') {
      updated.status = 'MISMATCH';
      updated.raw_receipt = (pre as any).receipt ?? updated.raw_receipt;
      updated.proposer_verified = { trace: pre.trace, verified: false, authoritativeProposer: (pre as any).authoritativeProposer ?? null };
    } else {
      // tx_not_found / RPC_ERROR -> keep awaiting
      updated.status = 'AWAITING_CONFIRMATIONS';
      updated.proposer_verified = { trace: pre.trace, verified: false };
    }

    const saved = await this.proposalRepo.save(updated);
    this.logger.log(`verifyProposal updated ${saved.proposal_uuid} => ${saved.status}`);
    return saved;
  }




}


