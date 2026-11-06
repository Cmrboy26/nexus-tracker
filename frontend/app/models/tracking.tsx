import type { components, paths } from "~/models/api.generated";

type TrackingSuggestions = paths["/tracking/suggestions"]["get"]["responses"][200]["content"]["application/json"];
type Drink = TrackingSuggestions["drinks"][number];

type MoodEntry = {
    ratings: Partial<Record<string, number>>;
    labels: string[];
    time: Date;
}
type LoggedMoodEntry = Omit<components["schemas"]["LoggedMoodEntry"], "time"> & { time: Date };

type MealEntry = components["schemas"]["MealEntry"];
type LoggedMealEntry = components["schemas"]["LoggedMealEntry"];

type DrinkEntry = {
    drink: Drink;
    time: Date;
}
type LoggedDrinkEntry = Omit<components["schemas"]["LoggedDrinkEntry"], "time"> & { time: Date };

type DailyLog = {
    mood: LoggedMoodEntry[];
    meals: LoggedMealEntry[];
    drinks: LoggedDrinkEntry[];
}

export type { Drink, MoodEntry, LoggedMoodEntry, MealEntry, LoggedMealEntry, DrinkEntry, LoggedDrinkEntry, DailyLog, TrackingSuggestions };