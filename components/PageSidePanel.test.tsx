import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageSidePanel } from "./PageSidePanel";
import { SIZE_WARNING_BYTES } from "@/lib/constants";

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock("remark-gfm", () => ({ default: () => {} }));

function makeFetch(ok: boolean, body: object) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

const defaultProps = {
  placeholder: "Left side",
  label: "",
  onLabelChange: vi.fn(),
  markdown: null,
  onConvertSuccess: vi.fn(),
  viewMode: "rendered" as const,
};

describe("PageSidePanel", () => {
  it("renders the URL input mode by default", () => {
    render(<PageSidePanel {...defaultProps} />);
    expect(screen.getByPlaceholderText("https://example.com")).toBeInTheDocument();
  });

  it("switches to HTML textarea when the HTML tab is clicked", async () => {
    const user = userEvent.setup();
    render(<PageSidePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /html/i }));

    expect(screen.getByPlaceholderText("Paste HTML here…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("https://example.com")).not.toBeInTheDocument();
  });

  it("shows the placeholder label when label is empty", () => {
    render(<PageSidePanel {...defaultProps} label="" placeholder="Left side" />);
    expect(screen.getByText("Left side")).toBeInTheDocument();
  });

  it("opens the label editor when the label button is clicked", async () => {
    const user = userEvent.setup();
    render(<PageSidePanel {...defaultProps} label="My label" />);

    await user.click(screen.getByRole("button", { name: /my label/i }));

    expect(screen.getByDisplayValue("My label")).toBeInTheDocument();
  });

  it("calls onLabelChange when the label input is edited", async () => {
    const onLabelChange = vi.fn();
    const user = userEvent.setup();
    render(<PageSidePanel {...defaultProps} label="Old" onLabelChange={onLabelChange} />);

    await user.click(screen.getByRole("button", { name: /old/i }));
    // After clicking, the inline input appears with the current label value
    const labelInput = screen.getByDisplayValue("Old");
    await user.type(labelInput, "x");

    expect(onLabelChange).toHaveBeenCalled();
  });

  it("calls onConvertSuccess with markdown and label on successful fetch", async () => {
    const onConvertSuccess = vi.fn();
    const user = userEvent.setup();
    vi.stubGlobal("fetch", makeFetch(true, { nodeHtmlMarkdown: "# Hello" }));

    render(<PageSidePanel {...defaultProps} onConvertSuccess={onConvertSuccess} />);

    await user.type(screen.getByPlaceholderText("https://example.com"), "https://example.com");
    await user.click(screen.getByRole("button", { name: /convert/i }));

    await waitFor(() => {
      expect(onConvertSuccess).toHaveBeenCalledOnce();
      expect(onConvertSuccess).toHaveBeenCalledWith(
        "# Hello",
        expect.stringContaining("example.com"),
      );
    });
  });

  it("displays an error message when the fetch fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", makeFetch(false, { error: "Not allowed" }));

    render(<PageSidePanel {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("https://example.com"), "https://example.com");
    await user.click(screen.getByRole("button", { name: /convert/i }));

    await waitFor(() => {
      expect(screen.getByText("Not allowed")).toBeInTheDocument();
    });
  });

  it("shows the size warning when HTML input exceeds the threshold", async () => {
    const user = userEvent.setup();
    render(<PageSidePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /html/i }));
    fireEvent.change(screen.getByPlaceholderText("Paste HTML here…"), {
      target: { value: "x".repeat(SIZE_WARNING_BYTES + 1) },
    });

    expect(screen.getByText(/large input/i)).toBeInTheDocument();
  });

  it("renders the markdown panel when markdown is provided", () => {
    render(<PageSidePanel {...defaultProps} markdown="# Content" />);
    expect(screen.getByTestId("markdown")).toBeInTheDocument();
  });
});
