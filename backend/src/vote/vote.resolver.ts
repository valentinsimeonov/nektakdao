// src/votes/vote.resolver.ts
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { VoteService } from './vote.service';
import { Inject } from '@nestjs/common';
import { Proposal } from 'src/entity/proposal.entity';
import { Vote } from 'src/entity/vote.entity';
import { VoteStaging } from 'src/entity/vote_staging.entity';
import { PubSub } from 'graphql-subscriptions';





@Resolver(() => Proposal)
export class VoteResolver {
  constructor(
    private readonly voteService: VoteService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}






  /**
   * voteUp mutation - frontend sends a payload including tx hash and on-chain metadata.
   * Returns updated Proposal or staging/failed vote object (graphQL will resolve fields requested).
   */
  @Mutation(() => Proposal, { name: 'voteUp', nullable: true })
  async voteUp(
    @Args('id') id: string,
    @Args('tx_hash') tx_hash: string,
    @Args('chain_proposal_id', { nullable: true }) chain_proposal_id?: string,
    @Args('voter_address') voter_address?: string,
    @Args('support') support?: number,
    @Args('governor_address', { nullable: true }) governor_address?: string,
    @Args('chain', { nullable: true }) chain?: string,
    @Args('chain_id', { type: () => Number, nullable: true }) chain_id?: number,
    @Args('block_number', { type: () => Number, nullable: true }) block_number?: number,
    @Args('raw_receipt', { nullable: true }) raw_receipt?: string,
    @Args('created_at', { nullable: true }) created_at?: string,
  ) {
    const payload = {
      id,
      tx_hash,
      chain_proposal_id,
      voter_address,
      support,
      governor_address,
      chain,
      chain_id,
      block_number,
      raw_receipt,
      created_at,
    } as any;

    const result = await this.voteService.recordVote(payload);

    // Publish updates:
    // - If result is Proposal (confirmed + aggregated), publish proposal update for frontend
    if (result && (result as any).votesUp !== undefined) {
      this.pubSub.publish('proposalUpdated', { proposalUpdated: result });
      return result as Proposal;
    }

    // If result is Vote or VoteStaging (not confirmed), optionally publish a 'voteStaged' or 'voteAdded' message
    this.pubSub.publish('voteEvent', { voteEvent: result });
    // return null or partial — frontend expects mutated fields; returning null is acceptable too
    return null;
  }



  
  @Mutation(() => Proposal, { name: 'voteDown', nullable: true })
  async voteDown(
    @Args('id') id: string,
    @Args('tx_hash') tx_hash: string,
    @Args('chain_proposal_id', { nullable: true }) chain_proposal_id?: string,
    @Args('voter_address') voter_address?: string,
    @Args('support') support?: number,
    @Args('governor_address', { nullable: true }) governor_address?: string,
    @Args('chain', { nullable: true }) chain?: string,
    @Args('chain_id', { type: () => Number, nullable: true }) chain_id?: number,
    @Args('block_number', { type: () => Number, nullable: true }) block_number?: number,
    @Args('raw_receipt', { nullable: true }) raw_receipt?: string,
    @Args('created_at', { nullable: true }) created_at?: string,
  ) {
    const payload = {
      id,
      tx_hash,
      chain_proposal_id,
      voter_address,
      support,
      governor_address,
      chain,
      chain_id,
      block_number,
      raw_receipt,
      created_at,
    } as any;

    const result = await this.voteService.recordVote(payload);

    if (result && (result as any).votesUp !== undefined) {
      this.pubSub.publish('proposalUpdated', { proposalUpdated: result });
      return result as Proposal;
    }

    this.pubSub.publish('voteEvent', { voteEvent: result });
    return null;



  }




}
