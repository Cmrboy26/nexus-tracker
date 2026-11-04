import { createSlice } from "@reduxjs/toolkit";

interface ProfileState {
  name: string;
  email: string;
}

const initialState: ProfileState = {
  name: "",
  email: "",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.name = action.payload.name;
      state.email = action.payload.email;
    },
  },
});

export const { setProfile } = profileSlice.actions;
export default profileSlice.reducer;