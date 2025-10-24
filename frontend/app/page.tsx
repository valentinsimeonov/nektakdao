//app/page.tsx
'use client';
import Image from 'next/image';
import RootLayout from './layout';
import './homepage.css';
// import axios from "axios";
// import {useEffect, useState} from 'react';
// import Link from 'next/link';

// import ContactForm from '../components/homepage/ContactForm';
// import Footer from '../components/homepage/footer';

/* Firebase Next Auth*/
// import { signOut, useSession, signIn } from 'next-auth/react';
// import {redirect} from 'next/navigation';
// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// import { homepagefooterbutton }  from "../store/HomepageSlice";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/types';
// import NavBar from '../components/navbar/navbar';

// import TourController from "../components/tour/TourController";
// import IndivPopUp from '../components/indivPopUp';
// import MultiModule from '../components/multimodule/multimodule';
import Banner from '../components/banner';


export default function Home () {

	const dispatch = useDispatch();
	// const homepageFooterButton = useSelector((state: RootState) => state.homepage.homepageFooterButton);

	// const navbarMultimoduleSwitch = useSelector((state: RootState) => state.navbar.navbarMultimoduleSwitch);
	// const indivMiddleReviewsProfile = useSelector((state: RootState) => state.indiv.indivMiddleReviewsProfile);
	// const navbarHelpButton = useSelector((state: RootState) => state.navbar.navbarHelpButton);
	// const navbarHelpCategory = useSelector((state: RootState) => state.navbar.navbarHelpCategory);

	// const isMobile = useMediaQuery('(max-width: 768px)');
	// const mobileOpen = useSelector((state: RootState) => state.indiv.indivMiddleMobileVisible);


  return (
	<RootLayout>
		<div className='HomePageMain'>
			

			{/* {((indivMiddleReviewsProfile?.indivPopUp === 0 && navbarHelpButton === "showatstart") || (navbarHelpButton === "show")) &&
			<div className='SidebarIndivPop'>
				<IndivPopUp />
			</div>
			} */}

			{/* {navbarHelpCategory === "tour" && (
				<TourController />
			)} */}

			<Banner />


			<div className='HomePageNavBarContainer'>
				{/* <NavBar /> */}
			</div>


			<div className='HomePageMaincolum'>




				{/* <div>
					<Footer />
				</div>


				{navbarMultimoduleSwitch && 
				<div className='HomepageMultiModuleContainer'>
					<MultiModule />
				</div> 
				} */}

			</div>

		</div>
	</RootLayout>
  );
};


// Home.requireAuth = true










	// const { data: session, status } = useSession({
    //     required: true,
    //     onUnauthenticated() {
    //         signIn('/signin'); // Use signIn to redirect to the sign-in page
	// 	},
    // });

	// const [test, setTest] = useState('');


    // // Log the session status whenever it changes
    // useEffect(() => {
    //     console.log("F - HomePage - session status:", status);
	// 	console.log("F - HomePAge - variable session:", session);

    // }, [status]);

    // if (status === 'loading') {
    //     return <div>Loading...</div>; // Or any other loading state representation
    // }

	// useEffect(() => {
	// 	const getTest = async () => {
	// 		console.log("F - Homepage - test: ", test);
	// 	try {
	// 		const response = await axios.get<string>('https://nektak.com/test/hello');
	// 		console.log('F - Homepage - test::', response.data);
	// 		setTest(response.data);

	// 	} catch (err) {
	// 		console.error('Error fetching data:', (err as any).message);
	// 	}
	// 	}
	// 	getTest();
	//   }, [])

	//   useEffect(() => {
	// 	console.log("F - Homepage - test: ", test);
	// }, [test]);













{/* 
			<div className='HomePageFooterrow'>
				
				<div className='HomePageFooterLeftcolumn'>
					<div className="HomePageFooterLogorow">
						<button >
							<Image src='/Logo/LogoWhiteHex.png' alt='img' width={483} height={422} className='HomePageFooterLogorowimg'/>
							<span>Nektak</span>
						</button>
					</div>

					<span className='HomePageFooterMotto'>
						All about the Decentralised System
					</span>
				</div>

				<div className='HomePageFooterProductcolumn'>
					<span className='HomePageFooterProductTitlespan'>
						Product
					</span>

					<Link href="/map/12">
					<span className="HomePageFooterProductspan">
						Ecosystem View
					</span>
					</Link>

					<Link href="/indiv/123">
					<span className="HomePageFooterProductspan">
						Layer View
					</span>
					</Link>

					<Link href="/howto/1234">
					<span className="HomePageFooterProductspan">
						How To 
					</span>
					</Link>
				</div>

				<div className='HomePageFooterProductcolumn'>
					<span className='HomePageFooterProductTitlespan'>
						Resources
					</span>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("privacypolicy"))}
					>
						<span>
							Privacy Policy 
						</span>
					</button>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("cookiepolicy"))}
					>
						<span>
							Cookie Policy 
						</span>
					</button>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("termsofuse"))}
					>
						<span>
							Terms of use
						</span>
					</button>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("legalterms"))}
					>
						<span>
							Disclaimer
						</span>
					</button>

				</div>





				<div className='HomePageFooterProductcolumn'>
					<span className='HomePageFooterProductTitlespan'>
						Support
					</span>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("privacypolicy"))}
					>
						<span>
							FAQ 
						</span>
					</button>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("cookiepolicy"))}
					>
						<span>
							Contact 
						</span>
					</button>

				</div>




				<div className='HomePageFooterProductcolumn'>
					<span className='HomePageFooterProductTitlespan'>
						Donations
					</span>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("privacypolicy"))}
					>
						<span>
							Bitcoin 
						</span>
					</button>

					<button className='HomePageFooterProductbutton'
							onClick={() => dispatch(homepagefooterbutton("cookiepolicy"))}
					>
						<span>
							Ethereum 
						</span>
					</button>

				</div>


			</div>


			<div className='HomePageFooterDisclaimerrow'>
				<span>
					IMPORTANT DISCLAIMER: All content provided herein our website, hyperlinked sites, associated applications, forums, blogs, social media accounts and other platforms (“Site”) is for your general information only, procured from third party sources. We make no warranties of any kind in relation to our content, including but not limited to accuracy and updatedness. No part of the content that we provide constitutes financial advice, legal advice or any other form of advice meant for your specific reliance for any purpose. Any use or reliance on our content is solely at your own risk and discretion. You should conduct your own research, review, analyse and verify our content before relying on them. Trading is a highly risky activity that can lead to major losses, please therefore consult your financial advisor before making any decision. No content on our Site is meant to be a solicitation or offer.
				</span>
			</div>



			{ homepageFooterButton === "contact" && (
			<div className='HomePageFooterContactcolumn'>
				<ContactForm />
			</div>
			)}
 */}












	// const session = useSession({
	// 	required: true,
	// 	onUnauthenticated() {
	// 	  redirect('/signin');
	// 	},
	//   });








