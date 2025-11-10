//proposal.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere, Any, ArrayContains } from 'typeorm';
import { Proposal } from 'src/entity/proposal.entity';



@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);



  constructor(

    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,

) { }





public async findAllProposals(): Promise<Proposal[]> {
  return await this.proposalRepo.find();
}





public async findProposals(where: FindOptionsWhere<Proposal>) {
  return await this.proposalRepo.findBy(where);
}




  async createProposal(payload: any): Promise<Proposal> {
    // payload may contain serialized JSON strings for raw_receipt/event_payload
    const {
      category,
      title,
      description,
      mission,
      budget,
      implement,
      created_at,
      proposal_uuid,
      tx_hash,
      chain_proposal_id,
      proposer_wallet,
      description_raw,
      description_json,
      governor_address,
      chain,
      voting_start_block,
      voting_end_block,
      block_number,
      raw_receipt,
      event_payload,
      status,
    } = payload;

    // parse JSON strings if necessary (they might already be objects, check first)
    let parsedRawReceipt = raw_receipt;
    try {
      if (typeof raw_receipt === 'string') {
        parsedRawReceipt = JSON.parse(raw_receipt);
      }
    } catch (e) {
      parsedRawReceipt = raw_receipt; // keep as string if parse fails
    }

    let parsedEventPayload = event_payload;
    try {
      if (typeof event_payload === 'string') {
        parsedEventPayload = JSON.parse(event_payload);
      }
    } catch (e) {
      parsedEventPayload = event_payload;
    }

    const newProposal = this.proposalRepo.create({
      category: category ?? null,
      title: title ?? null,
      description: description ?? null,
      mission: mission ?? null,
      budget: budget ?? null,
      implement: implement ?? null,
      created_at: created_at ? new Date(created_at) : new Date(),
      proposal_uuid: proposal_uuid ?? null,
      tx_hash: tx_hash ?? null,
      chain_proposal_id: chain_proposal_id ?? null,
      proposer_wallet: proposer_wallet ?? null,
      description_raw: description_raw ?? null,
      // store parsed JSON objects into jsonb columns
      description_json: description_json ?? null,
      raw_receipt: parsedRawReceipt ?? null,
      event_payload: parsedEventPayload ?? null,
      governor_address: governor_address ?? null,
      chain: chain ?? null,
      voting_start_block: voting_start_block ?? null,
      voting_end_block: voting_end_block ?? null,
      block_number: block_number ?? null,
      status: status ?? 'PENDING_TX',
    });

    await this.proposalRepo.save(newProposal);
    return newProposal;
  }










}

