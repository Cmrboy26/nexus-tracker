type AuthFetch = (path: string, options?: RequestInit) => Promise<Response>;

import type { TrackingSuggestions } from "~/models/tracking";

export async function getSuggestions(authFetch: AuthFetch, signal?: AbortSignal) {
	const response = await authFetch("/tracking/suggestions", {
		signal,
	});
	if (!response.ok) throw new Error("Unable to get suggestions.");
	const data: TrackingSuggestions = await response.json();
	return data;
}
 