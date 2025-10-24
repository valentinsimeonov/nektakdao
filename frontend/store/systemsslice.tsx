// systemsslice.tsx
import { createSlice } from "@reduxjs/toolkit";

export const SystemsSlice = createSlice({
  name: "systems",

  initialState: {
    currentSystemIndex: 0,
	  systemLength: 3,
  },

  reducers: {
	setCurrentSystemIndex: (state, action) => {
		state.currentSystemIndex = action.payload;
	},

    incrementCurrentSystemIndex: (state, action) => {
		  state.systemLength = action.payload;
      state.currentSystemIndex = (state.currentSystemIndex + 1) % state.systemLength;
    },

    decrementCurrentSystemIndex: (state, action) => {
      state.systemLength = action.payload;
      state.currentSystemIndex = (state.currentSystemIndex - 1 + state.systemLength) % state.systemLength;
    },

  },
});

export const { incrementCurrentSystemIndex, decrementCurrentSystemIndex, setCurrentSystemIndex } = SystemsSlice.actions;

export default SystemsSlice.reducer;
