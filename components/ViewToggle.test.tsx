import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewToggle, type ViewMode } from "./ViewToggle";

describe("ViewToggle", () => {
  it("renders the default rendered and raw buttons", () => {
    render(<ViewToggle value="rendered" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Rendered" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Raw" })).toBeInTheDocument();
  });

  it("renders only the modes provided via the modes prop", () => {
    render(<ViewToggle value="rendered" onChange={vi.fn()} modes={["rendered", "raw", "diff"]} />);
    expect(screen.getByRole("button", { name: "Raw Diff" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("applies active styling to the selected mode button", () => {
    render(<ViewToggle value="raw" onChange={vi.fn()} />);
    const rawButton = screen.getByRole("button", { name: "Raw" });
    expect(rawButton.className).toMatch(/bg-background/);
    const renderedButton = screen.getByRole("button", { name: "Rendered" });
    expect(renderedButton.className).not.toMatch(/bg-background/);
  });

  it("calls onChange with the clicked mode", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ViewToggle value="rendered" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Raw" }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith<[ViewMode]>("raw");
  });

  it("calls onChange with the correct mode for each button", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ViewToggle value="raw" onChange={onChange} modes={["rendered", "raw", "diff"]} />);

    await user.click(screen.getByRole("button", { name: "Raw Diff" }));
    expect(onChange).toHaveBeenCalledWith<[ViewMode]>("diff");
  });
});
