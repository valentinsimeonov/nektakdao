//app/proposals/page.ts

"use client";

import './proposals.css';
import RootLayout from '../layout';

import LongCreateProposals from '../../components/proposals/LongCreateProposals';
import ShortProposals from '../../components/ShortProposals';
import CommsMain from '../../components/communities/CommsMain';
import UserBar from '../../components/userbar/UserBar';
import Banner from '../../components/banner';

export default function HomePage() {

  return (
	<RootLayout>
		<div className="HomePageMaincolumn">
							<Banner />



			<div className='HomePageNavBarContainer'>
					<UserBar />
			</div>



			<div className="HomePageMainrow">

				
				<div className="HomePageLeftModulecolumn">
					
					{/* <CommsMain /> */}
					
					<ShortProposals />
				
				</div>

				<div className="HomePageRightModulecolumn">
				

					<LongCreateProposals />
			
				</div>
			</div>
		</div>
	</RootLayout>
  );
};



