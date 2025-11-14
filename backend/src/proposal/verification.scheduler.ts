// src/proposals/verification.scheduler.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StagingReport } from '../entity/staging_report.entity';
import { ProposalService } from '../proposal/proposal.service';

@Injectable()
export class VerificationScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VerificationScheduler.name);
  private intervalHandle: NodeJS.Timeout | null = null;
  // poll every N milliseconds (read either env var for compatibility)
  private pollIntervalMs = Number(process.env.VERIFICATION_POLL_MS ?? process.env.POLL_INTERVAL_MS ?? 60_000);
  // how many staging items to process per tick
  private batchSize = Number(process.env.VERIFICATION_BATCH_SIZE ?? 20);

  constructor(
    private readonly verificationService: VerificationService,
    @InjectRepository(StagingReport)
    private readonly stagingRepo: Repository<StagingReport>,
    private readonly proposalService: ProposalService,
  ) {}

  onModuleInit() {
    this.logger.log(`Starting verification scheduler (interval ${this.pollIntervalMs}ms, batch ${this.batchSize})`);
    // schedule periodic execution — the actual work runs in an async handler called by setInterval
    this.intervalHandle = setInterval(() => {
      this.runOnce().catch((err) => {
        this.logger.error(`Verification scheduler runOnce error: ${String(err)}`);
      });
    }, this.pollIntervalMs);

    // also kick off an immediate run (do not await)
    this.runOnce().catch((err) => {
      this.logger.error(`Initial verification scheduler runOnce error: ${String(err)}`);
    });
  }

  // ... runOnce remains the same as before (unchanged) ...
  async runOnce(): Promise<void> {
    try {
      const pendingStaging = await this.stagingRepo.find({
        where: { status: 'PENDING' },
        take: this.batchSize,
        order: { first_seen: 'ASC' },
      });

      if (!pendingStaging || pendingStaging.length === 0) {
        this.logger.debug('No pending staging reports to process this tick.');
        return;
      }

      this.logger.log(`Processing ${pendingStaging.length} staging reports`);

      for (const s of pendingStaging) {
        try {
          const incoming = s.payload ?? {};
          const pre = await this.verificationService.preVerifyPayload(incoming);

          if (pre.outcome === 'TX_NOT_FOUND') {
            s.attempts = (s.attempts || 0) + 1;
            s.last_attempt = new Date();
            s.verification_trace = (s.verification_trace || []).concat(pre.trace || []);

            // expire if past expiry
            if (s.expires_at && new Date() > new Date(s.expires_at)) {
              s.status = 'EXPIRED';
              this.logger.log(`StagingReport ${s.id} expired; marking EXPIRED`);
            } else {
              // keep it pending / retry later
              s.status = 'PENDING';
            }

            await this.stagingRepo.save(s);
            continue;
          }

          if (pre.outcome === 'RPC_ERROR') {
            // transient RPC error: increment attempts and leave pending
            s.attempts = (s.attempts || 0) + 1;
            s.last_attempt = new Date();
            s.verification_trace = (s.verification_trace || []).concat(pre.trace || []);
            await this.stagingRepo.save(s);
            this.logger.warn(`StagingReport ${s.id} RPC_ERROR; will retry later`);
            continue;
          }

          // Pre-verify returned something actionable (AWAITING_CONFIRMATIONS / CONFIRMED / MISMATCH / FAILED_TX)
          // Move into proposals by calling ProposalService.createProposal(incoming)
          try {
            await this.proposalService.createProposal(incoming);
            s.status = 'MOVED';
            s.verification_trace = (s.verification_trace || []).concat(pre.trace || []);
            s.last_attempt = new Date();
            await this.stagingRepo.save(s);
            this.logger.log(`Moved staging ${s.id} -> proposals (outcome=${pre.outcome})`);
          } catch (err) {
            // If move fails, keep staging and increment attempts
            s.attempts = (s.attempts || 0) + 1;
            s.last_attempt = new Date();
            s.verification_trace = (s.verification_trace || []).concat([{ ts: new Date().toISOString(), step: 'move_to_proposals_failed', ok: false, info: String(err) }]);
            await this.stagingRepo.save(s);
            this.logger.warn(`Failed to move staging ${s.id} into proposals: ${String(err)}`);
          }
        } catch (errInner) {
          // catch per-item processing errors so other items can continue
          this.logger.warn(`Error processing staging report ${s.id}: ${String(errInner)}`);
          try {
            s.attempts = (s.attempts || 0) + 1;
            s.last_attempt = new Date();
            s.verification_trace = (s.verification_trace || []).concat([{ ts: new Date().toISOString(), step: 'processing_error', ok: false, info: String(errInner) }]);
            await this.stagingRepo.save(s);
          } catch {
            // swallow save errors to avoid crashing scheduler loop
          }
        }
      }
    } catch (err) {
      this.logger.error(`VerificationScheduler.runOnce top-level error: ${String(err)}`);
      throw err;
    }
  }

  onModuleDestroy() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    this.logger.log('Stopped verification scheduler');
  }
}