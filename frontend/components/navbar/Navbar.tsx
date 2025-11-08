//components/userbar/Navbar.ts



import './Navbar.css';
import ConnectWallet from "../ConnectWallet";
// import BoxInteraction from "../BoxInteraction";
import Link from 'next/link';
import { useDispatch, useSelector } from "react-redux";
import { selecteddashboard } from "../../store/navbarslice";
import { RootState } from '../../store/types';




export default function Navbar() {

  const proposalsId = "123456";
	const dispatch = useDispatch();
	const selectedDashboard = useSelector((state: RootState) => state.navbar.selectedDashboard);


	return(

		<div className='NavbarMainrow'>

			<div className='NavbarButtonrow'>

				<div className='NavBarDashboardMiniContainerrow'>
					<div className='NavBarDashboardMiniContainerButtonrow'>
						<Link href={`/proposals/${proposalsId}?dashboard=proposals`}>
							<button className={`NavBarDashboardProposalsbutton ${selectedDashboard === "proposals" ? 'NavBarDashboardProposalsbuttonSelected' : ''}`} 
									onClick={() => dispatch(selecteddashboard("proposals"))}
									>
							</button>
						</Link>
						<div className="NavBarDashboardProposalsbuttonTooltip">
							Proposals
						</div>
					</div>
				</div>



				{/* <BoxInteraction /> */}

				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<ConnectWallet />
				</div>

			</div>

		</div>


	);
};





				{/* <button className="Navbarbutton"> */}
						{/* <button className={`Navbarbutton ${(categoryType === "all") ? 'NavbarbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('all')}> */}
					{/* <span>
						My Proposals
					</span>
				</button> */}
						{/* <button className={`Navbarbutton ${(categoryType === "governance") ? 'NavbarbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('governance')}> */}
				{/* <button className="Navbarbutton">
					<span>
						Saved Proposals
					</span>
				</button> */}
						{/* <button className={`Navbarbutton ${(categoryType === "projects") ? 'NavbarbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('projects')}> */}
						
				{/* <button className="Navbarbutton">
					<span>
						PlaceHolder
					</span>
				</button> */}











				{/* 
			<div className="NavbarUserCard">
				<button>
					<div className='NavbarCardrow'>
						
						<div className='NavbarCardLogoColumn'>
								<img src='/aks/C9.png' alt='FirstUserLogo' />
						</div>
						
						<div className='NavbarCardNameandDescriptionColumn'>
							<span className='ChatNavbarsTitle'>
								Harry Winslow
							</span>
							<span className='ChatNavbarsShortBody'>
								Activist
							</span>
						</div>
					</div>
				</button>
			</div> */}
