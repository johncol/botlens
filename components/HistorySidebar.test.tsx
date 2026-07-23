import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistorySidebar } from "./HistorySidebar";
import type { SidebarEntry } from "@/types";

beforeEach(() => {
  localStorage.clear();
});

const ENTRIES: SidebarEntry[] = [
  { id: "1", label: "/en/clothing (Prod vs Dev)", badge: "GPTBot", createdAt: 1700000000000 },
  { id: "2", label: "/en/shoes (Prod vs Staging)", badge: "ClaudeBot", createdAt: 1700001000000 },
];

describe("HistorySidebar", () => {
  it("renders the History heading", () => {
    render(<HistorySidebar entries={[]} activeId={null} onSelect={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /history/i })).toBeInTheDocument();
  });

  it("renders the empty message when there are no entries", () => {
    render(
      <HistorySidebar
        entries={[]}
        activeId={null}
        emptyMessage="No history yet."
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("No history yet.")).toBeInTheDocument();
  });

  it("renders a button for each entry with its label and badge", () => {
    render(<HistorySidebar entries={ENTRIES} activeId={null} onSelect={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("/en/clothing (Prod vs Dev)")).toBeInTheDocument();
    expect(screen.getByText("GPTBot")).toBeInTheDocument();
    expect(screen.getByText("/en/shoes (Prod vs Staging)")).toBeInTheDocument();
    expect(screen.getByText("ClaudeBot")).toBeInTheDocument();
  });

  it("calls onSelect with the entry when an entry button is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<HistorySidebar entries={ENTRIES} activeId={null} onSelect={onSelect} onRemove={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: /en\/clothing/i })[0]);

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(ENTRIES[0]);
  });

  it("calls onRemove with the entry id when the remove button is clicked", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<HistorySidebar entries={ENTRIES} activeId={null} onSelect={vi.fn()} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith(ENTRIES[0].id);
  });

  it("hides entry content after the collapse button is clicked", async () => {
    const user = userEvent.setup();
    render(<HistorySidebar entries={ENTRIES} activeId={null} onSelect={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));

    expect(screen.queryByRole("heading", { name: /history/i })).not.toBeInTheDocument();
  });

  it("restores sidebar content after expand button is clicked", async () => {
    const user = userEvent.setup();
    render(<HistorySidebar entries={ENTRIES} activeId={null} onSelect={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    await user.click(screen.getByRole("button", { name: /expand sidebar/i }));

    expect(screen.getByRole("heading", { name: /history/i })).toBeInTheDocument();
  });
});
