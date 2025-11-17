//ProposalsLeftModule.tsx
"use client";

import './ProposalsLeftModule.css';
import { formatDateMMDDYYYY } from '../../Utils';
import { VIEW_CONFIG, ViewKey, ColumnConfig } from "../../SortBySystemProposals";
import React, {useEffect, useState, useRef} from 'react';
import Image from 'next/image';
import { RootState, ProposalData } from '../../../store/types';
import { useSelector, useDispatch } from 'react-redux';
import { proposalsselectedbutton, proposalsextendbottompanel, proposalsleftmodulelayer, proposalsmiddlemobilevisible } from '../../../store/ProposalsSlice';
import { useQuery, useSubscription, useLazyQuery } from '@apollo/client';
import { QUERY_PROPOSALS_BY_ID_CATEGORY  } from '../../../api/proposalsQuery';
import { useRouter, useSearchParams } from "next/navigation";
import { setShouldAutoScroll } from '../../../store/ProposalsSlice';




interface ProposalsLeftModuleProps {
	onEnsureProposalVisible: (proposalIndex: number) => void;
  	onLoadMore: () => void;
	start: number;
	end: number;
}



const ProposalsLeftModule: React.FC<ProposalsLeftModuleProps> = ({  start, end, onLoadMore, onEnsureProposalVisible  }) => {


	const proposalsLeftExtendBottomPanel = useSelector((state: RootState) => state.proposals.proposalsLeftExtendBottomPanel);
	const proposalsLeftModuleLayer = useSelector((state: RootState) => state.proposals.proposalsLeftModuleLayer);
	const proposalsSelectedButton = useSelector((state: RootState) => state.proposals.proposalsSelectedButton);
	const dispatch = useDispatch();

	const [proposalData, setProposalData] = useState<ProposalData[]>([]);
	
	const router = useRouter();
	const searchParams = useSearchParams();
	const proposalsContainerRef = useRef<HTMLDivElement>(null);

	// New state: only auto scroll if this flag is true.
	// const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
	const shouldAutoScroll = useSelector((s: RootState) => s.proposals.proposalsShouldAutoScroll);

	// We'll track the previous proposals ID to avoid re-scrolling if it hasn't changed.
	const prevProposalIdRef = useRef<string | null>(null);

	// Cast your redux state to our known views
	const view = proposalsLeftModuleLayer as ViewKey;
	const config = VIEW_CONFIG[view];
	
	// Sort field can only ever be one of config.columns[].key
	type SF = ColumnConfig<typeof view>["key"];
	const [sortField, setSortField] = useState<SF | null>(null);
	const [sortAsc, setSortAsc] = useState(true);
	
	function handleSort(field: SF) {
		if (sortField === field) setSortAsc(a => !a);
		else {
		setSortField(field);
		setSortAsc(false);
		}
	}



const { loading: queryLoading, error: queryError, data: queryData } = useQuery(
    QUERY_PROPOSALS_BY_ID_CATEGORY,
	{
      variables: {
		"category": `${proposalsLeftModuleLayer}`,
      }
    }
  );




//   const { loading: subscriptionLoading, error: subscriptionError, data: subscriptionData } = useSubscription(
//     SUBSCRIPTION_PROPOSALS_ALL
//   );


  useEffect(() => {
    if (queryData) {
      setProposalData(queryData.proposals);
    }
  }, [queryData]);



//   useEffect(() => {
//     if (subscriptionData && subscriptionData.allProposalsUpdated) {
//       const updatedProposals = subscriptionData.allProposalsUpdated.filter(
//         (proposal: ProposalData) => proposal.type === proposalsLeftModuleLayer
//       );

//       if (updatedProposals.length > 0) {
//         setProposalData((prevProposalData) => {
//           const updatedProposalData = [...prevProposalData];

//           updatedProposals.forEach((updatedProposal: ProposalData) => {
//             const existingIndex = updatedProposalData.findIndex((proposal) => proposal.id === updatedProposal.id);
//             if (existingIndex !== -1) {
//               updatedProposalData[existingIndex] = updatedProposal;
//             } else {
//               updatedProposalData.push(updatedProposal);
//             }
//           });

//           return updatedProposalData;
//         });
//       }
//     }
//   }, [subscriptionData, proposalsLeftModuleLayer]);

////////////////////////////





//////////////////////////////////////////////////////////
///////////                Scrolling
//////////////////////////////////////////////////////////////

	// Disable auto-scroll when the user scrolls manually.
	useEffect(() => {
		const container = proposalsContainerRef.current;
		if (!container) return;
		const onUserScroll = () => {
			dispatch(setShouldAutoScroll(false));
		};
		container.addEventListener("scroll", onUserScroll);
		return () => {
		container.removeEventListener("scroll", onUserScroll);
		};
	}, []);





	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
	  // only disable auto-scroll on *real* user scrolls:
	  if (e.nativeEvent.isTrusted) {
		dispatch(setShouldAutoScroll(false));
	  }
  
	  // infinite load when near bottom
	  const c = e.currentTarget;
	  if (c.scrollTop + c.clientHeight >= c.scrollHeight - 200) {
		onLoadMore();
	  }
	};
  


	useEffect(() => {
	if (!shouldAutoScroll || !proposalsSelectedButton) return;
	const idx = proposalData.findIndex(d => d.id === proposalsSelectedButton);
	if (idx === -1) return;

	if (idx >= end) {
		onEnsureProposalVisible(idx);
		return; // Let next render handle scrolling
	}

	// Scroll it into view
	const el = proposalsContainerRef.current?.querySelector(`#proposal-${proposalsSelectedButton}`);
	if (el) {
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		prevProposalIdRef.current = proposalsSelectedButton;
	}
	}, [proposalsSelectedButton, proposalData, end, shouldAutoScroll]);


	useEffect(() => {
	if (!shouldAutoScroll || !proposalsSelectedButton) return;
	const el = proposalsContainerRef.current?.querySelector(`#proposal-${proposalsSelectedButton}`);
	if (el) {
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		prevProposalIdRef.current = proposalsSelectedButton;
	}
	}, [end]); // Just retry when more items are rendered



  //////////////////////////////////////////////



