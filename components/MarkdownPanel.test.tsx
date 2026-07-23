import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPanel } from "./MarkdownPanel";

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock("remark-gfm", () => ({ default: () => {} }));

describe("MarkdownPanel", () => {
  it("renders the title in the panel header", () => {
    render(<MarkdownPanel title="Left Panel" markdown="# Hello" viewMode="rendered" />);
    expect(screen.getByText("Left Panel")).toBeInTheDocument();
  });

  it("renders the ReactMarkdown component in rendered mode", () => {
    render(<MarkdownPanel title="Left" markdown="# Hello" viewMode="rendered" />);
    expect(screen.getByTestId("markdown")).toBeInTheDocument();
  });

  it("renders a pre element with raw markdown content in raw mode", () => {
    const { container } = render(<MarkdownPanel title="Left" markdown="# Hello" viewMode="raw" />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre).toHaveTextContent("# Hello");
  });

  it("does not render the ReactMarkdown component in raw mode", () => {
    render(<MarkdownPanel title="Left" markdown="# Hello" viewMode="raw" />);
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
  });
});
