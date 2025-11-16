//ProposalsSlice.tsx
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface ProposalsLeftModuleLayerPayload {
	layer: string;
	selectedButton?: string;
  }


export const proposalsSlice = createSlice ({
	name: 'proposals',

	initialState: {
		proposalsLeftModuleLayer: "projects",
		proposalsSelectedButton: "",




		proposalsMiddleExplanationsExtendBottomPanel: false,
		proposalsMiddleModuleButton: "details",
		proposalsLeftExtendBottomPanel: false,
		proposalsMiddleExtendButtonStats: false,
		proposalsMiddleExtendButtonDescription: false,






		proposalsShouldAutoScroll: true,

		proposalsMiddleMobileVisible: false,







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



		proposalsleftmodulelayer: (state, action: PayloadAction<ProposalsLeftModuleLayerPayload>) => {
			state.proposalsLeftModuleLayer = action.payload.layer;
			// Always set the middle module button based on the layer
			if (state.proposalsLeftModuleLayer === "all") {
				state.proposalsSelectedButton = action.payload.selectedButton || "1";
			} else if (state.proposalsLeftModuleLayer === "governance") {
				state.proposalsSelectedButton = action.payload.selectedButton || "1";
			} else if (state.proposalsLeftModuleLayer === "projects") {
				state.proposalsSelectedButton = action.payload.selectedButton || "1";
			}
		},





		proposalsmiddlemobilevisible(state, action: PayloadAction<boolean>) {
			state.proposalsMiddleMobileVisible = action.payload;
		},

		setShouldAutoScroll(state, action: PayloadAction<boolean>) {
			state.proposalsShouldAutoScroll = action.payload;
		},

		proposalsmiddleexplanationsextendbottompanel: (state) => {
			state.proposalsMiddleExplanationsExtendBottomPanel = !state.proposalsMiddleExplanationsExtendBottomPanel;
		},

		proposalsselectedbutton: (state, action) => {
			state.proposalsSelectedButton = action.payload;
		},

		proposalsextendbottompanel: (state) => {
			state.proposalsLeftExtendBottomPanel = !state.proposalsLeftExtendBottomPanel;
		},

		proposalsextendbuttonstats: (state) => {
			state.proposalsMiddleExtendButtonStats = !state.proposalsMiddleExtendButtonStats;
		},

		proposalsextendbuttondescription: (state) => {
			state.proposalsMiddleExtendButtonDescription = !state.proposalsMiddleExtendButtonDescription;
		},

		proposalsmiddlemodulebutton: (state, action) => {
			state.proposalsMiddleModuleButton = action.payload;
		},






















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


export const { proposalsleftmodulelayer, proposalsselectedbutton, proposalsextendbottompanel,
	proposalsextendbuttonstats, proposalsextendbuttondescription, proposalsmiddlemodulebutton,
	proposalsmiddleexplanationsextendbottompanel, 
	setShouldAutoScroll, proposalsmiddlemobilevisible,



	l2extendleftpanel, l2selectedsubfunc, l2extendrightpanel, l2videoon,
	l2resetfunc, l2resetcategorybuttons, l2cat, l2selectedcategory, l2selectl1,
	dropdownbutton, shortproposalselected, createnewproposal
	

} = proposalsSlice.actions;

export default proposalsSlice.reducer;











