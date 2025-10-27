
//components/banner.tsx
import { url } from 'inspector';
import './banner.css';


export default function Banner() {
  return (
	<div className='BannerMain'>
		
		<div className='BannerRight'>
			<button className='BannerButton'
				// onClick={() => {
				// 	window.location.href = 'https://www.einstein-online.info/en/spotlight/doppler/';
				//   }}
				
				onClick={() => {
				window.open('https://www.savethechildren.org/', '_blank');
				}}
			>
				{/* <img src={`/Banners/SaveTheChildrenTransparent.png`} alt={`Baner`} onError={(e) => {
					if (e.currentTarget.src !== "/logo/SpiralLogo.png") {
						e.currentTarget.src = "/logo/SpiralLogo.png";
					}
				}} /> */}
			</button>
		</div>




	</div>
  );
};


