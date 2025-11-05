//Proposal.resolver.ts
import { Args, Int, Query, Resolver, Subscription, Mutation } from '@nestjs/graphql';
import { ProposalService } from './proposal.service';

import { Inject } from '@nestjs/common';
import { Proposal } from 'src/entity/proposal.entity';

import { pubSub } from '../config/pubsub.provider';



@Resolver(() => Proposal)
export class ProposalResolver {
  constructor(private readonly ProposalService: ProposalService
  ) {}


/*                     Proposal                   */
/*=================================================*/


  @Query(() => [Proposal], { name: 'allProposals', nullable: 'items' })
  queryAllProposals() {
    return this.ProposalService.findAllProposals();
  }





}