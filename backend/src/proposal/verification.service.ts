// src/proposals/verification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Proposal } from '../entity/proposal.entity';
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
      // optional on-chain parsed description fields — present when we parsed ProposalCreated.description
      description_raw?: string | null;
      description_json?: any | null;
    }
  | {
      outcome: 'TX_NOT_FOUND' | 'RPC_ERROR';
      trace: TraceStep[];
      reason?: string;
      description_raw?: string | null;
      description_json?: any | null;
    };





@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  // provider is optional: when not configured we will not attempt RPC calls on receive
  private provider: JsonRpcProvider | null = null;
  private confirmationsThreshold: number;

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
  ) {
    // Only create a JsonRpcProvider if a real RPC URL is provided via env.
    const url = process.env.CHAIN_RPC_URL || process.env.RPC_URL || null;
    if (url) {
      try {
        this.provider = new JsonRpcProvider(url);
        this.logger.log(`VerificationService initialized; RPC=${url}`);
      } catch (err) {
        this.logger.warn(`Failed to construct JsonRpcProvider for url=${url}: ${String(err)} - disabling on-receive pre-verification`);
        this.provider = null;
      }
    } else {
      this.logger.log('No CHAIN_RPC_URL / RPC_URL configured; on-receive pre-verification disabled (incoming proposals will be staged).');
      this.provider = null;
    }

    // prefer CONFIRMATIONS_REQUIRED env name, fallback to CONFIRMATIONS_THRESHOLD then 5
    this.confirmationsThreshold = Number(process.env.CONFIRMATIONS_REQUIRED ?? process.env.CONFIRMATIONS_THRESHOLD ?? 5);
    this.logger.log(`confirmationsThreshold=${this.confirmationsThreshold}`);
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
   * If provider is not configured or unreachable, this function returns TX_NOT_FOUND
   * so caller will stage the payload instead of failing the request.
   */
  async preVerifyPayload(incoming: any): Promise<PreVerifyResult> {
    const trace: TraceStep[] = [];

    // If no provider configured, immediately return TX_NOT_FOUND so the caller stages the payload.
    if (!this.provider) {
      trace.push({ ts: this.nowISO(), step: 'no_rpc_provider', ok: false, info: { reason: 'no CHAIN_RPC_URL / RPC_URL configured' } });
      this.logger.warn('preVerifyPayload: no RPC provider configured - returning TX_NOT_FOUND so payload will be staged');
      return { outcome: 'TX_NOT_FOUND', trace, reason: 'no_rpc_provider' };
    }

    // Normalize incoming proposer for traceability
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

    // fetch transaction (guard with try/catch for RPC errors)
    let fetchedTx: any = null;
    try {
      fetchedTx = await this.provider.getTransaction(txHash);
      trace.push({ ts: this.nowISO(), step: 'getTransaction', ok: true, info: { found: !!fetchedTx } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'getTransaction', ok: false, info: { err: String(err) } });
      this.logger.warn(`preVerifyPayload: RPC getTransaction failed (${String(err)}). Will instruct caller to stage payload.`);
      // treat provider errors as "stage the payload" (don't block the frontend)
      return { outcome: 'TX_NOT_FOUND', trace, reason: 'rpc_getTransaction_failed' };
    }

    if (!fetchedTx) {
      trace.push({ ts: this.nowISO(), step: 'tx_not_found', ok: false, info: { txHash } });
      return { outcome: 'TX_NOT_FOUND', trace, reason: 'tx_not_on_rpc' };
    }

    // fetch receipt
    let receipt: any = null;
    try {
      receipt = await this.provider.getTransactionReceipt(txHash);
      trace.push({ ts: this.nowISO(), step: 'getTransactionReceipt', ok: true, info: { found: !!receipt } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'getTransactionReceipt', ok: false, info: { err: String(err) } });
      this.logger.warn(`preVerifyPayload: RPC getTransactionReceipt failed (${String(err)}). Will instruct caller to stage payload.`);
      return { outcome: 'TX_NOT_FOUND', trace, reason: 'rpc_getTransactionReceipt_failed' };
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
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'confirmations_fetch_failed', ok: false, info: { err: String(err) } });
    }






    // attempt to decode logs for authoritative proposer
    // Try parse logs for ProposalCreated and extract description
    let authoritativeProposer: string | null = null;
    let parsedDescriptionRaw: string | null = null;
    let parsedDescriptionJson: any = null;
    try {
      if (Array.isArray(receipt.logs) && receipt.logs.length > 0) {
        const iface = new Interface(GOVERNOR_ABI);
        for (const l of receipt.logs) {
          try {
            const parsed = iface.parseLog(l);
            if (parsed && parsed.name === 'ProposalCreated') {
              // args: id, proposer, targets, values, calldatas, startBlock, endBlock, description
              const maybe = parsed.args?.proposer ?? parsed.args?.[1] ?? null;
              const desc = parsed.args?.description ?? parsed.args?.[7] ?? null;
              if (maybe) {
                try {
                  authoritativeProposer = getAddress(String(maybe));
                  trace.push({ ts: this.nowISO(), step: 'parse_log_proposer', ok: true, info: { authoritativeProposer } });
                } catch (normErr) {
                  authoritativeProposer = String(maybe);
                  trace.push({ ts: this.nowISO(), step: 'parse_log_proposer_normalize_failed', ok: false, info: { raw: maybe } });
                }
              }
              if (desc) {
                parsedDescriptionRaw = String(desc);
                trace.push({ ts: this.nowISO(), step: 'parse_log_description_raw', ok: true, info: { length: parsedDescriptionRaw.length } });
                // try to parse as json
                try {
                  const dj = JSON.parse(parsedDescriptionRaw);
                  parsedDescriptionJson = dj;
                  trace.push({ ts: this.nowISO(), step: 'parse_log_description_json', ok: true, info: { keys: Object.keys(dj) } });
                } catch (parseErr) {
                  trace.push({ ts: this.nowISO(), step: 'parse_log_description_json_parse_failed', ok: false, info: { err: String(parseErr) } });
                }
              }
              // Found the relevant event; stop searching further logs
              break;
            }
          } catch (err) {
            // ignore non-matching log parse errors
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
          return { outcome: 'MISMATCH', trace, receipt, authoritativeProposer, confirmations, description_raw: parsedDescriptionRaw, description_json: parsedDescriptionJson };
        } else if (descUuid && incoming?.proposal_uuid && descUuid === incoming.proposal_uuid) {
          trace.push({ ts: this.nowISO(), step: 'description_uuid_match', ok: true, info: { descUuid } });
        }
      }
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'description_uuid_check_error', ok: false, info: { err: String(err) } });
    }

    // Final outcome selection and attach parsed description fields so caller can use them
    if (receipt && receipt.status === 1 && verified && confirmations >= this.confirmationsThreshold) {
      return { outcome: 'CONFIRMED', trace, receipt, authoritativeProposer, confirmations, description_raw: parsedDescriptionRaw, description_json: parsedDescriptionJson };
    }

    if (receipt && receipt.status === 1 && confirmations < this.confirmationsThreshold) {
      return { outcome: 'AWAITING_CONFIRMATIONS', trace, receipt, authoritativeProposer, confirmations, description_raw: parsedDescriptionRaw, description_json: parsedDescriptionJson };
    }

    if (receipt && receipt.status === 1 && !verified) {
      return { outcome: 'MISMATCH', trace, receipt, authoritativeProposer, confirmations, description_raw: parsedDescriptionRaw, description_json: parsedDescriptionJson };
    }

    return { outcome: 'AWAITING_CONFIRMATIONS', trace, receipt, authoritativeProposer, confirmations, description_raw: parsedDescriptionRaw, description_json: parsedDescriptionJson };
  }





  /**
   * Legacy verification function (post-persist) kept for worker usage.
   * Example usage: scheduler calls verifyProposal for persisted rows.
   */
  async verifyProposal(proposal: Proposal): Promise<Proposal> {
    const incoming = { ...proposal };
    const pre = await this.preVerifyPayload(incoming);
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
      updated.status = 'AWAITING_CONFIRMATIONS';
      updated.proposer_verified = { trace: pre.trace, verified: false };
    }

    const saved = await this.proposalRepo.save(updated);
    this.logger.log(`verifyProposal updated ${saved.proposal_uuid} => ${saved.status}`);
    return saved;


  }






}




