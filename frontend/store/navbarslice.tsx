import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const NavBarSlice = createSlice({
	name: "navbar",

	initialState: {

		selectedDashboard: "",

	},

	reducers: {



		selecteddashboard: (state, action) => {
			state.selectedDashboard = action.payload;
		},


	}
})

export const { 
	selecteddashboard


} = NavBarSlice.actions

export default NavBarSlice.reducer
