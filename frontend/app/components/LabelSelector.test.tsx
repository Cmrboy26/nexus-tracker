import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LabelSelector } from "./LabelSelector";

afterEach(cleanup);

function Selector({ mode = "chips", options = [{ label: "Calm" }, { label: "Hopeful" }] }: {
  mode?: "chips" | "toggle" | "single",
  options?: { label: string, rank?: number }[],
}) {
  const [value, setValue] = useState<string[]>([]);

  return (
    <LabelSelector
      mode={mode}
      value={value}
      onChange={setValue}
      options={options}
      inputLabel="Mood"
      addLabel="Add"
    />
  );
}

describe("LabelSelector", () => {
  it("adds and removes a suggested label", async () => {
    const user = userEvent.setup();
    render(<Selector />);

    await user.click(screen.getByRole("button", { name: "Calm" }));
    expect(screen.getByRole("button", { name: "Remove Calm" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Calm" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Remove Calm" }));
    expect(screen.getByRole("button", { name: "Calm" })).toBeTruthy();
  });

  it("normalizes input and avoids duplicate labels", async () => {
    const user = userEvent.setup();
    render(<Selector />);

    await user.type(screen.getByRole("textbox", { name: "Mood" }), "  calm  ");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByRole("textbox", { name: "Mood" }), "CALM");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getAllByRole("button", { name: "Remove Calm" })).toHaveLength(1);
  });

  it("orders toggle options by rank, filters them, and preserves selections", async () => {
    const user = userEvent.setup();
    render(<Selector mode="toggle" options={[
      { label: "Joyful", rank: 1 }, { label: "Calm", rank: 2 }, { label: "Joy", rank: 3 },
    ]} />);

    expect(screen.getAllByRole("checkbox")).toEqual([
      screen.getByRole("checkbox", { name: "Joy" }),
      screen.getByRole("checkbox", { name: "Calm" }),
      screen.getByRole("checkbox", { name: "Joyful" }),
    ]);
    await user.click(screen.getByRole("checkbox", { name: "Calm" }));
    const input = screen.getByRole("textbox", { name: "Mood" });
    await user.type(input, "jOy");
    expect(screen.getAllByRole("checkbox")).toEqual([
      screen.getByRole("checkbox", { name: "Joy" }),
      screen.getByRole("checkbox", { name: "Joyful" }),
    ]);
    await user.clear(input);
    expect((screen.getByRole("checkbox", { name: "Calm" }) as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole("checkbox", { name: "Calm" }));
    expect((screen.getByRole("checkbox", { name: "Calm" }) as HTMLInputElement).checked).toBe(false);
  });

  it("allows one selection and accepts a custom option", async () => {
    const user = userEvent.setup();
    render(<Selector mode="single" />);

    await user.click(screen.getByRole("radio", { name: "Calm" }));
    await user.click(screen.getByRole("radio", { name: "Hopeful" }));
    expect((screen.getByRole("radio", { name: "Calm" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("radio", { name: "Hopeful" }) as HTMLInputElement).checked).toBe(true);
    await user.type(screen.getByRole("textbox", { name: "Mood" }), "  Curious  ");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect((screen.getByRole("radio", { name: "Curious" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("radio", { name: "Hopeful" }) as HTMLInputElement).checked).toBe(false);
  });
});