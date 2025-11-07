//components/proposals/shortProposals.tsx
"use client";

import './ShortProposals.css';
import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';

/* Redux */
import { RootState } from '../../store/types';
import { useSelector, useDispatch } from 'react-redux';
import { 
	
	l2extendleftpanel, l2selectedsubfunc, l2extendrightpanel, l2videoon,
	l2resetfunc, l2resetcategorybuttons, l2cat, l2selectedcategory, l2selectl1,
	dropdownbutton, 
	
	shortproposalselected }
	from '../../store/ProposalsSlice';


interface Post {
	id: number;
	title: string;
	description: string;
	mission: string;
	budget: string;
	implement: string;

	votesUp: number;
	votesDown: number;

	shareMore: number;
	dateCreated: Date;
	avatar: string;
	avatarUrl: URL;
	// category: string[];
}



export default function ShortProposals() {

	const l2DopdownButton = useSelector((state: RootState) =>  state.proposals.l2DopdownButton);
	const dispatch = useDispatch();
	const shortProposalSelected = useSelector((state: RootState) =>  state.proposals.shortProposalSelected);

	// const [posts, setPosts] = useState<Post[]>([]);
///////////////////////
const posts = [
	{
		"id": 1,
		"title": "Ipsum Lorem 1",
		"description": "Ipsum Lorem 1 is a dummy or placeholder text commonly used in graphic design, publishing, and web development. Its purpose is to permit a page layout to be designed, independently of the copy that will subsequently populate it, or to demonstrate various fonts of a typeface without meaningful text that could be distracting. is a dummy or placeholder text commonly used in graphic design, publishing, and web development. Its purpose is to permit a page layout to be designed, independently of the copy that will subsequently populate it, or to demonstrate various fonts of a typeface without meaningful text that could be distracting.  ",
		"mission": "Mision Ipsum Lorem",
		"budget": "Budget Ipsum Lorem",
		"social": "Social Ipsum Lorem",
		"implement": "Implement Ipsum Lorem",
		"votesUp": 0,
		"votesDown": 0,
		"ShareMore": 0,
	},
	{
		"id": 3,
		"title": "Ipsum Lorem 1",
		"description": "Ipsum Lorem 1",
		"mission": "Mision Ipsum Lorem",
		"budget": "Budget Ipsum Lorem",
		"social": "Social Ipsum Lorem",
		"implement": "Implement Ipsum Lorem",
		"votesUp": 0,
		"votesDown": 0,
		"ShareMore": 0,
	},
	{
		"id": 3,
		"title": "Ipsum Lorem 1",
		"description": "Ipsum Lorem 1",
		"mission": "Mision Ipsum Lorem",
		"budget": "Budget Ipsum Lorem",
		"social": "Social Ipsum Lorem",
		"implement": "Implement Ipsum Lorem",
		"votesUp": 0,
		"votesDown": 0,
		"ShareMore": 0,
	},
	{
		"id": 4,
		"title": "Ipsum Lorem 1",
		"description": "Ipsum Lorem 1",
		"mission": "Mision Ipsum Lorem",
		"budget": "Budget Ipsum Lorem",
		"social": "Social Ipsum Lorem",
		"implement": "Implement Ipsum Lorem",
		"votesUp": 0,
		"votesDown": 0,
		"ShareMore": 0,
	},
	{
		"id": 5,
		"title": "Ipsum Lorem 1",
		"description": "Ipsum Lorem 1",
		"mission": "Mision Ipsum Lorem",
		"budget": "Budget Ipsum Lorem",
		"social": "Social Ipsum Lorem",
		"implement": "Implement Ipsum Lorem",
		"votesUp": 0,
		"votesDown": 0,
		"ShareMore": 0,
	},
];


	// useEffect(() => {
	// 	const fetchAllPosts = async () => {
	// 	  try {
	// 		const response = await axios.get<Post[]>('http://localhost:5000/proposals');
	// 		setPosts(response.data);
	
	// 		// Dispatch the first post ID if posts exist
	// 		if (response.data.length > 0) {
	// 		  dispatch(shortproposalselected(response.data[0].id));
	// 		}
	// 	   } catch (err: unknown) {
    //     if (err instanceof Error) {
    //       console.error("Error fetching posts:", err.message);
    //     } else {
    //       console.error("Error fetching posts:", String(err));
    //     }
    //   }
	// 	};
	
	// 	fetchAllPosts();
	//   }, [dispatch]);


	// const fetchAllPosts2 = async () => {
	// try {
	// 	const response = await axios.get('http://localhost:5000/proposals');
	// 	setPosts(response.data);
	// } catch (err: unknown) {
	// 	if (axios.isAxiosError(err)) {
	// 	// err is AxiosError now
	// 	if (err.response) {
	// 		// Not in the 2xx range
	// 		console.log(err.response.data);
	// 		console.log(err.response.status);
	// 		console.log(err.response.headers);
	// 	} else {
	// 		// No response (e.g., network error)
	// 		console.log("Axios error (no response):", err.message);
	// 	}
	// 	} else if (err instanceof Error) {
	// 	// Non-Axios generic Error
	// 	console.log("Non-Axios error:", err.message);
	// 	} else {
	// 	// Unknown throwable (string, number, etc.)
	// 	console.log("Unexpected error:", String(err));
	// 	}
	// }
	// };

	// const [categoryType, setCategoryType] = useState('');


	// const fetchbyCategory = async (category: string) => {

	// 	console.log("F - ShortProposals -- fetchByCategory -- categoryType: ", categoryType);

    //     try {
    //         const response = await axios.get('http://localhost:5000/proposals/bycategory', {
    //             params: {
	// 				category: String(category)
    //             }
    //         });
    //         setPosts(response.data);
			
	// 	} catch (err: unknown) {
	// 		if (err instanceof Error) {
	// 		console.error("Error fetching posts:", err.message);
	// 		} else {
	// 		console.error("Error fetching posts:", String(err));
	// 		}
	// 	}
    // };

    // const handleCategoryButton = (category: string) => {
    //     setCategoryType(category);
		
	// 	if ((category === 'governance') || (category === 'projects')){
	// 		console.log("CATEGORY: ", category);

	// 		fetchbyCategory(category);
	// 	}
	// 	if (category === 'all'){
	// 		console.log("CATEGORY All: ", category);

	// 		fetchAllPosts2();

	// 	}
		
    // };


	return(
		<div className='ShortProposalsMain'>
			<div className='ShortProposalsButtonrow'>

			{/* <button className={`ShortProposalsbutton ${(categoryType === "all") ? 'ShortProposalsbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('all')}>
					<span>
						All
					</span>
				</button>
				<button className={`ShortProposalsbutton ${(categoryType === "governance") ? 'ShortProposalsbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('governance')}>
					<span>
						Governance
					</span>
				</button>
				<button className={`ShortProposalsbutton ${(categoryType === "projects") ? 'ShortProposalsbuttonSelected' : ''}`}
						onClick={() => handleCategoryButton('projects')}>
					<span>
						Projects
					</span>
				</button> */}
			</div>
		

			<div className='ShortProposalsPostsscroll'>

				{posts.map(post => (
				<button className='ShortProposalsPostsButton'
						onClick={() => dispatch(shortproposalselected(post.id))}
						key={post.id}
				>

					<div className="ShortProposalsPostsButton2">

						<div className='ShortProposalsPostsCardrow'>
							<div className='ShortProposalsPostsCardLogoColumn'>
								{/* {post &&
								<img src={`http://localhost:5000/proposals/image/${post.avatar}`} alt="Avatar" />
								} */}
							</div>
							
							<div className='ShortProposalsPostsCardNameandDescriptionColumn'>
								<span className='ShortProposalsPostsCardTitle'>
									{post.title}
								</span>
								<span className='ShortProposalsPostsCardShortBody'>
									{/* {new Date(post.dateCreated).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })} */}

								</span>
							</div>
						</div>
						
						<div className="ShortProposalsPostsCard2row">
							<div className="ShortProposalsPostsCard2NameandDescriptionColumn">
								<span>
									{post.description}
								</span>
							</div>
						</div>

						<div className='ShortProposalsPostsCard2VotingButtonsrow'>
							{/* <p>Votes Up: {post.votesUp}</p>
							<p>Share More: {post.votesUp}</p>

							<p>Votes Down: {post.votesDown}</p> */}
							{/* <button onClick={() => handleVoteUp(post.id)}>Vote Up</button>
							<button onClick={() => handleVoteDown(post.id)}>Vote Down</button> */}
						</div>

					</div>
				</button>
				))}
			</div>
		</div>
	);
};



