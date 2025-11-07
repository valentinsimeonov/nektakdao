import { Field, Int, ObjectType, Float } from '@nestjs/graphql';
import { Entity, PrimaryColumn, Column } from 'typeorm';



@Entity()
@ObjectType()
export class Proposal {
  @PrimaryColumn()
  @Field()
  id: string;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  category: string | null;

  // @Column({ type: 'text', nullable: true, unique: true })
  @Column({ type: 'text', nullable: true})
  @Field(() => String, {nullable: true})
  proposal_uuid: string;

  // @Column({ type: 'text', nullable: true, unique: true })
  @Column({ type: 'text', nullable: true})
  @Field(() => String, {nullable: true})
  tx_hash: string;

  @Column({ type: 'text', nullable: true }) 
  @Field(() => String, {nullable: true})
  chain_proposal_id: string;

  @Column({ type: 'text', nullable: true }) 
  @Field(() => String, {nullable: true})
  chain: string;

  @Column({ type: 'text', nullable: true }) 
  @Field(() => String, {nullable: true})
  governor_address: string;


  //indicates reached confirmation threshold
  @Column({ type: 'text', nullable: true }) 
  @Field(() => String, {nullable: true})
  confirmed: string;





  // Human metadata
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  mission: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  budget: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  implement: string | null;

  //raw on-chain description string
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description_raw: string | null;


  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  proposer_wallet: string | null;






  @Field(() => Float, {nullable: true})
  @Column('numeric', { nullable: true })
  voting_start_block: number | null;


  @Field(() => Float, {nullable: true})
  @Column('numeric', { nullable: true })
  voting_end_block: number | null;


  @Field(() => Float, {nullable: true})
  @Column('numeric', { nullable: true })
  block_number: number | null;


  // @Field(() => Float, {nullable: true})
  // @Column('numeric', { nullable: true })
  // confirmations: number | null;

  @Field(() => Float, {nullable: true})
  @Column('numeric', { nullable: true })
  votesUp: number | null;


  @Field(() => Float, {nullable: true})
  @Column('numeric', { nullable: true })
  votesDown: number | null;


  // @Field(() => Float, {nullable: true})
  // @Column('numeric', { nullable: true })
  // shareMore: number | null;


  // The new 'status' field — enum as text in DB
  @Column({
    type: 'enum',
    enum: ['PENDING_TX', 'AWAITING_CONFIRMATIONS', 'CONFIRMED', 'FAILED_TX', 'MISMATCH', 'REJECTED', 'MANUAL_REVIEW'],
    default: 'PENDING_TX',
  })
  @Field(() => String)
  status: 'PENDING_TX' | 'AWAITING_CONFIRMATIONS' | 'CONFIRMED' | 'FAILED_TX' | 'MISMATCH' | 'REJECTED' | 'MANUAL_REVIEW';






  // attachments: { url, filename, size, hash }
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  attachments: any | null;

  // raw receipt: minimal receipt info
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  raw_receipt: any | null;

  // decoded, structured JSON object representing the entire decoded event fields
  // No Wallet address here
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  event_payload: any | null;






  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true }) 
  created_at: Date | null;


  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true }) 
  updated_at: Date | null;


  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true }) 
  confirmed_at: Date | null;


  





}