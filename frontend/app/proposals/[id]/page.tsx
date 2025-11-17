// app/proposals/[id]/page.tsx

"use client";

import React from 'react';
import './proposals.css';
import RootLayout from '../../layout';
import Banner from '../../../components/banner'
import { ApolloProvider } from '@apollo/client';
import client from '../../../api/apolloclient';
import { RootState } from '../../../store/types';
import { useSelector, useDispatch } from 'react-redux';
import { proposalsselectedbutton, proposalsextendbottompanel }
	from '../../../store/ProposalsSlice';
import { useMediaQuery } from "../../../components/Utils";
// import { indivmiddlemobilevisible } from "../../../store/IndivSlice";
import  ProposalsLeftModuleMain  from "../../../components/proposals/leftModule/ProposalsLeftModuleMain";
import Navbar from '../../../components/navbar/Navbar';
import CreateProposals from '../../../components/proposals/CreateProposals';
import LongCreateProposals from '../../../components/proposals/LongCreateProposals';
import ProposalsMiddleModule from '../../../components/middle_module/MiddleModule';


export default function ProposalsPage({
	params,
  }: {
	params: { id: string };
  }) {
	const { id } = params;
  


	const isMobile = useMediaQuery('(max-width: 768px)');
	const mobileOpen = useSelector((state: RootState) => state.proposals.proposalsMiddleMobileVisible);

	const dispatch = useDispatch();


  return (
	<ApolloProvider client={client}>
			<RootLayout>
				<div className='ProposalsMain'>

					
					<Banner />
					<div className='ProposalsNavBarContainer'>

						<Navbar />
					</div>

					<div className='ProposalsModules'>

						<div className='ProposalsLeftModuleContainer'>
							<ProposalsLeftModuleMain id={id} />
						</div>



						{isMobile && mobileOpen && (
						<div className="ProposalsMobileMiddleContainer">
							<ProposalsMiddleModule />
						</div>
						)}


						{/* {isMobile && mobileOpen && (
						<button className="ProposalsCloseMiddleModuleBtn"
								onClick={() => dispatch(proposalsmiddlemobilevisible(false))}>
							Close
						</button>
						)} */}


						{!isMobile && (
						<div className='ProposalsMiddleModuleContainer'>
							{/* <LongCreateProposals /> */}

							<ProposalsMiddleModule />
						</div>
						)}


					</div>
				</div>
			</RootLayout>
	</ApolloProvider>
  );
};

