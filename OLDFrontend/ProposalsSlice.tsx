// ethereuml2slice.tsx
import { isNonNullObject } from "@apollo/client/utilities";
import { createSlice } from "@reduxjs/toolkit";

export const proposalsSlice = createSlice({
  name: "proposals",
  initialState: {

/* Category Buttons */
	l2AllCat: false,


/* SubFunc Buttons */
	l2ExtendLeftPanel: false,
	l2SimpleView: false,

	l2ExtendRightPanel: false,
	l2VideoOn: false,
	l2WhichVideo: null,

/* Other */	
	l2Layer2: false,

	l2SelectedCategory: "Optimistic",

	l2SelectedSubFunc: "l2simpleview",

	l2IsSelected: false,
	l1Selected: null,


	l2DopdownButton: false,

	shortProposalSelected: null,
	newproposal: false,
	
  },


  reducers: {

	shortproposalselected: (state, action) => {
		state.shortProposalSelected = action.payload;
	},

	createnewproposal: (state) => {
		state.newproposal = !state.newproposal;
	},



	l2extendleftpanel: (state) => {
		state.l2ExtendLeftPanel = !state.l2ExtendLeftPanel;
	},


	l2selectedsubfunc:(state, action) => {
		state.l2SelectedSubFunc = action.payload;
	},



	l2extendrightpanel: (state) => {
		state.l2ExtendRightPanel = !state.l2ExtendRightPanel;
	},
	
	l2videoon: (state, action) => {
		state.l2VideoOn = !state.l2VideoOn;
		state.l2WhichVideo = action.payload;
	},




	

	l2resetfunc: (state) => {
		state.l2Layer2 = !state.l2Layer2;

		state.l2ExtendLeftPanel = false;
		state.l2ExtendRightPanel = false;
		
		state.l2SimpleView = true;


	},


	l2resetcategorybuttons: (state, action) => {
		state.l2AllCat = action.payload;


	},

	l2cat: (state) => {
		state.l2AllCat = !state.l2AllCat; 


	},

 

	l2selectedcategory:(state, action) => {
		state.l2SelectedCategory = action.payload;

	},


	l2selectl1: (state, action) => {
		state.l1Selected = action.payload;
	},


	dropdownbutton: (state) => {
		state.l2DopdownButton = !state.l2DopdownButton;
	},

  },
});

export const { l2extendleftpanel, l2selectedsubfunc, l2extendrightpanel, l2videoon,
	l2resetfunc, l2resetcategorybuttons, l2cat, l2selectedcategory, l2selectl1,
	dropdownbutton, shortproposalselected, createnewproposal
} = proposalsSlice.actions;


export default proposalsSlice.reducer;
