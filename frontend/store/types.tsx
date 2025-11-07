// types.tsx



// Allowed status values (matches DB enum)
export type ProposalStatus =
  | "PENDING_TX"
  | "AWAITING_CONFIRMATIONS"
  | "CONFIRMED"
  | "FAILED_TX"
  | "MISMATCH"
  | "REJECTED"
  | "MANUAL_REVIEW";



//   // Attachment metadata stored in DB (jsonb)
// export interface Attachment {
//   url: string;
//   filename?: string | null;
//   mimeType?: string | null;
//   size?: number | null;     // bytes
//   hash?: string | null;     // content hash (optional)
// }

// // Minimal Transaction Receipt fields we keep in DB
// export interface RawReceipt {
//   blockNumber?: number | null;
//   status?: number | null;               // 0 or 1
//   gasUsed?: number | string | null;     // sometimes big numbers => string ok
//   from?: string | null;
//   to?: string | null;
//   effectiveGasPrice?: number | string | null;
//   // store any other fields you want; keep shape loose for forward compatibility
//   [key: string]: any;
// }

// // Decoded on-chain ProposalCreated event payload (generic)
// export interface EventPayload {
//   proposalId?: string | null;    // on-chain uint256 as string
//   proposer?: string | null;      // on-chain proposer address (you may omit or ignore)
//   targets?: string[] | null;
//   values?: (number | string)[] | null;
//   calldatas?: string[] | null;
//   startBlock?: number | null;
//   endBlock?: number | null;
//   description?: any | null;      // parsed JSON description (object) OR raw string
//   // any additional decoded fields
//   [key: string]: any;
// }




 export interface ProposalData {

	id: string;
	category: string;
	proposal_uuid: string;
	tx_hash: string;
	chain_proposal_id: string;
	chain: string;
	governor_address: string;
	confirmed: string;


	title: string;
	description: string;
	mission: string;
	budget: string;
	implement: string;
	description_raw: string;
	proposer_wallet: string;


	voting_start_block: number;
	voting_end_block: number;
	block_number: number;


	votesUp: number;
	votesDown: number;


	created_at: string;
	updated_at: string;
	confirmed_at: string;


	// enum status
  	status: ProposalStatus;


// 	  // arrays / jsonb fields
//   attachments?: Attachment[] | null;
//   raw_receipt?: RawReceipt | null;
//   event_payload?: EventPayload | null;


};






export type RootState = {


	proposals: {

		proposalsLeftModuleLayer: string,


				
		proposalsMiddleMobileVisible: boolean,

		proposalsMiddleExplanationsExtendBottomPanel: boolean,
		
		proposalsMiddleModuleButton: string,

		proposalsLeftExtendBottomPanel: boolean,
		proposalsMiddleExtendButtonStats: boolean,
		proposalsMiddleExtendButtonDescription: boolean,
		proposalsSelectedButton: string,


		proposalsShouldAutoScroll: boolean,







		
		l2AllCat: boolean,

		l2ExtendLeftPanel: boolean,
		l2SelectedSubFunc: string,

		l2ExtendRightPanel: boolean,
		l2VideoOn: boolean,
		l2WhichVideo: string,

		l2SimpleView: boolean,

		l2SelectedCategory: string,
		l2IsSelected: boolean,
		l1Selected: string,

		l2DopdownButton: boolean,
		shortProposalSelected: string,
		newproposal: boolean,

	};

};