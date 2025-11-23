//proposalsMiddleModule.tsx

import './MiddleModule.css';
// import Loading from "../loading";
// import Explanations from './Explanations';
import DescriptionProposals from './DescriptionProposals';
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { RootState } from '../../store/types';
import { useSelector, useDispatch } from 'react-redux';
import { proposalsselectedbutton, proposalsextendbottompanel, proposalsmiddlemodulebutton }
	from '../../store/ProposalsSlice';
import { useRouter, useSearchParams } from 'next/navigation'
import CreateProposals from '../proposals/CreateProposals';
import ReviewsProposals from './ReviewsProposals';





export default function ProposalsMiddleModule() {

	const proposalsLeftModuleLayer = useSelector((state: RootState) => state.proposals.proposalsLeftModuleLayer);
	const proposalsSelectedButton = useSelector((state: RootState) => state.proposals.proposalsSelectedButton);
	const proposalsMiddleModuleButton = useSelector((state: RootState) => state.proposals.proposalsMiddleModuleButton);
	const dispatch = useDispatch();
	const selectedDashboard = useSelector((state: RootState) => state.navbar.selectedDashboard);
	




const router = useRouter()
const searchParams = useSearchParams()
// const dispatch = useDispatch()

// a little guard so we only initialize once
const [hasInit, setHasInit] = useState(false)

useEffect(() => {
  if (hasInit) return
  const params = new URLSearchParams(searchParams?.toString() ?? '')
  const view = params.get('view')           // <- our new param

  if (view === 'explanations' || view === 'details') {
    dispatch(proposalsmiddlemodulebutton(view))
  }
  // else: we leave Redux at its default ("details")

  setHasInit(true)
}, [hasInit, searchParams, dispatch])



const activeTab = useSelector((s: RootState) => s.proposals.proposalsMiddleModuleButton)

useEffect(() => {
  if (!hasInit) return   // don't clobber initial URL before URL→Redux runs

  const params = new URLSearchParams(searchParams?.toString() ?? '')
  params.set('view', activeTab)           // write back our chosen tab
  router.replace(`?${params.toString()}`)
}, [activeTab, hasInit, searchParams, router])





	const handleExplanationsButton = () => {
		dispatch(proposalsmiddlemodulebutton("explanations"));
	} 

	const handleDetailsButton = () => {
		dispatch(proposalsmiddlemodulebutton("details"));
	}

	const handleProposalsButton = () => {
		dispatch(proposalsmiddlemodulebutton("createProposals"));
	}



	return (
		<div className="ProposalsMiddleModuleMaincolumn">
	
			<div className="ProposalsMiddleCardContainerrow">
				{/* <button className={`ProposalsMiddleCardButton ${(proposalsMiddleModuleButton === "explanations") ? 'ProposalsMiddleCardButtonSelected' : '' }` }
						onClick={handleExplanationsButton}>
					<span> Explanations </span>
				</button> */}


				{/* <div className='ProposalsMiddleCardLine'>

				</div> */}
				
				
				<button className={`ProposalsMiddleCardButton ${(proposalsMiddleModuleButton === "details") ? 'ProposalsMiddleCardButtonSelected' : '' }` }
						onClick={handleDetailsButton}>
					<span> Details </span>
				</button>

				<div className='ProposalsMiddleCardLine'>

				</div>
				
				<button className={`ProposalsMiddleCardButton ${(proposalsMiddleModuleButton === "createProposals") ? 'ProposalsMiddleCardButtonSelected' : '' }` }
						onClick={handleProposalsButton}>
					<span> Create Proposal </span>
				</button>



			</div>


			{ proposalsMiddleModuleButton === "details" &&
 			(selectedDashboard === "proposals") && 

			<div className='ProposalsMiddleContentContainercolumn'>

				<div className="ProposalsMiddleLearnContainercolumn"
					>
						<DescriptionProposals />			
				</div>

				<div className="ProposalsMiddleLearnContainercolumn"
					>
						<ReviewsProposals />			
				</div>

				{/* <div ref={sentinelRef} style={{ height: '1px' }} /> */}

			</div>
			}



			{ proposalsMiddleModuleButton === "createProposals" &&

			<div className='ProposalsMiddleContentContainercolumn'>
				<div className="ProposalsMiddleLearnContainercolumn"
					>
						<CreateProposals />			
				</div>
			</div>
			}


		</div>
	);
};			


