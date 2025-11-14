









{/* 

        <input type="file" onChange={handleAvatarUpload} accept="image/*" />

        <div className="CreateProposalsChannelCardLogoColumn">
          {post && post.avatar && (
            <img
              src={`http://localhost:5000/proposals/image/${post.avatar}`}
              alt="Avatar"
            />
          )}

          {!post && imageUrl && <img src={imageUrl} alt="Avatar" />}

          {!avatarFile && <img src={"/aks/C12.png"} alt="" />}
        </div>

 */}



  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAvatarFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };














const MUTATION_CREATE_PROPOSAL = gql`
mutation createProposal($category: String!, $title: String!, $description: String!, $mission: String!, $budget: String!, $implement: String!, $created_at: String!) {
  createProposal(category: $category, title: $title, description: $description, mission: $mission, budget: $budget, implement: $implement, created_at: $created_at)
  }
`;














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

