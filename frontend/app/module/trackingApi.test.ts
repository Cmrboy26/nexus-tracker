import { describe, expect, it, vi } from "vitest";
import { getSuggestions } from "./trackingApi";

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