


//proposalsQuery.tsx


import { gql } from '@apollo/client';





const QUERY_PROPOSALS_BY_ID_CATEGORY = gql`
query proposals($id: String, $category: String ) {
	proposals(id: $id, category: $category ) {
		id 
		proposal_uuid 
		tx_hash 
		chain_proposal_id 
		chain 
		governor_address 
		confirmed 


		title 
		description 
		mission 
		budget 
		implement 
		description_raw 
		proposer_wallet 


		voting_start_block 
		voting_end_block 
		block_number 


		votesUp 
		votesDown 


		created_at 
		updated_at 
		confirmed_at 


		status

		
	}
  }
`;









const MUTATION_CREATE_PROPOSAL = gql`
mutation createProposal(
  $proposal_uuid: String!,
  $tx_hash: String!,
  $chain_proposal_id: String,
  $proposer_wallet: String,
  $description_raw: String,
  $description_json: String,
  $title: String!,
  $description: String!,
  $mission: String!,
  $budget: String!,
  $implement: String!,
  $governor_address: String,
  $chain: String,
  $voting_start_block: Float,
  $voting_end_block: Float,
  $block_number: Float,
  $created_at: String,
  $raw_receipt: String,
  $event_payload: String,
  $status: String,
  $category: String!
) {
  createProposal(
    proposal_uuid: $proposal_uuid,
    tx_hash: $tx_hash,
    chain_proposal_id: $chain_proposal_id,
    proposer_wallet: $proposer_wallet,
    description_raw: $description_raw,
    description_json: $description_json,
    title: $title,
    description: $description,
    mission: $mission,
    budget: $budget,
    implement: $implement,
    governor_address: $governor_address,
    chain: $chain,
    voting_start_block: $voting_start_block,
    voting_end_block: $voting_end_block,
    block_number: $block_number,
    created_at: $created_at,
    raw_receipt: $raw_receipt,
    event_payload: $event_payload,
    status: $status,
    category: $category
  )
}
`;








export { 
	QUERY_PROPOSALS_BY_ID_CATEGORY,
	MUTATION_CREATE_PROPOSAL,


	
	};


