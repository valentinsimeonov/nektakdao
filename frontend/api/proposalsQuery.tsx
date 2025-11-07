


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
mutation createMessage($body: String!, $coinId: String!, $profileEmail: String!) {
  createMessage(body: $body, coinId: $coinId, profileEmail: $profileEmail)
  }
`;




export { 
	QUERY_PROPOSALS_BY_ID_CATEGORY,
	MUTATION_CREATE_PROPOSAL,


	
	};


