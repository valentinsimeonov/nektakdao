//ProposalsLeftModuleMain.tsx
"use client";

import './ProposalsLeftModuleMain.css';
import ProposalsLeftModule from './ProposalsLeftModule';

import React, { useState, useEffect, useMemo} from 'react';
/* Redux */
import { RootState } from '../../../store/types';
import { useSelector, useDispatch } from 'react-redux';


import { proposalsleftmodulelayer, proposalsselectedbutton, setShouldAutoScroll } from '../../../store/ProposalsSlice';


import { useMutation, useLazyQuery } from '@apollo/client';
import { useRouter, useSearchParams } from 'next/navigation';






interface ProposalsLeftModuleMainProps {
	id: string;
}


export default function ProposalsLeftModuleMain({ id }: ProposalsLeftModuleMainProps) {

	const router = useRouter();
	const searchParams = useSearchParams();
	const paramsString = searchParams ? searchParams.toString() : "";
	const params = new URLSearchParams(paramsString);
	const proposalsLeftModuleLayer = useSelector((state: RootState) => state.proposals.proposalsLeftModuleLayer);
  	const proposalsSelectedButton = useSelector((state: RootState) => state.proposals.proposalsSelectedButton);
	const dispatch = useDispatch();

  	// const selectedDashboard = useSelector((state: RootState) => state.navbar.selectedDashboard);
  	const selectedDashboard = "proposals";




	/////////// Infinite Scrolling ////////////////
	const [start, setStart] = useState(0);
	const [end, setEnd] = useState(30);

  ////////////////////////////////////// Navigation Address
const [hasInitializedFromURL, setHasInitializedFromURL] = useState(false);



  // Taking From Address Bar the Parameters and Inserting them into Redux Variables
  useEffect(() => {
  const urlParams = new URLSearchParams(searchParams?.toString() ?? "");
  const currentLayer = urlParams.get("layer");
  const currentSelectedProposal = urlParams.get("selectedProposal");


  // 1) Layer from URL → Redux
  if (currentLayer && currentLayer !== proposalsLeftModuleLayer) {
    dispatch(proposalsleftmodulelayer({ layer: currentLayer }));
  }


   // 2) Based on layer, pull the right “selected” param into Redux
  if (currentLayer === "governance" && currentSelectedProposal && currentSelectedProposal !== proposalsSelectedButton) {
    dispatch(proposalsselectedbutton(currentSelectedProposal));
  } else if (
    currentLayer === "projects" &&
    currentSelectedProposal &&
    currentSelectedProposal !== proposalsSelectedButton
  ) {
    dispatch(proposalsselectedbutton(currentSelectedProposal));
  
  } else if (currentSelectedProposal && currentSelectedProposal !== proposalsSelectedButton) {
    dispatch(proposalsselectedbutton(currentSelectedProposal));
  }



    setHasInitializedFromURL(true);

}, []); // run once on mount





// Taking from Redux Variables and inserting into Address Bar
  useEffect(() => {
	if (!hasInitializedFromURL) return;

    const urlParams = new URLSearchParams(searchParams ? searchParams.toString() : "");
  	
	urlParams.set("layer", proposalsLeftModuleLayer);

	urlParams.set("selectedProposal", proposalsSelectedButton);


    router.replace(`?${urlParams.toString()}`);
  }, [proposalsLeftModuleLayer, proposalsSelectedButton, hasInitializedFromURL]);




  const updateLayerInURL = (layer: string, defaultSelected: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set('dashboard', selectedDashboard);

	params.set("layer", layer);
	
	// params.set("selectedProposal", defaultSelected);

    router.push(`?${params.toString()}`);
  };




  const handleLayerClick = (layer: string) => {
    dispatch(proposalsleftmodulelayer({ layer }));
	// dispatch(explanationsview(layer));
  	dispatch(setShouldAutoScroll(true));

    if (layer === "governance") {
      updateLayerInURL(layer, "1");

	 } else if (layer === "projects") {
    updateLayerInURL(layer, "1");

// all
    } else {
      updateLayerInURL(layer, proposalsSelectedButton);
    }
  };





  ////////////////////////////////////////////////////////////////////////
//                    Scroll into View
///////////////////////////////////////////////////////////////////////


  // this is used for programmatic ensure:
  const ensureProposalVisible = (idx: number) => {
    if (idx >= end) setEnd(idx + 5);
  };

  // this is passed as the "load more" onScroll callback:
  const loadMoreProposals = () => setEnd(e => e + 5);

  

////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



	return (
		<div className="ProposalsLeftModuleMainMaincolumn">

			<div className='ProposalsLeftLayerButtonsContainerrow'>
				

				<button className={`ProposalsLeftLayerButton ${(proposalsLeftModuleLayer === "all") ? 'ProposalsLeftLayerButtonSelected' : '' }` }
						onClick={() => handleLayerClick("all")}
				>
					<span>All</span>
				</button>
				<button className={`ProposalsLeftLayerButton ${(proposalsLeftModuleLayer === "governance") ? 'ProposalsLeftLayerButtonSelected' : '' }` }
						onClick={() => handleLayerClick("governance")}
				>
					<span>Governance</span>
				</button>


				<button className={`ProposalsLeftLayerButton ${(proposalsLeftModuleLayer === "projects") ? 'ProposalsLeftLayerButtonSelected' : '' }` }
						onClick={() => handleLayerClick("projects")}
				>
					<span>Projects</span>
				</button>



			</div>


			<div className='ProposalsLeftModuleMainMiddlecolumn'
			>
				<ProposalsLeftModule
				start={start}
				end={end}
				onLoadMore={loadMoreProposals}
				onEnsureProposalVisible={ensureProposalVisible}
            />
			</div>




		</div>
	);
};







