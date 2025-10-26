




import './UserBar.css';


import ConnectWallet from "../ConnectWallet";




export default function UserBar() {




	return(

		<div className='UserBarMainrow'>

			<div className='UserBarButtonrow'>
				<button className="UserBarbutton">
						{/* <button className={`UserBarbutton ${(categoryType === "all") ? 'UserBarbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('all')}> */}
					<span>
						My Proposals
					</span>
				</button>
						{/* <button className={`UserBarbutton ${(categoryType === "governance") ? 'UserBarbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('governance')}> */}
				<button className="UserBarbutton">
					<span>
						Saved Proposals
					</span>
				</button>
						{/* <button className={`UserBarbutton ${(categoryType === "projects") ? 'UserBarbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('projects')}> */}
						
				<button className="UserBarbutton">
					<span>
						PlaceHolder
					</span>
				</button>

				   <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<ConnectWallet />

					</div>


			</div>

			<div className="UserBarUserCard">
				<button>
					<div className='UserBarCardrow'>
						
						<div className='UserBarCardLogoColumn'>
								<img src='/aks/C9.png' alt='FirstUserLogo' />
						</div>
						
						<div className='UserBarCardNameandDescriptionColumn'>
							<span className='ChatUserBarsTitle'>
								Harry Winslow
							</span>
							<span className='ChatUserBarsShortBody'>
								Activist
							</span>
						</div>
					</div>
				</button>
			</div>



{/* 
			<div className='UserBarLogoButtonrow'>
				<button	className='UserBarComunitiesbutton'
					>
					<img src={'/ShareMoreBlack.png'} />
					<span>Channel</span>
				</button>
			</div>


			<button className='UserBarCreateCommsbutton'>
				<span>
					+
				</span>
			</button>


			<div className='UserBarCommsButtonrow'>
				<button	className='UserBarComunitiesbutton'
					>
					<img src={'/ShareMoreBlack.png'} />
					<span>Channel</span>
				</button>

				<button	className='UserBarComunitiesbutton'
					>
					<img src={'/ShareMoreBlack.png'} />
					<span>Channel</span>
				</button>
			</div> */}

			


		</div>


	);
};





