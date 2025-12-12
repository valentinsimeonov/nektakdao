// src/vote/vote.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../entity/vote.entity';
import { VoteStaging } from '../entity/vote_staging.entity';
import { Proposal } from '../entity/proposal.entity';
import { getAddress, Interface, JsonRpcProvider } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

type IncomingVotePayload = {
  id?: string; // DB proposal id (uuid) from frontend
  tx_hash?: string;
  chain_proposal_id?: string;
  voter_address?: string;
  support?: number; // 0 | 1 | 2
  governor_address?: string;
  chain?: string;
  chain_id?: number;
  block_number?: number;
  raw_receipt?: any;
  created_at?: string;
};

@Injectable()
export class VoteService {
  private readonly logger = new Logger(VoteService.name);
  private provider: JsonRpcProvider | null = null;
  private confirmationsThreshold: number;

  private VOTE_ABI = [
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
        { indexed: false, internalType: 'uint8', name: 'support', type: 'uint8' },
        { indexed: false, internalType: 'uint256', name: 'weight', type: 'uint256' },
      ],
      name: 'VoteCast',
      type: 'event',
    },
  ];

  constructor(
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,

    @InjectRepository(VoteStaging)
    private readonly voteStagingRepo: Repository<VoteStaging>,

    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
  ) {
    const url = process.env.CHAIN_RPC_URL || process.env.RPC_URL || null;
    if (url) {
      try {
        this.provider = new JsonRpcProvider(url);
        this.logger.log(`VoteService: RPC provider configured ${url}`);
      } catch (err) {
        this.logger.warn(`VoteService: failed to init RPC provider: ${String(err)} - provider disabled`);
        this.provider = null;
      }
    } else {
      this.logger.log('VoteService: no RPC configured - on-receive verification disabled (staging will be used)');
      this.provider = null;
    }

    this.confirmationsThreshold = Number(process.env.CONFIRMATIONS_REQUIRED ?? process.env.CONFIRMATIONS_THRESHOLD ?? 3);
    this.logger.log(`VoteService: confirmationsThreshold=${this.confirmationsThreshold}`);
  }

  private nowISO() { return new Date().toISOString(); }

  private async preVerifyVote(incoming: IncomingVotePayload) {
    const trace: any[] = [];
    if (!this.provider) {
      trace.push({ ts: this.nowISO(), step: 'no_rpc', ok: false, info: { reason: 'no RPC provider configured' } });
      return { outcome: 'TX_NOT_FOUND', trace } as any;
    }

    const txHash = incoming.tx_hash ?? (incoming.raw_receipt && incoming.raw_receipt.transactionHash) ?? null;
    if (!txHash) {
      trace.push({ ts: this.nowISO(), step: 'no_tx_hash', ok: false });
      return { outcome: 'TX_NOT_FOUND', trace };
    }

    let fetchedTx: any = null;
    try {
      fetchedTx = await this.provider.getTransaction(txHash);
      trace.push({ ts: this.nowISO(), step: 'getTransaction', ok: true, info: { found: !!fetchedTx } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'getTransaction_error', ok: false, info: String(err) });
      return { outcome: 'RPC_ERROR', trace, reason: 'getTransaction_failed' };
    }
    if (!fetchedTx) {
      trace.push({ ts: this.nowISO(), step: 'tx_missing', ok: false, info: { txHash } });
      return { outcome: 'TX_NOT_FOUND', trace };
    }

    let receipt: any = null;
    try {
      receipt = await this.provider.getTransactionReceipt(txHash);
      trace.push({ ts: this.nowISO(), step: 'getReceipt', ok: true, info: { found: !!receipt } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'getReceipt_error', ok: false, info: String(err) });
      return { outcome: 'RPC_ERROR', trace, reason: 'getReceipt_failed' };
    }

    if (!receipt) {
      return { outcome: 'AWAITING_CONFIRMATIONS', trace, confirmations: 0, receipt: null };
    }

    if (receipt.status === 0) {
      trace.push({ ts: this.nowISO(), step: 'receipt_status', ok: false, info: { status: receipt.status } });
      return { outcome: 'FAILED_TX', trace, receipt };
    }
    trace.push({ ts: this.nowISO(), step: 'receipt_status', ok: true, info: { status: receipt.status } });

    let confirmations = 0;
    try {
      const current = await this.provider.getBlockNumber();
      confirmations = receipt.blockNumber ? current - receipt.blockNumber + 1 : 0;
      trace.push({ ts: this.nowISO(), step: 'confirmations', ok: confirmations >= this.confirmationsThreshold, info: { confirmations } });
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'confirmations_error', ok: false, info: String(err) });
    }

    let parsedEvent: any = null;
    try {
      if (Array.isArray(receipt.logs) && receipt.logs.length > 0) {
        const iface = new Interface(this.VOTE_ABI);
        for (const l of receipt.logs) {
          try {
            const parsed = iface.parseLog(l);
            if (parsed && parsed.name === 'VoteCast') {
              parsedEvent = {
                voter: getAddress(String(parsed.args?.voter)),
                proposalId: (parsed.args?.proposalId?.toString?.() ?? String(parsed.args?.proposalId)),
                support: Number(parsed.args?.support ?? 0),
                weight: parsed.args?.weight?.toString?.() ?? String(parsed.args?.weight ?? '0'),
                raw: parsed,
              };
              trace.push({ ts: this.nowISO(), step: 'parsed_vote_event', ok: true, info: parsedEvent });
              break;
            }
          } catch {
            continue;
          }
        }

        if (!parsedEvent) {
          trace.push({ ts: this.nowISO(), step: 'no_vote_event', ok: false, info: { logs: receipt.logs.length } });
        }
      } else {
        trace.push({ ts: this.nowISO(), step: 'no_logs', ok: false });
      }
    } catch (err) {
      trace.push({ ts: this.nowISO(), step: 'parse_logs_error', ok: false, info: String(err) });
    }

    let matches = true;
    if (parsedEvent) {
      if (incoming.voter_address) {
        try {
          matches = getAddress(String(incoming.voter_address)).toLowerCase() === parsedEvent.voter.toLowerCase();
          trace.push({ ts: this.nowISO(), step: 'compare_voter', ok: matches, info: { incoming: incoming.voter_address, parsed: parsedEvent.voter } });
        } catch (e) {
          trace.push({ ts: this.nowISO(), step: 'compare_voter_error', ok: false, info: String(e) });
          matches = false;
        }
      }
      if (matches && incoming.chain_proposal_id) {
        try {
          matches = String(incoming.chain_proposal_id) === String(parsedEvent.proposalId);
          trace.push({ ts: this.nowISO(), step: 'compare_proposal', ok: matches, info: { incoming: incoming.chain_proposal_id, parsed: parsedEvent.proposalId } });
        } catch (e) {
          trace.push({ ts: this.nowISO(), step: 'compare_proposal_error', ok: false, info: String(e) });
          matches = false;
        }
      }
    }

    if (parsedEvent && receipt.status === 1 && matches && confirmations >= this.confirmationsThreshold) {
      return { outcome: 'CONFIRMED', trace, parsedEvent, receipt, confirmations };
    }

    if (parsedEvent && receipt.status === 1 && matches) {
      return { outcome: 'AWAITING_CONFIRMATIONS', trace, parsedEvent, receipt, confirmations };
    }

    if (receipt && (!parsedEvent || !matches)) {
      return { outcome: 'MISMATCH', trace, parsedEvent, receipt, confirmations };
    }

    return { outcome: 'AWAITING_CONFIRMATIONS', trace, receipt, confirmations };
  }

  // *** NOTE: include Vote in the return union so TypeScript accepts returning Vote instances ***
  public async recordVote(incoming: IncomingVotePayload): Promise<Proposal | VoteStaging | Vote> {
    const payload = { ...incoming };
    try {
      if (payload.voter_address) payload.voter_address = getAddress(String(payload.voter_address));
    } catch (e) { /* keep raw if normalization fails */ }

    // Dedup by tx_hash
    if (payload.tx_hash) {
      const found = await this.voteRepo.findOne({ where: { tx_hash: payload.tx_hash } });
      if (found) {
        this.logger.log(`recordVote: duplicate tx_hash=${payload.tx_hash} -> returning existing vote id=${found.id}`);
        if (found.proposal_id) {
          const p = await this.proposalRepo.findOne({ where: { id: found.proposal_id } });
          if (p) return p;
        }
        return found;
      }
    }

    // Dedup by (proposal_id, voter_address)
    if (payload.id && payload.voter_address) {
      const existing = await this.voteRepo.findOne({ where: { proposal_id: payload.id, voter_address: payload.voter_address } });
      if (existing) {
        this.logger.log(`recordVote: voter ${payload.voter_address} already voted on proposal ${payload.id} -> returning existing`);
        if (existing.proposal_id) {
          const p = await this.proposalRepo.findOne({ where: { id: existing.proposal_id } });
          if (p) return p;
        }
        return existing;
      }
    }

    let pre: any;
    try {
      pre = await this.preVerifyVote(payload);
    } catch (err) {
      this.logger.warn(`recordVote: preVerifyVote failed: ${String(err)} - falling back to staging`);
      pre = { outcome: 'TX_NOT_FOUND', trace: [{ ts: this.nowISO(), step: 'preVerify_failed', ok: false, info: String(err) }] };
    }

    if (pre.outcome === 'TX_NOT_FOUND' || pre.outcome === 'RPC_ERROR') {
      const expiresAt = new Date(Date.now() + Number(process.env.MAX_WAIT_MS ?? 10 * 60 * 1000));
      const staged = this.voteStagingRepo.create({
        proposal_id: payload.id ?? null,
        tx_hash: payload.tx_hash ?? null,
        payload,
        verification_trace: pre.trace ?? [],
        status: 'PENDING',
        attempts: 0,
        expires_at: expiresAt,
      });
      const saved = await this.voteStagingRepo.save(staged);
      this.logger.log(`Created VoteStaging id=${saved.id} tx=${saved.tx_hash}`);
      return saved;
    }

    if (pre.outcome === 'CONFIRMED' || pre.outcome === 'AWAITING_CONFIRMATIONS') {
      const vote = this.voteRepo.create({
        proposal_id: payload.id ?? null,
        tx_hash: payload.tx_hash ?? null,
        voter_address: payload.voter_address ?? (pre.parsedEvent?.voter ?? null),
        chain_proposal_id: payload.chain_proposal_id ?? (pre.parsedEvent?.proposalId ?? null),
        support: payload.support ?? (pre.parsedEvent?.support ?? 1),
        weight: String(pre.parsedEvent?.weight ?? '0'),
        governor_address: payload.governor_address ?? null,
        chain: payload.chain ?? null,
        chain_id: payload.chain_id ?? null,
        block_number: payload.block_number ?? (pre.receipt?.blockNumber ?? null),
        raw_receipt: pre.receipt ?? null,
        status: pre.outcome === 'CONFIRMED' ? 'CONFIRMED' : 'AWAITING_CONFIRMATIONS',
        verification_trace: pre.trace ?? [],
        confirmed_at: pre.outcome === 'CONFIRMED' ? new Date() : null,
      } as any);





    // save may return Vote or Vote[] (TypeORM). Narrow at runtime to satisfy TS safely.
    const res = await this.voteRepo.save(vote);
    let savedVote: Vote;
    if (Array.isArray(res)) {
        if (res.length === 0) throw new Error('voteRepo.save returned empty array');
        savedVote = res[0];
        } else {
        savedVote = res;
    }
    this.logger.log(`Saved Vote id=${savedVote.id} status=${savedVote.status} tx=${savedVote.tx_hash}`);






      if (savedVote.status === 'CONFIRMED' && savedVote.proposal_id) {
        const p = await this.proposalRepo.findOne({ where: { id: savedVote.proposal_id } });
        if (p) {
          if (Number(savedVote.support) === 1) {
            p.votesUp = (p.votesUp ?? 0) + 1;
          } else if (Number(savedVote.support) === 0) {
            p.votesDown = (p.votesDown ?? 0) + 1;
          }
          p.updated_at = new Date();
          const savedP = await this.proposalRepo.save(p);
          this.logger.log(`Updated Proposal id=${savedP.id} votesUp=${savedP.votesUp} votesDown=${savedP.votesDown}`);
          return savedP;
        } else {
          this.logger.warn(`Vote saved but proposal id=${savedVote.proposal_id} not found`);
          return savedVote;
        }
      }

      return savedVote;
    }

    if (pre.outcome === 'MISMATCH' || pre.outcome === 'FAILED_TX') {
      const failedVote = this.voteRepo.create({
        proposal_id: payload.id ?? null,
        tx_hash: payload.tx_hash ?? null,
        voter_address: payload.voter_address ?? null,
        chain_proposal_id: payload.chain_proposal_id ?? null,
        support: payload.support ?? null,
        weight: '0',
        governor_address: payload.governor_address ?? null,
        chain: payload.chain ?? null,
        chain_id: payload.chain_id ?? null,
        block_number: payload.block_number ?? null,
        raw_receipt: pre.receipt ?? null,
        status: pre.outcome === 'MISMATCH' ? 'MISMATCH' : 'FAILED',
        verification_trace: pre.trace ?? [],
      } as any);



    const resFailed = await this.voteRepo.save(failedVote);
    let savedFailed: Vote;
    if (Array.isArray(resFailed)) {
    if (resFailed.length === 0) throw new Error('voteRepo.save returned empty array for failed vote');
    savedFailed = resFailed[0];
    } else {
    savedFailed = resFailed;
    }
    this.logger.log(`Persisted failed vote id=${savedFailed.id} outcome=${pre.outcome}`);
    return savedFailed;


    }


    const fallbackStaged = this.voteStagingRepo.create({
      proposal_id: payload.id ?? null,
      tx_hash: payload.tx_hash ?? null,
      payload,
      verification_trace: pre.trace ?? [],
      status: 'PENDING',
      attempts: 0,
      expires_at: new Date(Date.now() + Number(process.env.MAX_WAIT_MS ?? 10 * 60 * 1000)),
    });
    const savedStaged = await this.voteStagingRepo.save(fallbackStaged);
    this.logger.log(`Fallback created VoteStaging id=${savedStaged.id}`);
    return savedStaged;



  }





}