//proposal.resolver.ts
import { Args, Query, Resolver, Subscription, Mutation, Float, Int } from '@nestjs/graphql';
import { ProposalService } from './proposal.service';
import { Inject } from '@nestjs/common';
import { Proposal } from 'src/entity/proposal.entity';
import { PubSub } from 'graphql-subscriptions';
import { CreateProposalResult } from './createProposalResult.dto';


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
    // return this.ProposalService.findProposals({ id, category });

    // Avoid passing empty string `id` to TypeORM (Postgres uuid column rejects "")
    const where: any = {};
    if (id && id !== '') where.id = id;
    if (category && category !== '') where.category = category;
    return this.ProposalService.findProposals(where);
   }







//src/proposal/proposal.resolver.ts

  @Mutation(() => CreateProposalResult)
  async createProposal(
    @Args('proposal_uuid', { nullable: true }) proposal_uuid?: string,
    @Args('tx_hash', { nullable: true }) tx_hash?: string,
    @Args('chain_proposal_id', { nullable: true }) chain_proposal_id?: string,
    @Args('proposer_wallet', { nullable: true }) proposer_wallet?: string,
    @Args('proposer_source', { nullable: true }) proposer_source?: string,

    @Args('description_raw', { nullable: true }) description_raw?: string,
    @Args('description_json', { nullable: true }) description_json?: string,

    @Args('title', { nullable: true }) title?: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('mission', { nullable: true }) mission?: string,
    @Args('budget', { nullable: true }) budget?: string,
    @Args('implement', { nullable: true }) implement?: string,


    @Args('governor_address', { nullable: true }) governor_address?: string,
    @Args('chain', { nullable: true }) chain?: string,
    @Args('chain_id', { type: () => Int, nullable: true }) chain_id?: number,

    @Args('voting_start_block', { type: () => Int, nullable: true }) voting_start_block?: number,
    @Args('voting_end_block', { type: () => Int, nullable: true }) voting_end_block?: number,
    @Args('block_number', { type: () => Int, nullable: true }) block_number?: number,



    @Args('raw_receipt', { nullable: true }) raw_receipt?: string,
    @Args('event_payload', { nullable: true }) event_payload?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('created_at', { nullable: true }) created_at?: string,
  ): Promise<CreateProposalResult> {
    const payload = {
      proposal_uuid,
      tx_hash,
      chain_proposal_id,
      proposer_wallet,
      proposer_source,
      description_raw,
      description_json,
      title,
      description,
      mission,
      budget,
      implement,
      governor_address,
      chain,
      chain_id,
      voting_start_block,
      voting_end_block,
      block_number,
      raw_receipt,
      event_payload,
      status,
      category,
      created_at,
    };

   
    const saved = await this.ProposalService.createProposal(payload);

    // saved can be a Proposal (persisted) or a StagingReport
    // Only publish to Redis when it's a Proposal and status is AWAITING_CONFIRMATIONS or CONFIRMED
    const publishableStatuses = new Set(['AWAITING_CONFIRMATIONS', 'CONFIRMED']);

    // detect if it's staging or proposal by presence of fields used in Proposal entity
    const isStaging = (saved && (saved as any).payload !== undefined && (saved as any).status === 'PENDING');

    if (!isStaging) {
      // it's a Proposal
      const proposal: any = saved as any;
      const statusStr = String(proposal.status ?? 'PENDING_TX');
      if (publishableStatuses.has(statusStr)) {
        console.log('Publishing new message to Redis:', proposal);
        this.pubSub.publish('proposalAdded', { proposalAdded: proposal });
      } else {
        // do not publish; frontend will be told the status and can show appropriate message
        console.log(`Not publishing proposal id=${proposal.id} status=${statusStr}`);
      }
      return {
        ok: true,
        status: String(proposal.status ?? 'PENDING_TX'),
        id: proposal.id ?? null,
        message: null,
      };
    } else {
      // staging case
      const staging: any = saved as any;
      const status = staging.status ?? 'PENDING';
      return {
        ok: false,
        status,
        id: staging.id ?? null,
        message: 'Proposal staged — awaiting on-chain confirmation or RPC availability.',
      };
    }


  }





}


