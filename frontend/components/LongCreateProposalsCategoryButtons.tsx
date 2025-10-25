// "use client";
import './LongCreateProposalsCategoryButtons.css';

import React, { useState, useEffect, useRef } from "react";

/* Redux */
import { RootState } from '../store/types';
import { useSelector, useDispatch } from 'react-redux';

import { 
	
	l2extendleftpanel, l2selectedsubfunc, l2extendrightpanel, l2videoon,
	l2resetfunc, l2resetcategorybuttons, l2cat, l2selectedcategory, l2selectl1,

	
	createnewproposal
} 	from '../store/ProposalsSlice';



export default function LongCreateProposalsCategoryButtons () {

	const dispatch = useDispatch();

	const l2AllCat = useSelector((state: RootState) => state.proposals.l2AllCat);

	const l2SelectedCategory = useSelector((state: RootState) => state.proposals.l2SelectedCategory);
	const newproposal = useSelector((state: RootState) =>  state.proposals.newproposal);


	return (
		<div className="LongCreateProposalsCategoryButtonMain">
				<button className={`LongCreateProposalsCategoryButton ${newproposal ? 'LongCreateProposalsCategoryButtonSelected' : ''}`}
						onClick={() => dispatch(createnewproposal())}
					>
					<span>
						+
					</span>
				</button>
		</div>
	);
};
