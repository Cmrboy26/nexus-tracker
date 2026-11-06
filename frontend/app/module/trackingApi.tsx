type AuthFetch = (path: string, options?: RequestInit) => Promise<Response>;

import type { components } from "~/models/api.generated";
import type { DailyLog, DrinkEntry, LoggedDrinkEntry, LoggedMealEntry, LoggedMoodEntry, MealEntry, MoodEntry, TrackingSuggestions } from "~/models/tracking";

export async function getSuggestions(authFetch: AuthFetch, signal?: AbortSignal) {
	const response = await authFetch("/tracking/suggestions", {
		signal,
	});
	if (!response.ok) throw new Error("Unable to get suggestions.");
	const data: TrackingSuggestions = await response.json();
	return data;
}

export async function getDay(authFetch: AuthFetch, date: string, signal?: AbortSignal): Promise<DailyLog> {
	const response = await authFetch(`/day/${date}`, { signal });
	if (!response.ok) throw new Error("Unable to load entries.");
	const data: components["schemas"]["TrackingLog"] = await response.json();
	return {
		mood: data.mood.map(entry => ({ ...entry, time: new Date(entry.time) })),
		meals: data.meals,
		drinks: data.drinks.map(entry => ({ ...entry, time: new Date(entry.time) })),
	};
}

async function postEntry(authFetch: AuthFetch, date: string, type: "mood" | "meal" | "drink", entry: MoodEntry | MealEntry | DrinkEntry) {
	const response = await authFetch(`/day/${date}/${type}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(entry),
	});
	if (!response.ok) throw new Error("Unable to save entry.");
	return response;
}

export async function saveMood(authFetch: AuthFetch, date: string, entry: MoodEntry): Promise<LoggedMoodEntry> {
	const response = await postEntry(authFetch, date, "mood", entry);
	const data: components["schemas"]["LoggedMoodEntry"] = await response.json();
	return { ...data, time: new Date(data.time) };
}

export async function saveMeal(authFetch: AuthFetch, date: string, entry: MealEntry): Promise<LoggedMealEntry> {
	const response = await postEntry(authFetch, date, "meal", entry);
	return response.json();
}

export async function saveDrink(authFetch: AuthFetch, date: string, entry: DrinkEntry): Promise<LoggedDrinkEntry> {
	const response = await postEntry(authFetch, date, "drink", entry);
	const data: components["schemas"]["LoggedDrinkEntry"] = await response.json();
	return { ...data, time: new Date(data.time) };
}

export async function deleteEntry(authFetch: AuthFetch, entryId: string) {
	const response = await authFetch(`/tracking/entries/${encodeURIComponent(entryId)}`, { method: "DELETE" });
	if (!response.ok) throw new Error("Unable to remove entry.");
}
