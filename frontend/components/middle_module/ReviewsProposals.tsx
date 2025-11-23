//ReviewsProposals.tsx

import './Reviews.css';
// import Loading from "../loading";
import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
// import Link from 'next/link'; 

import {useSelector, useDispatch} from 'react-redux';
import { RootState, ProposalData } from '../../store/types';
import { useQuery, useSubscription, useMutation } from '@apollo/client';
import { } from '../../api/proposalsQuery';
import { QUERY_PROPOSALS_BY_ID_CATEGORY, MUTATION_PROPOSALS_VOTE_UP, MUTATION_PROPOSALS_VOTE_DOWN} from '../../api/proposalsQuery';




interface ReviewsProposalsProps {

  }


const ReviewsProposals: React.FC<ReviewsProposalsProps> = () => {


	const proposalsSelectedButton = useSelector((state: RootState) => state.proposals.proposalsSelectedButton);

	const dispatch = useDispatch();
	const [proposalData, setProposalData] = useState<ProposalData[]>([]);


	const proposalsLeftModuleLayer = useSelector((state: RootState) => state.proposals.proposalsLeftModuleLayer);

	const selectedDashboard = useSelector((state: RootState) => state.navbar.selectedDashboard);
	
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	
	const [location, setLocation] = useState("");
	


	
		const queryVariables =
		 selectedDashboard === "proposals" ? proposalsSelectedButton
		: "";





	const { loading: queryLoading, error: queryError, data: queryData } = useQuery(
		QUERY_PROPOSALS_BY_ID_CATEGORY,
		{
		  variables: {
			"id": `${queryVariables}`
		  }
		}
	  );
	
	  useEffect(() => {
		if (queryData) {
		  setProposalData(queryData.proposals);
		}
	  }, [queryData]);
	




	  const proposal = proposalData[0];






	  const [voteUp] = useMutation(MUTATION_PROPOSALS_VOTE_UP, {
		onCompleted: (data) => {
		  setProposalData(data.voteUp);  
		},
	  });

	  const [voteDown] = useMutation(MUTATION_PROPOSALS_VOTE_DOWN, {
		onCompleted: (data) => {
		  setProposalData(data.voteDown);  
		},
	  });


	  


	  /////////// Infinite Scrolling ////////////////
	  const [start, setStart] = useState(0);
	  const [end, setEnd] = useState(100);
	  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
		// Helper function to scroll to the bottom
		const scrollToBottom = () => {
		  if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		  }
		};
	  
		// Function to scroll to the bottom only if the user is near the bottom
		const scrollToBottomIfNeeded = () => {
		  if (chatContainerRef.current) {
			const container = chatContainerRef.current;
			const atBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
			if (atBottom) {
			  scrollToBottom();
			}
		  }
		};
	  

	  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
		  const container = event.currentTarget;
		  const scrollPosition = container.scrollTop;
  
		  const containerHeight = container.clientHeight;
		  const contentHeight = container.scrollHeight;
  
		  if (scrollPosition + containerHeight >= contentHeight - 200) {
			  setEnd((prevEnd) => prevEnd + 5);
		  }
	  };
  



	  const handleVoteUp = async () => {
		try {
		  await voteUp({
			variables: {
			  id: queryVariables,
			}
		  });

		} catch (err) {
		  console.error("Error sending message:", err);
		}
	  };

	  const handleVoteDown = async () => {
		try {
		  await voteDown({
			variables: {
			  id: queryVariables,
			}
		  });

		} catch (err) {
		  console.error("Error sending message:", err);
		}
	  };
	















	// Function to format numbers with appropriate suffix
	function formatNumber(number: number) {
		if (number >= 1e9) {
			return `${(number / 1e9).toFixed(1)}b`;
		} else if (number >= 1e6) {
			return `${(number / 1e6).toFixed(1)}m`;
		} else {
			return number.toString();
		}
	}

	// Function to format percentage with four decimal places
	function formatPercentage(percentage: number | null | undefined) {
		if (percentage === null || percentage === undefined) {
		return 'n/a';
		}
		return percentage.toFixed(1);
	}


	// Function to format the date consistently
	function formatDateConsistently(dateInput: string | number): string {
		let dateObj: Date;
	
		// Check if the input is a timestamp (number or string that can be converted to a number)
		if (typeof dateInput === 'number' || /^\d+$/.test(dateInput)) {
		dateObj = new Date(Number(dateInput)); // Convert timestamp to Date object
		} else {
		dateObj = new Date(dateInput); // Convert ISO string to Date object
		}
	
		// Format the date to 'YYYY-MM-DD HH:mm:ss' format
		return dateObj.toLocaleString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true,
		});
	}


	return (

		<div className="ProposalsReviewsMaincolumn">
	
			<div className='ProposalsReviewscolumn'>
				<div className='ProposalsReviewsAvatarNameVotesrow'>
					<div className='ProposalsReviewsAvatarrow'>
						<div className="ProposalsReviewsImageContainer">
							<img 
								src={`/64/${queryVariables.toLowerCase()}.png`}
								alt={`${queryVariables}L2`} 
								onError={(e) => {
									// When the image fails to load, set a placeholder with the first letter
									if (e.currentTarget.src !== `/64/${queryVariables.toLowerCase()}.png`) {
										e.currentTarget.style.display = 'none'; // Hide the image
										const container = e.currentTarget.parentElement;
										if (container) {
											const placeholder = container.querySelector('.ProposalsReviewsImageContainerPlaceholder');
											if (placeholder) {
												(placeholder as HTMLElement).style.display = 'flex'; // Show the placeholder
											}
										}
									}
								}} 
							/>
							<div className="ProposalsReviewsImageContainerPlaceholder">{queryVariables.charAt(0)}</div>
						</div>
					</div>

					<div className='ProposalsReviewsNamerow'>
						<div className="ProposalsReviewsTitlerow">
							<span>
								{queryVariables.charAt(0).toUpperCase() + queryVariables.slice(1)}
							</span>
						</div>
					</div>

					<div className='ProposalsReviewsVoteButtonsrow'>
						<button className='ProposalsReviewsVoteUpButton'
								onClick={() => handleVoteUp()}
							>
							<div className='ProposalsReviewsIconColumn'>
								<Image src='/Voting/VoteUp.png' alt='img' width={200} height={360} className='ProposalsReviewsIconColumnimg'/>
							</div>
							
							<div className='ProposalsReviewsNameColumn'>
								<span className='ProposalsReviewsUpDownTitle'>
									Vote Up
								</span>
							</div>
						</button>

						<button className='ProposalsReviewsVoteUpButton'
								onClick={() => handleVoteDown()}

							>
							<div className='ProposalsReviewsIconColumn'>
								<Image src='/Voting/VoteDown.png' alt='img' width={200} height={360} className='ProposalsReviewsIconColumnimg'/>
							</div>
							
							<div className='ProposalsReviewsNameColumn'>
								<span className='ProposalsReviewsUpDownTitle'>
									Vote Down
								</span>
							</div>
						</button>
					</div>

				</div>

				<div className="ProposalsReviewsTrustScoreColumn">
					<div className="ProposalsReviewsTrustScorerow1">
						<span>Votes Up</span>
						<span>Votes Down</span>
					</div>

					<div className="ProposalsReviewsTrustScorerow2">
						<span>{proposal && proposal?.votesUp   ? proposal.votesUp : 'n/a'} </span>
						<span>{proposal && proposal?.votesDown   ? proposal.votesDown : 'n/a'}</span>
					</div>
				</div>

			</div>





		</div>

	);
};


export default ReviewsProposals;








