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








}