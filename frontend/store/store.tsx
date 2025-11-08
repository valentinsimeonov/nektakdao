//store.tsx

import { configureStore } from "@reduxjs/toolkit";

import proposalsReducer from './ProposalsSlice';

import navbarReducer from './navbarslice';


const store = configureStore ({

	reducer: {

		proposals: proposalsReducer,
		navbar: navbarReducer,

	},
});

export default store

export type RootState = ReturnType<typeof store.getState>
