// src/proposals/verification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Proposal } from '../entity/proposal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { getAddress, Interface, JsonRpcProvider } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();





/**
 * Helper function to safely convert BigInt values to strings for JSON serialization
 */
function stringifyBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => stringifyBigInts(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = stringifyBigInts(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}



/**
 * Minimal ABI for ProposalCreated event.
 */
// const GOVERNOR_ABI = [
//   {
//     anonymous: false,
//     inputs: [
//       { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
//       { indexed: true, internalType: 'address', name: 'proposer', type: 'address' },
//       { indexed: false, internalType: 'address[]', name: 'targets', type: 'address[]' },
//       { indexed: false, internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
//       { indexed: false, internalType: 'bytes[]', name: 'calldatas', type: 'bytes[]' },
//       { indexed: false, internalType: 'uint256', name: 'startBlock', type: 'uint256' },
//       { indexed: false, internalType: 'uint256', name: 'endBlock', type: 'uint256' },
//       { indexed: false, internalType: 'string', name: 'description', type: 'string' },
//     ],
//     name: 'ProposalCreated',
//     type: 'event',
//   },
// ];


/**
 * Minimal ABI for ProposalCreated event.
 *
 * NOTE: The deployed governor implementation includes an extra `string[] signatures`
 * parameter between `values` and `calldatas`. The explorer-decoded shape is:
 *
 *   ProposalCreated(
 *     uint256 proposalId,
 *     address proposer,
 *     address[] targets,
 *     uint256[] values,
 *     string[] signatures,   // present on-chain
 *     bytes[] calldatas,
 *     uint256 startBlock,
 *     uint256 endBlock,
 *     string description
 *   )
 *
 * We construct a minimal event ABI that matches that deployed signature exactly so
 * ethers.Interface.parseLog can decode logs reliably.
 */
const GOVERNOR_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'proposer', type: 'address' },
      { indexed: false, internalType: 'address[]', name: 'targets', type: 'address[]' },
      { indexed: false, internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
      { indexed: false, internalType: 'string[]', name: 'signatures', type: 'string[]' },
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

      // canonical on-chain metadata extracted from ProposalCreated
      chain_proposal_id?: string | null;
      voting_start_block?: number | null;
      voting_end_block?: number | null;
      // raw parsed ProposalCreated event args for auditing
      event_payload?: any | null;
    }
  | {
      outcome: 'TX_NOT_FOUND' | 'RPC_ERROR';
      trace: TraceStep[];
      reason?: string;
      description_raw?: string | null;
      description_json?: any | null;

      chain_proposal_id?: string | null;
      voting_start_block?: number | null;
      voting_end_block?: number | null;
      event_payload?: any | null;
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

    const short = (o: any, n = 800) => {
      try {
        // Use helper to convert BigInts before stringifying
        const cleaned = stringifyBigInts(o);
        return JSON.stringify(cleaned, null, 2).slice(0, n);
      } catch {
        return String(o);
      }
    };

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

    // fetch transaction
    let fetchedTx: any = null;
    try {
      fetchedTx = await this.provider.getTransaction(txHash);
      trace.push({ ts: this.nowISO(), step: 'getTransaction', ok: true, info: { found: !!fetchedTx } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'getTransaction', ok: false, info: { err: String(err) } });
      this.logger.warn(`preVerifyPayload: RPC getTransaction failed (${String(err)}). Will instruct caller to stage payload.`);
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
    let authoritativeProposer: string | null = null;
    let parsedDescriptionRaw: string | null = null;
    let parsedDescriptionJson: any = null;
    let parsedChainProposalId: string | null = null;
    let parsedStartBlock: number | null = null;
    let parsedEndBlock: number | null = null;
    let parsedEventPayload: any | null = null;

    try {
      if (Array.isArray(receipt.logs) && receipt.logs.length > 0) {
        const iface = new Interface(GOVERNOR_ABI);

        // debug: expected topic (cast to any to avoid types error)
        try {
          const expectedTopic = (iface as any).getEventTopic ? (iface as any).getEventTopic('ProposalCreated') : null;
          this.logger.debug(`preVerifyPayload: expected ProposalCreated topic=${expectedTopic}`);
        } catch (e) { /* ignore */ }

        // iterate logs and try parseLog for each
        for (const [i, l] of receipt.logs.entries()) {
          try {
            // debug sample for first few logs
            if (i < 3) {
              try {
                this.logger.debug(`preVerifyPayload: log[${i}] address=${l.address} topics=${JSON.stringify(Array.isArray(l.topics) ? l.topics.slice(0,5) : l.topics)} dataLen=${String(l.data)?.length ?? 0}`);
              } catch {}
            }

            // parse; parseLog may throw if ABI doesn't match this log
            let parsed: any = null;
            try {
              parsed = iface.parseLog(l);
            } catch (parseErr) {
              trace.push({
                ts: this.nowISO(),
                step: 'parse_log_error',
                ok: false,
                info: { err: String(parseErr), logTopics: Array.isArray(l.topics) ? l.topics.slice(0,5) : l.topics, dataLen: String(l.data)?.length ?? 0 },
              });
              this.logger.debug(`preVerifyPayload: parseLog failed for receipt log[${i}] (topics[0]=${l.topics?.[0]}). err=${String((parseErr as Error).message ?? parseErr)}`);
              continue;
            }

            if (parsed && parsed.name === 'ProposalCreated') {
              // The implementation we observed on-chain uses:
              // [proposalId, proposer, targets, values, signatures, calldatas, startBlock, endBlock, description]
              // We'll attempt to read by both named args and fallback to positional indices to be robust.
              const idArg = parsed.args?.proposalId ?? parsed.args?.id ?? parsed.args?.[0] ?? null;
              const maybe = parsed.args?.proposer ?? parsed.args?.[1] ?? null;
              const targetsArg = parsed.args?.targets ?? parsed.args?.[2] ?? null;
              const valuesArg = parsed.args?.values ?? parsed.args?.[3] ?? null;
              const signaturesArg = parsed.args?.signatures ?? parsed.args?.[4] ?? null;
              const calldatasArg = parsed.args?.calldatas ?? parsed.args?.[5] ?? null;
              const startArg = parsed.args?.startBlock ?? parsed.args?.[6] ?? null;
              const endArg = parsed.args?.endBlock ?? parsed.args?.[7] ?? null;
              const desc = parsed.args?.description ?? parsed.args?.[8] ?? null;



              parsedEventPayload = { name: parsed.name, args: parsed.args, topic: parsed.topic ?? null };


              // Convert proposal ID to string
              if (idArg !== null && idArg !== undefined) {
                parsedChainProposalId =
                  typeof idArg === 'bigint'
                    ? idArg.toString()
                    : typeof idArg === 'object' && idArg.toString
                    ? idArg.toString()
                    : String(idArg);
                trace.push({
                  ts: this.nowISO(),
                  step: 'parse_log_proposal_id',
                  ok: true,
                  info: { chain_proposal_id: parsedChainProposalId },
                });
              }



              // proposer
              if (maybe) {
                try {
                  authoritativeProposer = getAddress(String(maybe));
                  trace.push({ ts: this.nowISO(), step: 'parse_log_proposer', ok: true, info: { authoritativeProposer } });
                } catch (normErr) {
                  authoritativeProposer = String(maybe);
                  trace.push({ ts: this.nowISO(), step: 'parse_log_proposer_normalize_failed', ok: false, info: { raw: maybe } });
                }
              }

              // description
              if (desc) {
                parsedDescriptionRaw = String(desc);
                trace.push({ ts: this.nowISO(), step: 'parse_log_description_raw', ok: true, info: { length: parsedDescriptionRaw.length } });
                try {
                  const dj = JSON.parse(parsedDescriptionRaw);
                  parsedDescriptionJson = dj;
                  trace.push({ ts: this.nowISO(), step: 'parse_log_description_json', ok: true, info: { keys: Object.keys(dj) } });
                } catch (parseErr) {
                  trace.push({ ts: this.nowISO(), step: 'parse_log_description_json_parse_failed', ok: false, info: { err: String(parseErr) } });
                }
              }

              // numeric canonical fields
              try {
                // if (idArg !== null && idArg !== undefined) {
                //   parsedChainProposalId = typeof idArg === 'object' && idArg.toString ? idArg.toString() : String(idArg);
                //   trace.push({ ts: this.nowISO(), step: 'parse_log_proposal_id', ok: true, info: { chain_proposal_id: parsedChainProposalId } });
                // }
                if (startArg !== null && startArg !== undefined) {
                  const s = Number(startArg?.toString?.() ?? startArg);
                  if (!Number.isNaN(s)) parsedStartBlock = s;
                  trace.push({ ts: this.nowISO(), step: 'parse_log_start_block', ok: parsedStartBlock !== null, info: { startBlock: parsedStartBlock } });
                }
                if (endArg !== null && endArg !== undefined) {
                  const e = Number(endArg?.toString?.() ?? endArg);
                  if (!Number.isNaN(e)) parsedEndBlock = e;
                  trace.push({ ts: this.nowISO(), step: 'parse_log_end_block', ok: parsedEndBlock !== null, info: { endBlock: parsedEndBlock } });
                }
              } catch (numErr) {
                trace.push({ ts: this.nowISO(), step: 'parse_log_numeric_failed', ok: false, info: String(numErr) });
              }


              // include signatures/calldatas in event payload for auditing if present
              try {
                // (parsedEventPayload as any).parsed = {
                //   proposalId: parsedChainProposalId,
                //   proposer: authoritativeProposer,
                //   targets: targetsArg,
                //   values: valuesArg,
                //   signatures: signaturesArg,
                //   calldatas: calldatasArg,
                // };

                parsedEventPayload = stringifyBigInts({
                name: parsed.name,
                args: parsed.args,
                topic: parsed.topic ?? null,
                parsed: {
                  proposalId: parsedChainProposalId,
                  proposer: authoritativeProposer,
                  targets: targetsArg,
                  values: valuesArg,
                  signatures: signaturesArg,
                  calldatas: calldatasArg,
                },
              });
              } catch {}




              // debug summary and stop searching logs
              try {
                this.logger.log(`parseLog FOUND ProposalCreated — id=${parsedChainProposalId} start=${parsedStartBlock} end=${parsedEndBlock} descLen=${parsedDescriptionRaw ? parsedDescriptionRaw.length : 0}`);
                this.logger.debug(`parseLog event_payload (short): ${short(parsedEventPayload, 1000)}`);
              } catch {}
              break;
            } // end if parsed.name
          } catch (outerErr) {
            trace.push({ ts: this.nowISO(), step: 'parse_log_unexpected_error', ok: false, info: String(outerErr) });
            this.logger.debug(`preVerifyPayload: unexpected error while parsing a log: ${String(outerErr)}`);
            continue;
          }
        } // end for logs

        // if logs present but we didn't find event, log sample
        if (Array.isArray(receipt.logs) && receipt.logs.length > 0 && !parsedEventPayload) {
          try {
            const sample = receipt.logs.slice(0, 3).map((l: any, i: number) => ({ i, address: l.address, topics: Array.isArray(l.topics) ? l.topics.slice(0, 3) : l.topics }));
            this.logger.debug(`preVerifyPayload: receipt.logs present (${receipt.logs.length}) but no ProposalCreated event parsed. sample logs: ${short(sample, 1000)}`);
          } catch {}
        }
      } else {
        trace.push({ ts: this.nowISO(), step: 'no_logs', ok: false, info: {} });
        this.logger.debug('preVerifyPayload: receipt has no logs to parse');
      }
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'parse_logs_failed', ok: false, info: { err: String(err) } });
      this.logger.warn(`preVerifyPayload: parse_logs_failed: ${String(err)}`);
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

    // description_uuid check
    try {
      if (incoming?.description_json && typeof incoming.description_json === 'object') {
        const descUuid = (incoming.description_json as any)?.proposal_uuid ?? null;
        if (descUuid && incoming?.proposal_uuid && descUuid !== incoming.proposal_uuid) {
          trace.push({ ts: this.nowISO(), step: 'description_uuid_mismatch', ok: false, info: { descUuid, payloadUuid: incoming.proposal_uuid } });
          const out: PreVerifyResult = {
            outcome: 'MISMATCH',
            trace,
            receipt: stringifyBigInts(receipt),
            authoritativeProposer,
            confirmations,
            description_raw: parsedDescriptionRaw,
            description_json: parsedDescriptionJson,
            chain_proposal_id: parsedChainProposalId,
            voting_start_block: parsedStartBlock,
            voting_end_block: parsedEndBlock,
            event_payload: parsedEventPayload,
          } as PreVerifyResult;
          this.logger.log(`preVerifyPayload -> MISMATCH (short): chain_proposal_id=${parsedChainProposalId} start=${parsedStartBlock} end=${parsedEndBlock} descJsonKeys=${parsedDescriptionJson ? Object.keys(parsedDescriptionJson) : 'none'}`);
          return out;
        } else if (descUuid && incoming?.proposal_uuid && descUuid === incoming.proposal_uuid) {
          trace.push({ ts: this.nowISO(), step: 'description_uuid_match', ok: true, info: { descUuid } });
        }
      }
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'description_uuid_check_error', ok: false, info: { err: String(err) } });
    }

    // Final outcome
    if (receipt && receipt.status === 1 && verified && confirmations >= this.confirmationsThreshold) {
      const out: PreVerifyResult = {
        outcome: 'CONFIRMED',
        trace,
        receipt: stringifyBigInts(receipt),
        authoritativeProposer,
        confirmations,
        description_raw: parsedDescriptionRaw,
        description_json: parsedDescriptionJson,
        chain_proposal_id: parsedChainProposalId,
        voting_start_block: parsedStartBlock,
        voting_end_block: parsedEndBlock,
        event_payload: parsedEventPayload,
      } as PreVerifyResult;
      this.logger.log(`preVerifyPayload -> CONFIRMED (short): chain_proposal_id=${parsedChainProposalId} start=${parsedStartBlock} end=${parsedEndBlock} confirmations=${confirmations}`);
      return out;
    }

    if (receipt && receipt.status === 1 && confirmations < this.confirmationsThreshold) {
      const out: PreVerifyResult = {
        outcome: 'AWAITING_CONFIRMATIONS',
        trace,
        receipt: stringifyBigInts(receipt),
        authoritativeProposer,
        confirmations,
        description_raw: parsedDescriptionRaw,
        description_json: parsedDescriptionJson,
        chain_proposal_id: parsedChainProposalId,
        voting_start_block: parsedStartBlock,
        voting_end_block: parsedEndBlock,
        event_payload: parsedEventPayload,
      } as PreVerifyResult;
      this.logger.log(`preVerifyPayload -> AWAITING_CONFIRMATIONS (short): chain_proposal_id=${parsedChainProposalId} start=${parsedStartBlock} end=${parsedEndBlock} confirmations=${confirmations}`);
      return out;
    }

    if (receipt && receipt.status === 1 && !verified) {
      const out: PreVerifyResult = {
        outcome: 'MISMATCH',
        trace,
        receipt: stringifyBigInts(receipt),
        authoritativeProposer,
        confirmations,
        description_raw: parsedDescriptionRaw,
        description_json: parsedDescriptionJson,
        chain_proposal_id: parsedChainProposalId,
        voting_start_block: parsedStartBlock,
        voting_end_block: parsedEndBlock,
        event_payload: parsedEventPayload,
      } as PreVerifyResult;
      this.logger.log(`preVerifyPayload -> MISMATCH (verified=false) (short): chain_proposal_id=${parsedChainProposalId} start=${parsedStartBlock} end=${parsedEndBlock} confirmations=${confirmations}`);
      return out;
    }

    const out: PreVerifyResult = {
      outcome: 'AWAITING_CONFIRMATIONS',
      trace,
      receipt: stringifyBigInts(receipt),
      authoritativeProposer,
      confirmations,
      description_raw: parsedDescriptionRaw,
      description_json: parsedDescriptionJson,
      chain_proposal_id: parsedChainProposalId,
      voting_start_block: parsedStartBlock,
      voting_end_block: parsedEndBlock,
      event_payload: parsedEventPayload,
    } as PreVerifyResult;
    this.logger.log(`preVerifyPayload -> default AWAITING_CONFIRMATIONS (short): chain_proposal_id=${parsedChainProposalId} start=${parsedStartBlock} end=${parsedEndBlock} confirmations=${confirmations}`);
    return out;
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




