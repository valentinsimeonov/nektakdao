//app/proposals/page.ts

"use client";

import './proposals.css';
import RootLayout from '../layout';

import LongCreateProposals from '../../components/LongCreateProposals';
import ShortProposals from '../../components/ShortProposals';
import CommsMain from '../../components/communities/CommsMain';
import UserBar from '../../components/userbar/UserBar';

export default function HomePage() {

  return (
	<RootLayout>
		<div className="HomePageMaincolumn">
			<div className="HomePageMainrow">
				<div className="HomePageLeftModulecolumn">
					
					<CommsMain />
					
					<ShortProposals />
				
				</div>

				<div className="HomePageRightModulecolumn">
				
					<UserBar />

					<LongCreateProposals />
			
				</div>
			</div>
		</div>
	</RootLayout>
  );
};



