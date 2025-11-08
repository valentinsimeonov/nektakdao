//app/page.tsx
'use client';
import Image from 'next/image';
import RootLayout from './layout';
import './homepage.css';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/types';

import Banner from '../components/banner';
import Navbar from '../components/navbar/Navbar';


export default function Home () {

	const dispatch = useDispatch();



  return (
	<RootLayout>
		<div className='HomePageMain'>
			
			<Banner />


			<div className='HomePageNavBarContainer'>
				<Navbar />
			</div>


			<div className='HomePageMaincolum'>

			</div>

		</div>
	</RootLayout>
  );
};

