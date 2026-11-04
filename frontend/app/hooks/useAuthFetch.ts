import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";
import { api_url } from "~/module/api";

export function useAuthFetch() {
  const { getAccessTokenSilently } = useAuth0();

  return useCallback(async (path: string, options: RequestInit = {}) => {
    if (!path.startsWith("/") || path.startsWith("//")) {
      throw new Error("API path must start with a single slash");
    }

    const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
    if (!audience) {
      throw new Error("VITE_AUTH0_AUDIENCE is required");
    }

    const token = await getAccessTokenSilently({
      authorizationParams: { audience },
    });
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(`${api_url}${path}`, { ...options, headers });
  }, [getAccessTokenSilently]);
}