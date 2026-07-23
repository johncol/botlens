import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutputPanel } from "./OutputPanel";

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock("remark-gfm", () => ({ default: () => {} }));

const icon = <span data-testid="icon">⚙</span>;

describe("OutputPanel", () => {
  it("renders the title and icon in the header", () => {
    render(<OutputPanel title="Right" icon={icon} markdown="content" viewMode="rendered" />);
    expect(screen.getByText("Right")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders the warning banner when a warning is provided", () => {
    render(
      <OutputPanel title="Right" icon={icon} markdown="content" viewMode="rendered" warning="Watch out!" />,
    );
    expect(screen.getByText("Watch out!")).toBeInTheDocument();
  });

  it("hides the warning after the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <OutputPanel title="Right" icon={icon} markdown="content" viewMode="rendered" warning="Watch out!" />,
    );
    await user.click(screen.getByRole("button", { name: /dismiss warning/i }));
    expect(screen.queryByText("Watch out!")).not.toBeInTheDocument();
  });

  it("renders the error banner when an error is provided", () => {
    render(
      <OutputPanel title="Right" icon={icon} markdown={null} viewMode="rendered" error="Something broke" />,
    );
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });

  it("hides the error after the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <OutputPanel title="Right" icon={icon} markdown={null} viewMode="rendered" error="Something broke" />,
    );
    await user.click(screen.getByRole("button", { name: /dismiss error/i }));
    expect(screen.queryByText("Something broke")).not.toBeInTheDocument();
  });

  it("shows added/removed line counts in diff mode when content differs", () => {
    render(
      <OutputPanel
        title="Right"
        icon={icon}
        markdown={"line1\nline2\nnew line"}
        viewMode="diff"
        diffBase={"line1\nline2\nold line"}
      />,
    );
    expect(screen.getByText(/\+\d+/)).toBeInTheDocument();
    expect(screen.getByText(/−\d+/)).toBeInTheDocument();
  });

  it("shows 'identical' when diffBase and markdown are the same", () => {
    render(
      <OutputPanel
        title="Right"
        icon={icon}
        markdown="same content"
        viewMode="diff"
        diffBase="same content"
      />,
    );
    expect(screen.getByText("identical")).toBeInTheDocument();
  });

  it("renders in raw mode without the ReactMarkdown component", () => {
    render(<OutputPanel title="Right" icon={icon} markdown="# raw" viewMode="raw" />);
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(screen.getByText("# raw")).toBeInTheDocument();
  });
});
