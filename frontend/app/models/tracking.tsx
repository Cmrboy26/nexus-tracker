import type { paths } from "~/models/api.generated";

type TrackingSuggestions = paths["/tracking/suggestions"]["get"]["responses"][200]["content"]["application/json"];
type Drink = TrackingSuggestions["drinks"][number];

type MoodEntry = {
    ratings: Partial<Record<string, number>>;
    labels: string[];
    time: Date;
}

type MealEntry = {
    name: string;
    period: "am" | "mid" | "pm";
}

type DrinkEntry = {
    drink: Drink;
    time: Date;
}

export type { Drink, MoodEntry, MealEntry, DrinkEntry, TrackingSuggestions };