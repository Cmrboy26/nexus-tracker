import { describe, expect, it, vi } from "vitest";
import { deleteEntry, getDay, getSuggestions, saveDrink, saveMeal, saveMood } from "./trackingApi";

describe("getSuggestions", () => {
  it("requests and returns suggestions", async () => {
    const suggestions = {
      mood: ["Calm"],
      meals: { am: ["Eggs"], mid: [], pm: [] },
      drinks: [{ name: "Water" }],
    };
    const authFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => suggestions });
    const signal = new AbortController().signal;

    await expect(getSuggestions(authFetch, signal)).resolves.toEqual(suggestions);
    expect(authFetch).toHaveBeenCalledWith("/tracking/suggestions", { signal });
  });

  it("rejects unsuccessful responses", async () => {
    const authFetch = vi.fn().mockResolvedValue({ ok: false });

    await expect(getSuggestions(authFetch)).rejects.toThrow("Unable to get suggestions.");
  });
});

describe("tracking entries", () => {
  it("loads a day and converts entry timestamps", async () => {
    const time = "2026-11-05T08:30:00Z";
    const authFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      mood: [{ id: "mood-1", ratings: { mood: 5 }, labels: ["Calm"], time }],
      meals: [{ id: "meal-1", name: "Eggs", period: "am" }],
      drinks: [{ id: "drink-1", drink: { name: "Water" }, time }],
    }) });

    const day = await getDay(authFetch, "2026-11-05");
    expect(authFetch).toHaveBeenCalledWith("/day/2026-11-05", { signal: undefined });
    expect(day.mood[0].time).toEqual(new Date(time));
    expect(day.mood[0].id).toBe("mood-1");
    expect(day.drinks[0].time).toEqual(new Date(time));
    expect(day.drinks[0].id).toBe("drink-1");
    expect(day.meals[0].id).toBe("meal-1");
  });

  it("posts each entry and deletes an entry", async () => {
    const authFetch = vi.fn().mockImplementation(async (path: string, options?: RequestInit) => ({
      ok: true,
      json: async () => ({ ...JSON.parse(String(options?.body)), id: path.split("/").at(-1) + "-1" }),
    }));
    const time = new Date("2026-11-05T08:30:00Z");
    const mood = { ratings: { mood: 5 }, labels: ["Calm"], time };
    const meal = { name: "Eggs", period: "am" as const };
    const drink = { drink: { name: "Water", volume: 1, unit: "cups" as const }, time };
    await expect(saveMood(authFetch, "2026-11-05", mood)).resolves.toMatchObject({ id: "mood-1", time });
    await expect(saveMeal(authFetch, "2026-11-05", meal)).resolves.toMatchObject({ id: "meal-1" });
    await expect(saveDrink(authFetch, "2026-11-05", drink)).resolves.toMatchObject({ id: "drink-1", time });
    await deleteEntry(authFetch, "meal-1");

    expect(authFetch).toHaveBeenNthCalledWith(1, "/day/2026-11-05/mood", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mood),
    });
    expect(authFetch).toHaveBeenNthCalledWith(2, "/day/2026-11-05/meal", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meal),
    });
    expect(authFetch).toHaveBeenNthCalledWith(3, "/day/2026-11-05/drink", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(drink),
    });
    expect(authFetch).toHaveBeenNthCalledWith(4, "/tracking/entries/meal-1", { method: "DELETE" });
  });

  it("reports failed reads and writes", async () => {
    const authFetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(getDay(authFetch, "2026-11-05")).rejects.toThrow("Unable to load entries.");
    await expect(saveMeal(authFetch, "2026-11-05", { name: "Eggs", period: "am" })).rejects.toThrow("Unable to save entry.");
    await expect(deleteEntry(authFetch, "meal-1")).rejects.toThrow("Unable to remove entry.");
  });
});