import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrawlerSelect } from "./CrawlerSelect";
import { AI_CRAWLERS } from "@/lib/crawlers";

describe("CrawlerSelect", () => {
  it("renders the AI Crawler label", () => {
    render(<CrawlerSelect value={AI_CRAWLERS[0].id} onChange={vi.fn()} />);
    expect(screen.getByText("AI Crawler")).toBeInTheDocument();
  });

  it("renders an option for every crawler", () => {
    render(<CrawlerSelect value={AI_CRAWLERS[0].id} onChange={vi.fn()} />);
    for (const crawler of AI_CRAWLERS) {
      expect(screen.getByRole("option", { name: crawler.label })).toBeInTheDocument();
    }
  });

  it("reflects the selected value", () => {
    const second = AI_CRAWLERS[1];
    render(<CrawlerSelect value={second.id} onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue(second.id);
  });

  it("calls onChange with the new crawler id when the selection changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CrawlerSelect value={AI_CRAWLERS[0].id} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), AI_CRAWLERS[2].id);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(AI_CRAWLERS[2].id);
  });
});
