import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useAppDispatch } from "~/hooks/redux";
import { useProfile } from "~/hooks/useProfile";
import { clearProfile } from "~/reducers/profileReducer";

export function SessionBootstrap() {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const subject = user?.sub;
  const dispatch = useAppDispatch();
  const { refreshProfile } = useProfile();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !subject) {
      dispatch(clearProfile());
      return;
    }

    const controller = new AbortController();
    void refreshProfile(controller.signal);
    return () => controller.abort();
  }, [dispatch, isAuthenticated, isLoading, refreshProfile, subject]);

  return null;
}