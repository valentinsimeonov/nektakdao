import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';




@Entity({ name: 'vote_staging' })
@ObjectType()
export class VoteStaging {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  // optional link to proposal UUID or DB id (frontend may supply)
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  proposal_id: string | null;

  // tx hash (if present)
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  tx_hash: string | null;

  // full incoming payload to inspect or re-run verification against
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  payload: any | null;

  // verification trace so far
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  verification_trace: any | null;




  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  status: 'PENDING' | 'RETRYING' | 'EXPIRED' | 'MOVED' | 'FAILED' | null;




  @Column({ type: 'int', default: 0 })
  @Field(() => Number, { nullable: true })
  attempts: number;






  @CreateDateColumn({ type: 'timestamp' })
  @Field(() => Date)
  first_seen: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Field(() => Date)
  last_attempt: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => Date, { nullable: true })
  expires_at: Date | null;




}