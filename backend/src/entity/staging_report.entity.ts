// src/entity/staging_report.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@Entity({ name: 'staging_reports' })
@ObjectType()
export class StagingReport {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  proposal_uuid: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  tx_hash: string | null;


  // full incoming payload (truncated / sanitized may be applied before saving)
  @Column({ type: 'jsonb', nullable: true })
  payload: any | null;

  // verification trace so far
  @Column({ type: 'jsonb', nullable: true })
  verification_trace: any | null;


  @Column({ type: 'text', nullable: true })
  status: 'PENDING' | 'RETRYING' | 'EXPIRED' | 'MOVED' | 'FAILED' | null;


  @Column({ type: 'int', default: 0 })
  attempts: number;


  @CreateDateColumn({ type: 'timestamp' })
  first_seen: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  last_attempt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;


}




