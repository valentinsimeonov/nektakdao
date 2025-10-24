//store.tsx

import { configureStore } from "@reduxjs/toolkit";

import proposalsReducer from './ProposalsSlice';



const store = configureStore ({

	reducer: {

		proposals: proposalsReducer,

	},
});

export default store

export type RootState = ReturnType<typeof store.getState>
