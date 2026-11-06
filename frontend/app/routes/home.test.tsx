import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./home";

const { authFetch, session } = vi.hoisted(() => ({ authFetch: vi.fn(), session: { subject: "user-1", authenticated: true } }));

vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => ({ isAuthenticated: session.authenticated, user: session.authenticated ? { sub: session.subject } : undefined }) }));
vi.mock("~/hooks/useAuthFetch", () => ({ useAuthFetch: () => authFetch }));
vi.mock("~/hooks/useProfile", () => ({ useProfile: () => ({ profile: null }) }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 5, 12, 0, 0));
  authFetch.mockReset();
  session.subject = "user-1";
  session.authenticated = true;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("tracking entries", () => {
  it("renders without fetching suggestions when signed out", () => {
    session.authenticated = false;
    render(<Home />);
    expect(screen.getByText("Moods & Feelings", { exact: true })).toBeTruthy();
    expect(authFetch).not.toHaveBeenCalled();
  });

  it("does not show the previous user's suggestions while the next account loads", async () => {
    let finishSuggestions: ((response: { ok: boolean, json: () => Promise<object> }) => void) | undefined;
    authFetch.mockImplementation(async (path: string) => {
      if (path === "/tracking/suggestions") {
        if (session.subject === "user-2") return new Promise(resolve => { finishSuggestions = resolve; });
        return { ok: true, json: async () => ({ mood: [], meals: { am: [], mid: [], pm: [] }, drinks: [{ name: "Tea" }] }) };
      }
      return { ok: true, json: async () => ({ mood: [], meals: [], drinks: [] }) };
    });

    const user = userEvent.setup();
    const { rerender } = render(<Home />);
    await user.click(screen.getByText("Caffeine & Drinks", { exact: true }));
    expect(await screen.findByLabelText("Tea")).toBeTruthy();
    session.subject = "user-2";
    rerender(<Home />);
    expect(screen.queryByLabelText("Tea")).toBeNull();
    await waitFor(() => expect(finishSuggestions).toBeDefined());
    finishSuggestions!({ ok: true, json: async () => ({ mood: [], meals: { am: [], mid: [], pm: [] }, drinks: [{ name: "Coffee" }] }) });
    expect(await screen.findByLabelText("Coffee")).toBeTruthy();
  });

  it("refreshes suggestions after creating and deleting an entry", async () => {
    let mealExists = false;
    authFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/tracking/suggestions") return { ok: true, json: async () => ({
        mood: [], meals: { am: [], mid: mealExists ? ["Oatmeal"] : [], pm: [] }, drinks: [],
      }) };
      if (options?.method === "POST") {
        mealExists = true;
        return { ok: true, json: async () => ({ id: "meal-1", name: "Oatmeal", period: "mid" }) };
      }
      if (options?.method === "DELETE") {
        mealExists = false;
        return { ok: true };
      }
      return { ok: true, json: async () => ({
        mood: [],
        meals: path === "/day/2026-11-05" && mealExists ? [{ id: "meal-1", name: "Oatmeal", period: "mid" }] : [],
        drinks: [],
      }) };
    });

    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText("Meals", { exact: true }));
    const input = screen.getByRole("textbox", { name: "Add new meal" });
    await waitFor(() => expect(input.matches(":disabled")).toBe(false));
    await user.type(input, "Oatmeal");
    await user.click(screen.getByRole("button", { name: "Add Meal" }));
    await screen.findByRole("button", { name: "Remove Oatmeal" });
    await user.click(screen.getByRole("button", { name: "11/4" }));
    expect(await screen.findByRole("button", { name: "Oatmeal" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "11/5" }));
    await user.click(await screen.findByRole("button", { name: "Remove Oatmeal" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Oatmeal" })).toBeNull());
  });

  it("updates recency colors when the saved entry ages", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date(2026, 10, 5, 12, 0, 0));
    const recent = new Date(2026, 10, 5, 11, 15).toISOString();
    authFetch.mockImplementation(async (path: string) => path === "/tracking/suggestions"
      ? { ok: true, json: async () => ({ mood: [], meals: { am: [], mid: [], pm: [] }, drinks: [] }) }
      : { ok: true, json: async () => ({ mood: [{ id: "mood-1", ratings: {}, labels: [], time: recent }], meals: [], drinks: [] }) });

    await act(async () => { render(<Home />); });
    const moodSection = screen.getByText("Moods & Feelings", { exact: true }).closest("section")!;
    expect(moodSection.querySelector("[role=img]")?.classList.contains("text-green-500")).toBe(true);
    await act(async () => { vi.advanceTimersByTime(75 * 60 * 1000); });
    expect(moodSection.querySelector("[role=img]")?.classList.contains("text-orange-400")).toBe(true);
  });

  it("disables tracking controls while a day loads and a save is pending", async () => {
    let finishLoad: (response: { ok: boolean, json: () => Promise<object> }) => void = () => {};
    let finishSave: (response: { ok: boolean, json: () => Promise<object> }) => void = () => {};
    authFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/tracking/suggestions") return { ok: true, json: async () => ({
        mood: [], meals: { am: [], mid: ["Eggs"], pm: [] }, drinks: [],
      }) };
      if (options?.method === "POST") return new Promise(resolve => { finishSave = resolve; });
      return new Promise(resolve => { finishLoad = resolve; });
    });

    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText("Meals", { exact: true }));
    const mealButton = await screen.findByRole("button", { name: "Eggs" });
    expect(mealButton.matches(":disabled")).toBe(true);
    finishLoad({ ok: true, json: async () => ({ mood: [], meals: [], drinks: [] }) });
    await waitFor(() => expect(mealButton.matches(":disabled")).toBe(false));
    await user.click(mealButton);
    expect(screen.getByRole("button", { name: "11/4" }).matches(":disabled")).toBe(true);
    expect(mealButton.matches(":disabled")).toBe(true);
    finishSave({ ok: true, json: async () => ({ id: "meal-1", name: "Eggs", period: "mid" }) });
    await waitFor(() => expect(screen.getByRole("button", { name: "Remove Eggs" }).matches(":disabled")).toBe(false));
  });

  it("uses the most recent saved mood time even when an older mood is added", async () => {
    const recent = new Date(2026, 10, 5, 11, 15).toISOString();
    authFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/tracking/suggestions") return { ok: true, json: async () => ({
        mood: [], meals: { am: [], mid: [], pm: [] }, drinks: [],
      }) };
      if (options?.method === "POST") return { ok: true, json: async () => ({
        ...JSON.parse(String(options.body)), id: "older-mood",
      }) };
      return { ok: true, json: async () => ({
        mood: [{ id: "recent-mood", ratings: {}, labels: [], time: recent }], meals: [], drinks: [],
      }) };
    });

    const user = userEvent.setup();
    render(<Home />);
    const moodSection = screen.getByText("Moods & Feelings", { exact: true }).closest("section")!;
    await waitFor(() => expect(moodSection.querySelector("[role=img]")?.classList.contains("text-green-500")).toBe(true));
    await user.click(screen.getByText("Moods & Feelings", { exact: true }));
    const timeInput = moodSection.querySelector("input[type=time]") as HTMLInputElement;
    await user.clear(timeInput);
    await user.type(timeInput, "08:00");
    await user.click(screen.getByRole("button", { name: "Log Moods & Feelings" }));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith("/day/2026-11-05/mood", expect.objectContaining({ method: "POST" })));
    await waitFor(() => expect(moodSection.querySelector("details")?.open).toBe(false));
    expect(moodSection.querySelector("[role=img]")?.classList.contains("text-green-500")).toBe(true);
  });

  it("loads, saves, and removes entries for the selected day", async () => {
    const days: Record<string, { mood: unknown[], meals: { id: string, name: string, period: string }[], drinks: unknown[] }> = {};
    authFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/tracking/suggestions") return { ok: true, json: async () => ({
        mood: ["Calm"], meals: { am: ["Eggs"], mid: ["Eggs"], pm: [] }, drinks: [{ name: "Coffee", unit: "cups" }],
      }) };
      if (path.startsWith("/tracking/entries/")) {
        const id = path.split("/").at(-1);
        for (const day of Object.values(days)) day.meals = day.meals.filter(meal => meal.id !== id);
        return { ok: true };
      }
      const match = path.match(/^\/day\/(\d{4}-\d{2}-\d{2})(?:\/(mood|meal|drink))?$/);
      if (!match) throw new Error(`Unexpected request: ${path}`);
      const [, date, type] = match;
      const day = days[date] ??= { mood: [], meals: [], drinks: [] };
      if (!type) return { ok: true, json: async () => JSON.parse(JSON.stringify(day)) };
      const entry = JSON.parse(String(options?.body));
      if (type === "meal") {
        const meal = { ...entry, id: "meal-1" };
        day.meals.push(meal);
        return { ok: true, json: async () => meal };
      }
      const saved = { ...entry, id: `${type}-1` };
      day[type === "mood" ? "mood" : "drinks"].push(saved);
      return { ok: true, json: async () => saved };
    });

    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith("/day/2026-11-05", expect.anything()));

    await user.click(screen.getByText("Meals", { exact: true }));
    await user.click(await screen.findByRole("button", { name: "Eggs" }));
    expect(await screen.findByRole("button", { name: "Remove Eggs" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Remove Eggs" }));
    await waitFor(() => expect(days["2026-11-05"].meals).toEqual([]));

    await user.click(screen.getByText("Moods & Feelings", { exact: true }));
    await user.click(screen.getByLabelText("Calm"));
    await user.click(screen.getByRole("button", { name: "Log Moods & Feelings" }));
    await waitFor(() => expect(days["2026-11-05"].mood).toHaveLength(1));

    await user.click(screen.getByText("Caffeine & Drinks", { exact: true }));
    await user.click(screen.getByLabelText("Coffee"));
    await user.click(screen.getByRole("button", { name: "Log Drink" }));
    await waitFor(() => expect(days["2026-11-05"].drinks).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "11/4" }));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith("/day/2026-11-04", expect.anything()));
    await user.click(await screen.findByRole("button", { name: "Eggs" }));
    expect(await screen.findByRole("button", { name: "Remove Eggs" })).toBeTruthy();
    expect(days["2026-11-04"].meals).toHaveLength(1);
    expect(days["2026-11-05"].meals).toHaveLength(0);
  });

  it("keeps the input visible when saving fails", async () => {
    authFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/tracking/suggestions") return { ok: true, json: async () => ({
        mood: [], meals: { am: [], mid: [], pm: [] }, drinks: [],
      }) };
      if (options?.method === "POST") return { ok: false };
      return { ok: true, json: async () => ({ mood: [], meals: [], drinks: [] }) };
    });

    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByText("Moods & Feelings", { exact: true }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Log Moods & Feelings" }).matches(":disabled")).toBe(false));
    await user.type(screen.getByRole("textbox", { name: "Add or find a feeling" }), "Steady");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Log Moods & Feelings" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to save entry.");
    expect((screen.getByLabelText("Steady") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("button", { name: "Log Moods & Feelings" })).toBeTruthy();

    await user.click(screen.getByText("Meals", { exact: true }));
    const mealInput = screen.getByRole("textbox", { name: "Add new meal" }) as HTMLInputElement;
    await user.type(mealInput, "Oatmeal");
    await user.click(screen.getByRole("button", { name: "Add Meal" }));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith("/day/2026-11-05/meal", expect.objectContaining({ method: "POST" })));
    expect(mealInput.value).toBe("Oatmeal");
  });

  it("does not show a delayed save after switching users", async () => {
    let finishSave: (response: { ok: boolean, json: () => Promise<object> }) => void = () => {};
    authFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/tracking/suggestions") return { ok: true, json: async () => ({
        mood: [], meals: { am: [], mid: ["Eggs"], pm: [] }, drinks: [],
      }) };
      if (options?.method === "POST") return new Promise(resolve => { finishSave = resolve; });
      return { ok: true, json: async () => ({
        mood: [],
        meals: session.subject === "user-2" ? [{ id: "meal-2", name: "Rice", period: "mid" }] : [],
        drinks: [],
      }) };
    });

    const user = userEvent.setup();
    const { rerender } = render(<Home />);
    await user.click(screen.getByText("Meals", { exact: true }));
    await user.click(await screen.findByRole("button", { name: "Eggs" }));
    await waitFor(() => expect(authFetch).toHaveBeenCalledWith("/day/2026-11-05/meal", expect.objectContaining({ method: "POST" })));
    session.subject = "user-2";
    rerender(<Home />);
    expect(await screen.findByRole("button", { name: "Remove Rice" })).toBeTruthy();
    finishSave({ ok: true, json: async () => ({ id: "meal-1", name: "Eggs", period: "mid" }) });
    await waitFor(() => expect(screen.getByRole("button", { name: "Eggs" }).matches(":disabled")).toBe(false));
    expect(screen.queryByRole("button", { name: "Remove Eggs" })).toBeNull();
  });
});