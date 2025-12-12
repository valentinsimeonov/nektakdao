


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
    $proposer_source: String,
    $description_raw: String,
    $description_json: String,
    $title: String!,
    $description: String!,
    $mission: String!,
    $budget: String!,
    $implement: String!,
    $governor_address: String,
    $chain: String,
    $chain_id: Int,
    $voting_start_block: Int,
    $voting_end_block: Int,
    $block_number: Int,
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
    proposer_source: $proposer_source,
    description_raw: $description_raw,
    description_json: $description_json,
    title: $title,
    description: $description,
    mission: $mission,
    budget: $budget,
    implement: $implement,
    governor_address: $governor_address,
    chain: $chain,
    chain_id: $chain_id,
    voting_start_block: $voting_start_block,
    voting_end_block: $voting_end_block,
    block_number: $block_number,
    created_at: $created_at,
    raw_receipt: $raw_receipt,
    event_payload: $event_payload,
    status: $status,
    category: $category
  ) {

  
    ok
    status
    id
    message
  }
}
`;






const MUTATION_PROPOSALS_VOTE_UP = gql`
  mutation voteUp(
    $id: String!,
    $tx_hash: String!,
    $chain_proposal_id: String,
    $voter_address: String!,
    $support: Int!,
    $governor_address: String,
    $chain: String,
    $chain_id: Int,
    $block_number: Int,
    $raw_receipt: String,
    $created_at: String
  ){
    voteUp(
      id: $id,
      tx_hash: $tx_hash,
      chain_proposal_id: $chain_proposal_id,
      voter_address: $voter_address,
      support: $support,
      governor_address: $governor_address,
      chain: $chain,
      chain_id: $chain_id,
      block_number: $block_number,
      raw_receipt: $raw_receipt,
      created_at: $created_at
    ){
      votes_up
      votes_down
      id
      status
    }
  }
`;

const MUTATION_PROPOSALS_VOTE_DOWN = gql`
  mutation voteDown(
    $id: String!,
    $tx_hash: String!,
    $chain_proposal_id: String,
    $voter_address: String!,
    $support: Int!,
    $governor_address: String,
    $chain: String,
    $chain_id: Int,
    $block_number: Int,
    $raw_receipt: String,
    $created_at: String
  ){
    voteDown(
      id: $id,
      tx_hash: $tx_hash,
      chain_proposal_id: $chain_proposal_id,
      voter_address: $voter_address,
      support: $support,
      governor_address: $governor_address,
      chain: $chain,
      chain_id: $chain_id,
      block_number: $block_number,
      raw_receipt: $raw_receipt,
      created_at: $created_at
    ){
      votes_up
      votes_down
      id
      status
    }
  }
`;





export { 
	QUERY_PROPOSALS_BY_ID_CATEGORY,
	MUTATION_CREATE_PROPOSAL,

  MUTATION_PROPOSALS_VOTE_UP,
  MUTATION_PROPOSALS_VOTE_DOWN,


	
	};


