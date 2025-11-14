//proposal.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere, Any, ArrayContains } from 'typeorm';
import { Proposal } from '../entity/proposal.entity';
import { StagingReport } from '../entity/staging_report.entity';
import { VerificationService, PreVerifyResult } from '../proposal/verification.service';
import * as dayjs from 'dayjs';




@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);

  constructor(

    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,

    @InjectRepository(StagingReport)
    private readonly stagingRepo: Repository<StagingReport>,

    private readonly verificationService: VerificationService,
) { }




public async findAllProposals(): Promise<Proposal[]> {
  return await this.proposalRepo.find();
}


public async findProposals(where: FindOptionsWhere<Proposal>) {
  return await this.proposalRepo.findBy(where);
}



  /**
   * Create or update a proposal record (idempotent).
   * Pre-verifies incoming payload and either persists to proposals or creates a staging_report.
   */
  async createProposal(payload: any): Promise<Proposal | StagingReport> {
    // Defensive size & type checks
    const MAX_TEXT = 16000;
    const MAX_JSON_STRING = 200000;
    const safeString = (v: any, max = MAX_TEXT) => (v == null ? null : (typeof v === 'string' ? (v.length > max ? v.slice(0, max) : v) : String(v)));

    // Log preview
    try {
      const preview = JSON.stringify(payload ?? {}, null, 2).slice(0, 2000);
      this.logger.log(`Received createProposal payload preview:\n${preview}`);
    } catch {}

    // parse/normalize a couple fields early (don't persist yet)
    const incoming = { ...payload };
    try {
      if (typeof incoming?.description_json === 'string') {
        incoming.description_json = JSON.parse(incoming.description_json);
      }
    } catch (e) {
      // keep as string if parse fails
    }

    // Pre-verify BEFORE persisting
    let pre: PreVerifyResult;
    try {
      pre = await this.verificationService.preVerifyPayload(incoming);
    } catch (err) {
      // If verification failed due to RPC error, fallback to staging so we don't lose the payload
      this.logger.warn(`preVerifyPayload failed (RPC error). Falling back to staging. Err: ${String(err)}`);
      pre = { outcome: 'TX_NOT_FOUND', trace: [{ ts: new Date().toISOString(), step: 'preVerify_failed', ok: false, info: { err: String(err) } }], reason: 'verification_error' } as any;
    }

    // handle the different outcomes
    if (pre.outcome === 'TX_NOT_FOUND') {
      // Create a staging report (do not persist in proposals yet)
      const expiresAt = new Date(Date.now() + (Number(process.env.MAX_WAIT_MS ?? 10 * 60 * 1000)));
      const staging = this.stagingRepo.create({
        proposal_uuid: incoming.proposal_uuid ?? null,
        tx_hash: incoming.tx_hash ?? null,
        payload: {
          // store sanitized payload
          proposal_uuid: incoming.proposal_uuid ?? null,
          tx_hash: incoming.tx_hash ?? null,
          proposer_wallet: incoming.proposer_wallet ?? null,
          title: safeString(incoming.title),
          description: safeString(incoming.description),
          description_raw: safeString(incoming.description_raw, MAX_JSON_STRING),
          description_json: incoming.description_json ?? null,
          created_at: incoming.created_at ?? new Date().toISOString(),
        },
        verification_trace: pre.trace ?? [],
        status: 'PENDING',
        attempts: 0,
        expires_at: expiresAt,
      });

      const saved = await this.stagingRepo.save(staging);
      this.logger.log(`Created staging report id=${saved.id} proposal_uuid=${saved.proposal_uuid} tx_hash=${saved.tx_hash}`);
      return saved;
    }

    // For other outcomes we will persist to proposals table
    // Idempotency: check existing by proposal_uuid or tx_hash
    let existing: Proposal | null = null;
    if (incoming.proposal_uuid) {
      existing = await this.proposalRepo.findOne({ where: { proposal_uuid: incoming.proposal_uuid } });
    }
    if (!existing && incoming.tx_hash) {
      existing = await this.proposalRepo.findOne({ where: { tx_hash: incoming.tx_hash } });
    }

    // Prepare fields to persist
    const safeDescriptionRaw = safeString(incoming.description_raw, MAX_JSON_STRING);
    const parsedRawReceipt = (() => {
      try {
        if (typeof incoming.raw_receipt === 'string') return JSON.parse(incoming.raw_receipt);
        return incoming.raw_receipt ?? null;
      } catch {
        return incoming.raw_receipt ?? null;
      }
    })();
    const parsedEventPayload = (() => {
      try {
        if (typeof incoming.event_payload === 'string') return JSON.parse(incoming.event_payload);
        return incoming.event_payload ?? null;
      } catch {
        return incoming.event_payload ?? null;
      }
    })();

    const base: Partial<Proposal> = {
      category: incoming.category ?? null,
      title: safeString(incoming.title) ?? null,
      description: safeString(incoming.description) ?? null,
      mission: safeString(incoming.mission) ?? null,
      budget: safeString(incoming.budget) ?? null,
      implement: safeString(incoming.implement) ?? null,
      created_at: incoming.created_at ? new Date(incoming.created_at) : new Date(),
      proposal_uuid: incoming.proposal_uuid ?? null,
      tx_hash: incoming.tx_hash ?? null,
      chain_proposal_id: incoming.chain_proposal_id ?? null,
      proposer_wallet: incoming.proposer_wallet ?? null,
      proposer_source: incoming.proposer_source ?? null,
      description_raw: safeDescriptionRaw ?? null,
      description_json: incoming.description_json ?? null,
      raw_receipt: parsedRawReceipt ?? null,
      event_payload: parsedEventPayload ?? null,
      governor_address: incoming.governor_address ?? null,
      chain: incoming.chain ?? null,
      chain_id: incoming.chain_id ?? null,
      voting_start_block: incoming.voting_start_block ?? null,
      voting_end_block: incoming.voting_end_block ?? null,
      block_number: incoming.block_number ?? null,
    };

    // Decide status based on preVerify result
    if (pre.outcome === 'CONFIRMED') {
      base.status = 'CONFIRMED';
      (base as any).proposer_verified = { trace: pre.trace, verified: true, authoritativeProposer: (pre as any).authoritativeProposer ?? null };
      (base as any).raw_receipt = (pre as any).receipt ?? base.raw_receipt;
      (base as any).confirmed_at = new Date();
    } else if (pre.outcome === 'AWAITING_CONFIRMATIONS') {
      base.status = 'AWAITING_CONFIRMATIONS';
      (base as any).proposer_verified = { trace: pre.trace, verified: !!((pre as any).authoritativeProposer) };
      (base as any).raw_receipt = (pre as any).receipt ?? base.raw_receipt;
    } else if (pre.outcome === 'FAILED_TX') {
      base.status = 'FAILED_TX';
      (base as any).proposer_verified = { trace: pre.trace, verified: false };
      (base as any).raw_receipt = (pre as any).receipt ?? base.raw_receipt;
    } else if (pre.outcome === 'MISMATCH') {
      base.status = 'MISMATCH';
      (base as any).proposer_verified = { trace: pre.trace, verified: false, authoritativeProposer: (pre as any).authoritativeProposer ?? null };
      (base as any).raw_receipt = (pre as any).receipt ?? base.raw_receipt;
    } else {
      base.status = 'PENDING_TX';
      (base as any).proposer_verified = { trace: pre.trace, verified: false };
    }

    if (existing) {
      // Merge: prefer non-empty incoming values
      const merged: any = { ...existing, ...base };
      merged.updated_at = new Date();
      const saved = await this.proposalRepo.save(merged);
      this.logger.log(`Updated existing proposal id=${saved.id} proposal_uuid=${saved.proposal_uuid} status=${saved.status}`);
      // If we updated and the status is AWAITING_CONFIRMATIONS or CONFIRMED, optionally remove any staging report
      if (saved.status === 'CONFIRMED' || saved.status === 'AWAITING_CONFIRMATIONS') {
        // Move or mark staging reports as MOVED if any matched
        if (incoming.proposal_uuid || incoming.tx_hash) {
          try {
            const toUpdate = await this.stagingRepo.findOne({ where: [{ proposal_uuid: incoming.proposal_uuid }, { tx_hash: incoming.tx_hash }] });
            if (toUpdate) {
              toUpdate.status = 'MOVED';
              await this.stagingRepo.save(toUpdate);
            }
          } catch {}
        }
      }
      return saved;
    }

    // Create new proposal
    const newProposal = this.proposalRepo.create(base);
    const saved = await this.proposalRepo.save(newProposal);
    this.logger.log(`Created new proposal id=${saved.id} proposal_uuid=${saved.proposal_uuid} status=${saved.status}`);

    // If this was created from pre-verify with AWAITING_CONFIRMATIONS or CONFIRMED, mark matching staging as moved
    if (saved.status === 'CONFIRMED' || saved.status === 'AWAITING_CONFIRMATIONS') {
      try {
        const toUpdate = await this.stagingRepo.findOne({ where: [{ proposal_uuid: saved.proposal_uuid }, { tx_hash: saved.tx_hash }] });
        if (toUpdate) {
          toUpdate.status = 'MOVED';
          await this.stagingRepo.save(toUpdate);
        }
      } catch {}
    }

    return saved;
  }






  
}





