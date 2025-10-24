




import './CommsMain.css';

export default function CommsMain() {




	return(

		<div className='CommsMainMainrow'>


			<div className='CommsMainLogoButtonrow'>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/logo/SpiralLogo.png'} />
					<span>AlignPool</span>
				</button>
			</div>


			<button className='CommsMainCreateCommsbutton'>
				<span>
					+
				</span>
			</button>


			<div className='CommsMainCommsButtonrow'>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C1.png'} />
					<span>Midnight</span>
				</button>

				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C2.png'} />
					<span>Happy Trees</span>
				</button>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C3.png'} />
					<span>Riders</span>
				</button>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C4.png'} />
					<span>TheGate</span>
				</button>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C5.png'} />
					<span>Stormz</span>
				</button>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C6.png'} />
					<span>KitchenRoom</span>
				</button>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C7.png'} />
					<span>Chouchers</span>
				</button>
				<button	className='CommsMainComunitiesbutton'
					>
					<img src={'/aks/C8.png'} />
					<span>Spirakt</span>
				</button>
			</div>

			


		</div>


	);
};








			// {/* <button className={`CommsMainComunitiesbutton ${newproposal ? 'CommsMainComunitiesbuttonSelected' : ''}`} */}
			// 	{/* // key={coins.id} */}

			// 	<button	className='CommsMainComunitiesbutton'
			// 	// onClick={() => dispatch(optimisticcom(coins.id))}   
			// >
			// 		{/* <img src={`128/${coins.id.toLowerCase()}.png`} alt={`${coins.id}L2`} />
			// 	<span>{coins.name}</span> */}

			// 	<img src={'/aks/C1.png'} />
			// 	<span>Channel</span>
			// </button>
