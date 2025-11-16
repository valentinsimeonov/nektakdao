//DescriptionProposals.tsx

import './Description.css';
import React, { useRef, useEffect, useState } from 'react';
import {  formatDateMMDDYYYY, removeHttpTags, splitDescriptionIntoChunks } from '../Utils';

/* Redux */
import {useSelector, useDispatch} from 'react-redux';
import { RootState, ProposalData } from '../../store/types';
import { proposalsextendbuttondescription } from '../../store/ProposalsSlice';
// import { explanationsview } from '../../store/multimoduleSlice';
import { useQuery, useSubscription } from '@apollo/client';
import { QUERY_PROPOSALS_BY_ID_CATEGORY } from '../../api/proposalsQuery';



interface DescriptionProposalsProps {

}

const DescriptionProposals: React.FC<DescriptionProposalsProps> = () => {

	const dispatch = useDispatch();
	const proposalsSelectedButton = useSelector((state: RootState) => state.proposals.proposalsSelectedButton);
	const proposalsMiddleExtendButtonDescription = useSelector((state: RootState) => state.proposals.proposalsMiddleExtendButtonDescription);
	const [proposalData, setProposalData] = useState<ProposalData[]>([]);


	const selectedDashboard = useSelector((state: RootState) => state.navbar.selectedDashboard);
	


	
		const queryVariables =
		 selectedDashboard === "proposals" ? proposalsSelectedButton
		: "";



	const { loading: queryLoading, error: queryError, data: queryData } = useQuery(
		QUERY_PROPOSALS_BY_ID_CATEGORY,
		{
		  variables: {
			"id": queryVariables
		  }
		}
	  );
	
	useEffect(() => {
		if (queryData) {
		setProposalData(queryData.proposals);
		}
	}, [queryData]);







const proposal = proposalData[0];





	
	return (
		<div className='IndivMiddleLearnContentcolumn'>
			
			<div className="IndivMiddleLearnCategoryrow">
				<div className="IndivMiddleTitlerow">

					<button className='IndivMiddleTitleButton'
							// onClick={() => dispatch(explanationsview("proposalsdescription"))}
					>
						<span>
							Description
						</span>
					</button>

				</div>
			</div>





			<div className="IndivMiddleShortBodyIcolumn">

				<div className='IndivMiddleDescriptionRow'>
				{proposal && proposal.description && (
					splitDescriptionIntoChunks(proposal.description).map((chunk, idx) => (
					<p key={idx} className="IndivMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>


			<div className="IndivMiddleShortBodyIcolumn">

				<div className='IndivMiddleDescriptionRow'>
				{proposal && proposal.mission && (
					splitDescriptionIntoChunks(proposal.mission).map((chunk, idx) => (
					<p key={idx} className="IndivMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>


			<div className="IndivMiddleShortBodyIcolumn">

				<div className='IndivMiddleDescriptionRow'>
				{proposal && proposal.budget  && (
					splitDescriptionIntoChunks(proposal.budget).map((chunk, idx) => (
					<p key={idx} className="IndivMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>




			<div className="IndivMiddleShortBodyIcolumn">

				<div className='IndivMiddleDescriptionRow'>
				{proposal && proposal.implement  && (
					splitDescriptionIntoChunks(proposal.implement).map((chunk, idx) => (
					<p key={idx} className="IndivMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>






			<div className="IndivMiddleShortBodyIcolumn">

				{proposal && proposal?.votesUp && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Votes Up:  {proposal && proposal?.votesUp   ? proposal.votesUp : 'n/a'}
				</span>
				)}

				{proposal && proposal?.votesDown && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Votes Down:  {proposal && proposal?.votesDown   ? proposal.votesDown : 'n/a'}
				</span>
				)}


				{proposal && proposal?.category && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Category:  {proposal && proposal?.category   ? proposal.category : 'n/a'}
				</span>
				)}
				



				{proposal && proposal.tx_hash != null && proposal.tx_hash !== undefined && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Transaction Hash:  {proposal && proposal?.tx_hash   ? proposal.tx_hash : 'n/a'}
				</span>
				)}

				{proposal && proposal?.chain && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Chain:  {proposal && proposal?.chain   ? proposal.chain : 'n/a'}
				</span>
				)}

				{proposal && proposal?.created_at && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Created Date:  {proposal && proposal?.created_at   ? formatDateMMDDYYYY(proposal.created_at) : 'n/a'}
				</span>
				)}




				{proposal && proposal?.confirmed && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Confirmed:  {proposal && proposal?.confirmed   ? proposal.confirmed : 'n/a'}
				</span>
				)}


				{proposal && proposal?.status && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Technical Status:  {proposal && proposal?.status   ? proposal.status : 'n/a'}
				</span>
				)}



				{proposal && proposal?.voting_start_block && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Voting Start Block:  {proposal && proposal?.voting_start_block   ? proposal.voting_start_block : 'n/a'}
				</span>
				)}
				{proposal && proposal?.voting_end_block && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Voting End Block:  {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'}
				</span>
				)}

				{proposal && proposal?.block_number && ( 
				<span className='IndivMiddleShortBodyIRowspan'> 
					Block Number Created:  {proposal && proposal?.block_number   ? proposal.block_number : 'n/a'}
				</span>
				)}

				{/* {proposal && proposal?.voting_end_block && (  */}
				<span className='IndivMiddleShortBodyIRowspan'> 
					Voting Ends At:  PH
					
					{/* {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'} */}
				</span>
				{/* )} */}


				{/* {proposal && proposal?.voting_end_block && (  */}
				<span className='IndivMiddleShortBodyIRowspan'> 
					Execution Ends At:  PH
					
					{/* {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'} */}
				</span>
				{/* )} */}


				{/* {proposal && proposal?.voting_end_block && (  */}
				<span className='IndivMiddleShortBodyIRowspan'> 
					Status:  PH (DURING VOTING | EXECUTING | FEEDBACK)
					
					{/* {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'} */}
				</span>
				{/* )} */}




			</div>






		</div>

	);
};


export default DescriptionProposals;







