import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncScrollToggle } from "./SyncScrollToggle";

describe("SyncScrollToggle", () => {
  it("reflects the off state via aria-pressed", () => {
    render(<SyncScrollToggle value={false} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /sync scroll/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reflects the on state via aria-pressed", () => {
    render(<SyncScrollToggle value={true} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /sync scroll/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onChange with the toggled value when clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SyncScrollToggle value={false} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /sync scroll/i }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
