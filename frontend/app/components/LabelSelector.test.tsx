import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LabelSelector } from "./LabelSelector";

afterEach(cleanup);

function Selector() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <LabelSelector
      mode="chips"
      value={value}
      onChange={setValue}
      options={[{ label: "Calm" }, { label: "Hopeful" }]}
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
});