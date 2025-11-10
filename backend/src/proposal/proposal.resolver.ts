//proposal.resolver.ts
import { Args, Query, Resolver, Subscription, Mutation, Float } from '@nestjs/graphql';
import { ProposalService } from './proposal.service';
import { Inject } from '@nestjs/common';
import { Proposal } from 'src/entity/proposal.entity';
import { PubSub } from 'graphql-subscriptions';



@Resolver(() => Proposal)
export class ProposalResolver {
  constructor(private readonly ProposalService: ProposalService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}






/*                     Proposal                   */
/*=================================================*/


  @Query(() => [Proposal], { name: 'allProposals', nullable: 'items' })
  queryAllProposals() {
    return this.ProposalService.findAllProposals();
  }



  @Query(() => [Proposal], { name: 'proposals', nullable: 'items' })
  queryProposals(
    @Args('id', { nullable: true }) id?: string,
    @Args('category', { nullable: true }) category?: string,
  ) {
    return this.ProposalService.findProposals({ id, category });
  }




//   @Mutation(() => Boolean) 
//   async createProposal(
//     @Args('category') category: string,
//     @Args('title') title: string,
//     @Args('description') description: string,
//     @Args('mission') mission: string,
//     @Args('budget') budget: string,
//     @Args('implement') implement: string,
//     @Args('created_at') created_at: string,
//     @Args('proposal_uuid') proposal_uuid: string,
//     @Args('tx_hash') tx_hash: string,
//     @Args('chain_proposal_id') chain_proposal_id: string,
//     @Args('proposer_wallet') proposer_wallet: string,
//     @Args('description_raw') description_raw: string,
//     @Args('description_json') description_json: string,
//     @Args('governor_address') governor_address: string,
//     @Args('chain') chain: string,
//     @Args('raw_receipt') raw_receipt: string,
//     @Args('event_payload') event_payload: string,
//     @Args('status') status: string,

//     @Args('voting_start_block', { type: () => Float, nullable: true }) voting_start_block?: number,
//     @Args('voting_end_block', { type: () => Float, nullable: true }) voting_end_block?: number,
//     @Args('block_number', { type: () => Float, nullable: true }) block_number?: number,


//   ): Promise<boolean> { 
//     const newProposal = await this.ProposalService.createProposal(category, title, description, mission,  budget, implement, created_at, proposal_uuid, tx_hash, chain_proposal_id, proposer_wallet, description_raw, description_json, governor_address, chain, raw_receipt, event_payload, status, voting_start_block ?? null, voting_end_block ?? null, block_number ?? null
//  );

//     // Publish new message event to Redis
//     console.log('Publishing new message to Redis:', newProposal);
//     this.pubSub.publish('proposalAdded', { proposalAdded: newProposal });

//     return true; 
//   }





  @Mutation(() => Boolean)
  async createProposal(
    @Args('proposal_uuid', { nullable: true }) proposal_uuid?: string,
    @Args('tx_hash', { nullable: true }) tx_hash?: string,
    @Args('chain_proposal_id', { nullable: true }) chain_proposal_id?: string,
    @Args('proposer_wallet', { nullable: true }) proposer_wallet?: string,
    @Args('description_raw', { nullable: true }) description_raw?: string,
    @Args('description_json', { nullable: true }) description_json?: string,
    @Args('title', { nullable: true }) title?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('mission', { nullable: true }) mission?: string,
    @Args('budget', { nullable: true }) budget?: string,
    @Args('implement', { nullable: true }) implement?: string,
    @Args('governor_address', { nullable: true }) governor_address?: string,
    @Args('chain', { nullable: true }) chain?: string,
    @Args('voting_start_block', { type: () => Float, nullable: true }) voting_start_block?: number,
    @Args('voting_end_block', { type: () => Float, nullable: true }) voting_end_block?: number,
    @Args('block_number', { type: () => Float, nullable: true }) block_number?: number,
    @Args('raw_receipt', { nullable: true }) raw_receipt?: string,
    @Args('event_payload', { nullable: true }) event_payload?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('created_at', { nullable: true }) created_at?: string,
  ): Promise<boolean> {
    const payload = {
      proposal_uuid,
      tx_hash,
      chain_proposal_id,
      proposer_wallet,
      description_raw,
      description_json,
      title,
      description,
      mission,
      budget,
      implement,
      governor_address,
      chain,
      voting_start_block,
      voting_end_block,
      block_number,
      raw_receipt,
      event_payload,
      status,
      category,
      created_at,
    };

    const newProposal = await this.ProposalService.createProposal(payload);

    console.log('Publishing new message to Redis:', newProposal);
    this.pubSub.publish('proposalAdded', { proposalAdded: newProposal });

    return true;
  }
}