const proposals = proposalData;

const handleProposalSelected = (proposal: ProposalData) => {
    dispatch(proposalsselectedbutton(proposal.id));

	dispatch(proposalsmiddlemobilevisible(true));
	
	dispatch(setShouldAutoScroll(true));
    prevProposalIdRef.current = proposal.id;

    // Update the URL with the selected proposal. We combine the current query string with the new parameter.
    const paramsString = searchParams ? searchParams.toString() : "";
    const params = new URLSearchParams(paramsString);
    params.set("selectedProposal", proposal.id);
    router.push(`?${params.toString()}`);
  };








///////////////////////////////////////////////
//////  Copy Transaction Button

  const [copiedId, setCopiedId] = useState<string | null>(null);

const handleCopy = async (id: string, text: string) => {
  try {
    // write to clipboard (client-only; file already "use client")
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    // clear confirmation after 1.5s
    setTimeout(() => {
      setCopiedId(prev => (prev === id ? null : prev));
    }, 1500);
  } catch (err) {
    console.error("Copy failed", err);
    // you may want to show a toast here
  }
};

/////////////////////////////////////////////////






return (
	<div className='ProposalsLeftModuleProposalMain' >

		<div className="ProposalsSortByrow">
			{config?.columns?.map(col => (
				<button
				key={col.key}
				onClick={() => handleSort(col.key as SF)}
				className={`sort-btn ${sortField === col.key ? "active" : ""}`}
				>
				{col.label}
				{sortField === col.key && (sortAsc ? " ↑" : " ↓")}
				</button>
			))}
		</div>


		<div className='ProposalsLeftModuleBigColumn'
			onScroll={handleScroll}
			ref={proposalsContainerRef}>

			{proposals.slice(start, end).map((proposal) => (
			<div className='ProposalsCardBigColumn'
			key={proposal.id}
			id={`proposal-${proposal.id}`}
			>
				<button className='ProposalsCardContainerColumn'
						onClick={() => handleProposalSelected(proposal)}
				>
		
					<div className="ProposalsCardContainerrow">
						<div className="ProposalsCardLogocolumn">
						
							<div className="ProposalsCardImageContainer">
								<img 
									src={`/64/${proposal.id.toLowerCase()}.png`}
									alt={`${proposal.id}L2`} 
									onError={(e) => {
										// When the image fails to load, set a placeholder with the first letter
										if (e.currentTarget.src !== `/64/${proposal.id.toLowerCase()}.png`) {
											e.currentTarget.style.display = 'none'; // Hide the image
											const container = e.currentTarget.parentElement;
											if (container) {
												const placeholder = container.querySelector('.ProposalsCardImageContainerPlaceholder');
												if (placeholder) {
													(placeholder as HTMLElement).style.display = 'flex'; // Show the placeholder
												}
											}
										}
									}} 
								/>
								<div className="ProposalsCardImageContainerPlaceholder">{proposal.title.charAt(0)}</div>
							</div>


						</div>
						
						
						<div className="ProposalsCardNamerow">
							<div className='ProposalsCardLeftLeftcolumn'>
								<span>Votes Up</span>
								<span>Votes Down</span>
							</div>
							
							<div className='ProposalsCardLeftRightcolumn'>
								<span>{proposal && proposal.votesUp !== null ? proposal.votesUp : 'n/a'}</span>
								<span>{proposal && proposal.votesDown !== null ? proposal.votesDown : 'n/a'}</span> 
							</div>
						</div>

						<div className="ProposalsCardNamerow">
							<div className='ProposalsCardLeftcolumn'>
								<span>Status</span>
								<span>Created</span>

							</div>
							
							<div className='ProposalsCardRightcolumn'>
								<span>PH</span>
								<span>{proposal && proposal.created_at !== null ? formatDateMMDDYYYY(proposal.created_at) : 'n/a'}</span> 
							</div>
						</div>

					</div>
					
					<div className="ProposalsTitlerow">
						<span className='ProposalsTitleNamespan'> 
							{proposal && proposal.title !== null ? proposal.title : 'n/a'}
						</span>
						<span className='ProposalsTitlePricespan'> 

						</span>

					</div>
				</button>












			{ proposalsLeftExtendBottomPanel && 
			<div className='ProposalsCardBottomSidePanelOpencolumn'>

{/* 
				<div className="ProposalsTable1row">
					<div className='ProposalsCardPlaceholder'>
					</div>

					<div className="ProposalsCardNamerow">
						<div className='ProposalsCardLeftcolumn'>
							<span>Community</span>
							<span>Users Voted</span>	
						</div>

						<div className='ProposalsCardRightcolumn'>
							<span>n/a</span>
							<span>n/a</span>
						</div>
					</div>

					<div className="ProposalsCardNamerow">
						<div className='ProposalsCardLeftcolumn'>
							<span>Votes Up</span>
							<span>Votes Down</span>
						</div>

						<div className='ProposalsCardRightcolumn'>
							<span>n/a</span>
							<span>n/a</span>
						</div>
					</div>
				</div>
					 */}





<div className="ProposalsTable2row">
  <div className="ProposalsTableLeftcolumn">
    <span>Transaction Hash</span>
  </div>

  <div className="ProposalsTableRightcolumn">
    <div
      className="tx-wrapper"
      role="group"
      aria-label="Transaction hash and copy"
      // prevent click in wrapper from interfering with parent button
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className="tx-truncate"
        title={proposal?.tx_hash ?? "n/a"}
        aria-label={proposal?.tx_hash ?? "n/a"}
      >
        {proposal && proposal.tx_hash !== null ? proposal.tx_hash : "n/a"}
      </span>

      {proposal && proposal.tx_hash ? (
        <button
          className="copy-btn"
          onClick={(e) => {
            // don't trigger proposal selection
            e.stopPropagation();
            handleCopy(proposal.id, proposal.tx_hash!);
          }}
          aria-label={`Copy transaction hash`}
          title="Copy transaction hash"
        >
          <span className="copy-icon">
            {copiedId === proposal.id ? "✓" : "📋"}
          </span>
        </button>
      ) : null}
    </div>
  </div>
</div>









				<div className="ProposalsTable2row">
					<div className="ProposalsTableLeftcolumn">
						<span>Chain</span>
						<span>Confirmed</span>

					</div>
	
					<div className="ProposalsTableRightcolumn">
						<span>{proposal && proposal.chain !== null ? proposal.chain : 'n/a'}</span>
						<span>{proposal && proposal.confirmed !== null ? proposal.confirmed : 'n/a'}</span>

					</div>
				</div>
	




				<div className="ProposalsTable2row">
					<div className="ProposalsTableLeftcolumn">
						<span>Voting Start Block</span>
						<span>Voting End Block</span>
					</div>
	
					<div className="ProposalsTableRightcolumn">
						<span>{proposal && proposal.voting_start_block !== null ? proposal.voting_start_block : 'n/a'}</span>
						<span>{proposal && proposal.voting_end_block !== null ? proposal.voting_end_block : 'n/a'}</span>

					</div>
				</div>
	



				<div className="ProposalsTable2row">
					<div className="ProposalsTableLeftcolumn">
						<span>Block Number Created</span>
						<span>Technical Status</span>

					</div>
	
					<div className="ProposalsTableRightcolumn">
						<span>{proposal && proposal.block_number !== null ? proposal.block_number : 'n/a'}</span>
						<span>{proposal && proposal.status !== null ? proposal.status : 'n/a'}</span>

					</div>
				</div>
	



				<div className="ProposalsTable2row">
					<div className="ProposalsTableLeftcolumn">
						<span>Voting Ends Date</span>
						<span>Execution Ends Date</span>

					</div>
	
					<div className="ProposalsTableRightcolumn">
						<span>PH</span>
						<span>PH</span>

					</div>
				</div>
	







				<div className="Proposals2RowsDatarow1">
					
				</div>

				<div className="Proposals2RowsDatarow2">

				</div>









	
			</div>
			}

			<button className="ProposalsCardBottomSidePanelButton"
				onClick={() => dispatch(proposalsextendbottompanel())}
			>
				<Image src="/Logo/Logo_White.png" alt="LogoWhite" width={310} height={286} className='ProposalsCardBottomSidePanelButtonimg'/>
			</button>
		</div>
	))}


	</div>





	</div>
);
};


export default ProposalsLeftModule;

