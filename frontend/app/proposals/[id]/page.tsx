// app/proposals/[id]/page.tsx

"use client";

import React from 'react';
import './proposals.css';
import RootLayout from '../../layout';
import Banner from '../../../components/banner'
import UserBar from '../../../components/userbar/UserBar';

import { ApolloProvider } from '@apollo/client';
import client from '../../../api/apolloclient';

import { RootState } from '../../../store/types';
import { useSelector, useDispatch } from 'react-redux';
import { proposalsselectedbutton, proposalsextendbottompanel }
	from '../../../store/ProposalsSlice';


import { useMediaQuery } from "../../../components/Utils";
// import { indivmiddlemobilevisible } from "../../../store/IndivSlice";

import  ProposalsLeftModuleMain  from "../../../components/proposals/leftModule/ProposalsLeftModuleMain";



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

						<UserBar />
					</div>

					<div className='ProposalsModules'>

						<div className='ProposalsLeftModuleContainer'>
							<ProposalsLeftModuleMain id={id} />
						</div>

{/* 

						{isMobile && mobileOpen && (
						<div className="ProposalsMobileMiddleContainer">
							<ProposalsMiddleModule />
						</div>
						)}


						{isMobile && mobileOpen && (
						<button className="ProposalsCloseMiddleModuleBtn"
								onClick={() => dispatch(proposalsmiddlemobilevisible(false))}>
							Close
						</button>
						)}



						{!isMobile && (
						<div className='ProposalsMiddleModuleContainer'>
							<ProposalsMiddleModule />
						</div>
						)} */}


					</div>
				</div>
			</RootLayout>
	</ApolloProvider>
  );
};

