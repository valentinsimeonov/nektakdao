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
		<div className='ProposalsMiddleLearnContentcolumn'>
			


					
			<div className="ProposalsMiddleLearnCategoryrow">
				<div className="ProposalsMiddleTitlerow">

					<button className='ProposalsMiddleTitleButton'
							// onClick={() => dispatch(explanationsview("proposalsdescription"))}
					>
						<span>
							Title
						</span>
					</button>

				</div>
			</div>





			<div className="ProposalsMiddleShortBodyIcolumn">

				<div className='ProposalsMiddleDescriptionRow'>
				{proposal && proposal.title && (
					splitDescriptionIntoChunks(proposal.title).map((chunk, idx) => (
					<p key={idx} className="ProposalsMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>





			<div className="ProposalsMiddleLearnCategoryrow">
				<div className="ProposalsMiddleTitlerow">

					<button className='ProposalsMiddleTitleButton'
							// onClick={() => dispatch(explanationsview("proposalsdescription"))}
					>
						<span>
							Description
						</span>
					</button>

				</div>
			</div>





			<div className="ProposalsMiddleShortBodyIcolumn">

				<div className='ProposalsMiddleDescriptionRow'>
				{proposal && proposal.description && (
					splitDescriptionIntoChunks(proposal.description).map((chunk, idx) => (
					<p key={idx} className="ProposalsMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>





			<div className="ProposalsMiddleLearnCategoryrow">
				<div className="ProposalsMiddleTitlerow">

					<button className='ProposalsMiddleTitleButton'
							// onClick={() => dispatch(explanationsview("proposalsdescription"))}
					>
						<span>
							Mission
						</span>
					</button>

				</div>
			</div>



			<div className="ProposalsMiddleShortBodyIcolumn">

				<div className='ProposalsMiddleDescriptionRow'>
				{proposal && proposal.mission && (
					splitDescriptionIntoChunks(proposal.mission).map((chunk, idx) => (
					<p key={idx} className="ProposalsMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>





			<div className="ProposalsMiddleLearnCategoryrow">
				<div className="ProposalsMiddleTitlerow">

					<button className='ProposalsMiddleTitleButton'
							// onClick={() => dispatch(explanationsview("proposalsdescription"))}
					>
						<span>
							Budget
						</span>
					</button>

				</div>
			</div>




			<div className="ProposalsMiddleShortBodyIcolumn">

				<div className='ProposalsMiddleDescriptionRow'>
				{proposal && proposal.budget  && (
					splitDescriptionIntoChunks(proposal.budget).map((chunk, idx) => (
					<p key={idx} className="ProposalsMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>





			<div className="ProposalsMiddleLearnCategoryrow">
				<div className="ProposalsMiddleTitlerow">

					<button className='ProposalsMiddleTitleButton'
							// onClick={() => dispatch(explanationsview("proposalsdescription"))}
					>
						<span>
							Implement
						</span>
					</button>

				</div>
			</div>






			<div className="ProposalsMiddleShortBodyIcolumn">

				<div className='ProposalsMiddleDescriptionRow'>
				{proposal && proposal.implement  && (
					splitDescriptionIntoChunks(proposal.implement).map((chunk, idx) => (
					<p key={idx} className="ProposalsMiddleDescriptionParagraph">
						{chunk}
					</p>
					))
				)}
				</div>

			</div>





			<div className="ProposalsMiddleLearnCategoryrow">
				<div className="ProposalsMiddleTitlerow">

					<button className='ProposalsMiddleTitleButton'
							// onClick={() => dispatch(explanationsview("proposalsdescription"))}
					>
						<span>
							Details
						</span>
					</button>

				</div>
			</div>




			<div className="ProposalsMiddleShortBodyIcolumn">


				{proposal && proposal?.votesUp && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Votes Up:  {proposal && proposal?.votesUp   ? proposal.votesUp : 'n/a'}
				</span>
				)}

				{proposal && proposal?.votesDown && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Votes Down:  {proposal && proposal?.votesDown   ? proposal.votesDown : 'n/a'}
				</span>
				)}


				{proposal && proposal?.category && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Category:  {proposal && proposal?.category   ? proposal.category : 'n/a'}
				</span>
				)}
				







				{proposal && proposal.tx_hash != null && proposal.tx_hash !== undefined && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Transaction Hash:  {proposal && proposal?.tx_hash   ? proposal.tx_hash : 'n/a'}
				</span>
				)}

				{proposal && proposal?.chain && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Chain:  {proposal && proposal?.chain   ? proposal.chain : 'n/a'}
				</span>
				)}

				{proposal && proposal?.created_at && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Created Date:  {proposal && proposal?.created_at   ? formatDateMMDDYYYY(proposal.created_at) : 'n/a'}
				</span>
				)}






				{proposal && proposal?.confirmed && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Confirmed:  {proposal && proposal?.confirmed   ? proposal.confirmed : 'n/a'}
				</span>
				)}


				{proposal && proposal?.status && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Technical Status:  {proposal && proposal?.status   ? proposal.status : 'n/a'}
				</span>
				)}



				{proposal && proposal?.voting_start_block && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Voting Start Block:  {proposal && proposal?.voting_start_block   ? proposal.voting_start_block : 'n/a'}
				</span>
				)}
				{proposal && proposal?.voting_end_block && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Voting End Block:  {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'}
				</span>
				)}






				{proposal && proposal?.block_number && ( 
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Block Number Created:  {proposal && proposal?.block_number   ? proposal.block_number : 'n/a'}
				</span>
				)}

				{/* {proposal && proposal?.voting_end_block && (  */}
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Voting Ends At:  PH
					
					{/* {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'} */}
				</span>
				{/* )} */}


				{/* {proposal && proposal?.voting_end_block && (  */}
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Execution Ends At:  PH
					
					{/* {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'} */}
				</span>
				{/* )} */}


				{/* {proposal && proposal?.voting_end_block && (  */}
				<span className='ProposalsMiddleShortBodyIRowspan'> 
					Status:  PH (DURING VOTING | EXECUTING | FEEDBACK)
					
					{/* {proposal && proposal?.voting_end_block   ? proposal.voting_end_block : 'n/a'} */}
				</span>
				{/* )} */}




			</div>






		</div>

	);
};


export default DescriptionProposals;







