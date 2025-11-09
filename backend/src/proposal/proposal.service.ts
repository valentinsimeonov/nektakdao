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





async createProposal(category: string, title: string, description: string, mission: string,  budget: string, implement: string, created_at: string, proposal_uuid: string, tx_hash: string, chain_proposal_id: string, proposer_wallet: string, description_raw: string, description_json: string, governor_address: string, chain: string, raw_receipt: string, event_payload: string, status: string, voting_start_block: number | null, voting_end_block: number | null, block_number: number | null): Promise<Proposal> {


  const newProposal = this.proposalRepo.create({
    category, title, description, mission,  budget, implement, created_at
  });

  await this.proposalRepo.save(newProposal);

  return newProposal; // Only return the newly created proposal
}




}