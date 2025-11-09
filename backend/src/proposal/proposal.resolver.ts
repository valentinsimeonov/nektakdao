//proposal.resolver.ts
import { Args, Int, Query, Resolver, Subscription, Mutation } from '@nestjs/graphql';
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




  @Mutation(() => Boolean) 
  async createProposal(
    @Args('category') category: string,
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('mission') mission: string,
    @Args('budget') budget: string,
    @Args('implement') implement: string,
    @Args('created_at') created_at: string,

  ): Promise<boolean> { 
    const newMessage = await this.ProposalService.createProposal(category, title, description, mission,  budget, implement, created_at );

    // Publish new message event to Redis
    console.log('Publishing new message to Redis:', newMessage);
    this.pubSub.publish('proposalAdded', { proposalAdded: newMessage });

    return true; 
  }



}