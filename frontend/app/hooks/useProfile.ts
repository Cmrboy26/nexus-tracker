import { useAuth0 } from "@auth0/auth0-react";
import { nanoid } from "@reduxjs/toolkit";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "~/hooks/redux";
import { useAuthFetch } from "~/hooks/useAuthFetch";
import { setProfile, setProfileError, startProfileLoad, type Profile } from "~/reducers/profileReducer";

export function useProfile() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const subject = user?.sub;
  const authFetch = useAuthFetch();
  const dispatch = useAppDispatch();
  const state = useAppSelector(current => current.profile);

  const refreshProfile = useCallback(async (signal?: AbortSignal) => {
    if (!isAuthenticated || !subject) return;

    const requestId = nanoid();
    dispatch(startProfileLoad({ subject, requestId }));

    try {
      const response = await authFetch("/profile", { signal });
      if (!response.ok) throw new Error("Unable to load profile.");
      const data: { user: Profile | null } = await response.json();
      if (!signal?.aborted) dispatch(setProfile({ subject, requestId, profile: data.user }));
    } catch (error) {
      if (!signal?.aborted) {
        dispatch(setProfileError({
          subject,
          requestId,
          error: error instanceof Error ? error.message : "Unable to load profile.",
        }));
      }
    }
  }, [authFetch, dispatch, isAuthenticated, subject]);

  if (isLoading) return { profile: null, status: "loading" as const, error: null, isRefreshing: false, refreshProfile };
  if (!isAuthenticated) return { profile: null, status: "signed-out" as const, error: null, isRefreshing: false, refreshProfile };
  if (!subject) return { profile: null, status: "error" as const, error: "Unable to identify your account.", isRefreshing: false, refreshProfile };
  if (state.subject !== subject) return { profile: null, status: "loading" as const, error: null, isRefreshing: false, refreshProfile };

  return { profile: state.profile, status: state.status, error: state.error, isRefreshing: state.status === "ready" && state.requestId !== null, refreshProfile };
}