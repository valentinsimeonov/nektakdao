import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Proposal } from './proposal.entity';




@Entity({ name: 'votes' })
@ObjectType()
@Index('idx_vote_tx_hash', ['tx_hash'], { unique: true })
@Index('idx_vote_proposal_voter', ['proposal_id', 'voter_address'], { unique: true })
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;


  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  proposal_id: string | null;

  @ManyToOne(() => Proposal, { nullable: true, onDelete: 'SET NULL' })
  proposal?: Proposal | null;

  // On-chain tx that carried the vote
  @Column({ type: 'text', nullable: true, unique: true })
  @Field(() => String, { nullable: true })
  tx_hash: string | null;

  // Voter wallet
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  voter_address: string | null;

  // The chain's proposal id (as string)
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  chain_proposal_id: string | null;

  // support: 1 = For, 0 = Against
  @Column('int', { nullable: true })
  @Field(() => Int, { nullable: true })
  support: number | null;

  // reported voting weight (store as text to avoid BigInt issues)
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  weight: string | null;

  // governor contract address
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  governor_address: string | null;

  // chain metadata
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  chain: string | null;

  @Column('int', { nullable: true })
  @Field(() => Int, { nullable: true })
  chain_id: number | null;

  @Column('int', { nullable: true })
  @Field(() => Int, { nullable: true })
  block_number: number | null;

  // raw receipt JSON (jsonb)
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  raw_receipt: any | null;





  // status for verification pipeline
  @Column({
    type: 'enum',
    enum: ['PENDING', 'AWAITING_CONFIRMATIONS', 'CONFIRMED', 'FAILED', 'MISMATCH'],
    default: 'PENDING',
  })
  @Field(() => String)
  status: 'PENDING' | 'AWAITING_CONFIRMATIONS' | 'CONFIRMED' | 'FAILED' | 'MISMATCH';





  // verification trace (jsonb) for auditing
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  verification_trace: any | null;






  @CreateDateColumn({ type: 'timestamp' })
  @Field(() => Date)
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Field(() => Date)
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => Date, { nullable: true })
  confirmed_at: Date | null;





}





