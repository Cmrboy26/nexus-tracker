import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Profile {
  id: string;
  auth0_id: string;
  email: string | null;
  display_name: string | null;
  birthday: string | null;
}

interface ProfileState {
  profile: Profile | null;
  status: "signed-out" | "loading" | "missing" | "ready" | "error";
  error: string | null;
  subject: string | null;
  requestId: string | null;
}

const initialState: ProfileState = {
  profile: null,
  status: "signed-out",
  error: null,
  subject: null,
  requestId: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    startProfileLoad: (state, action: PayloadAction<{ subject: string; requestId: string }>) => {
      if (state.subject !== action.payload.subject || !state.profile || state.status !== "ready") {
        state.profile = null;
        state.status = "loading";
      }
      state.error = null;
      state.subject = action.payload.subject;
      state.requestId = action.payload.requestId;
    },
    setProfile: (state, action: PayloadAction<{ subject: string; requestId: string; profile: Profile | null }>) => {
      if (state.subject !== action.payload.subject || state.requestId !== action.payload.requestId) return;
      state.profile = action.payload.profile;
      state.status = action.payload.profile ? "ready" : "missing";
      state.requestId = null;
    },
    setProfileError: (state, action: PayloadAction<{ subject: string; requestId: string; error: string }>) => {
      if (state.subject !== action.payload.subject || state.requestId !== action.payload.requestId) return;
      state.status = state.profile ? "ready" : "error";
      state.error = action.payload.error;
      state.requestId = null;
    },
    clearProfile: () => initialState,
  },
});

export const { startProfileLoad, setProfile, setProfileError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;