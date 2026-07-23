import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InputBar } from "./InputBar";
import { SIZE_WARNING_BYTES } from "@/lib/constants";

describe("InputBar", () => {
  it("renders URL mode by default with a url input", () => {
    render(<InputBar onConvert={vi.fn()} isLoading={false} error={null} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "url");
    expect(screen.getByPlaceholderText("https://example.com")).toBeInTheDocument();
  });

  it("switches to HTML textarea when the HTML tab is clicked", async () => {
    const user = userEvent.setup();
    render(<InputBar onConvert={vi.fn()} isLoading={false} error={null} />);

    await user.click(screen.getByRole("button", { name: /html/i }));

    expect(screen.getByPlaceholderText("Paste HTML here…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("https://example.com")).not.toBeInTheDocument();
  });

  it("calls onConvert with url params when the URL form is submitted", async () => {
    const onConvert = vi.fn();
    const user = userEvent.setup();
    render(<InputBar onConvert={onConvert} isLoading={false} error={null} />);

    await user.type(screen.getByRole("textbox"), "https://example.com/page");
    await user.click(screen.getByRole("button", { name: /convert/i }));

    expect(onConvert).toHaveBeenCalledOnce();
    expect(onConvert).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://example.com/page", type: "url" }),
    );
  });

  it("calls onConvert with snippet params when HTML form is submitted", async () => {
    const onConvert = vi.fn();
    const user = userEvent.setup();
    render(<InputBar onConvert={onConvert} isLoading={false} error={null} />);

    await user.click(screen.getByRole("button", { name: /html/i }));
    await user.type(screen.getByPlaceholderText("Paste HTML here…"), "<p>hello</p>");
    await user.click(screen.getByRole("button", { name: /convert/i }));

    expect(onConvert).toHaveBeenCalledOnce();
    expect(onConvert).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>hello</p>", type: "snippet" }),
    );
  });

  it("shows Converting… and disables the button when isLoading is true", () => {
    render(<InputBar onConvert={vi.fn()} isLoading={true} error={null} />);
    const btn = screen.getByRole("button", { name: /converting/i });
    expect(btn).toBeDisabled();
  });

  it("displays the error message when error is provided", () => {
    render(<InputBar onConvert={vi.fn()} isLoading={false} error="Fetch failed" />);
    expect(screen.getByText("Fetch failed")).toBeInTheDocument();
  });

  it("shows the size warning when HTML input exceeds the threshold", async () => {
    const user = userEvent.setup();
    render(<InputBar onConvert={vi.fn()} isLoading={false} error={null} />);

    await user.click(screen.getByRole("button", { name: /html/i }));
    // Use fireEvent.change to avoid typing 500 KB character by character
    fireEvent.change(screen.getByPlaceholderText("Paste HTML here…"), {
      target: { value: "x".repeat(SIZE_WARNING_BYTES + 1) },
    });

    expect(screen.getByText(/large input/i)).toBeInTheDocument();
  });

  it("does not show the size warning below the threshold", () => {
    render(<InputBar onConvert={vi.fn()} isLoading={false} error={null} />);
    expect(screen.queryByText(/large input/i)).not.toBeInTheDocument();
  });
});
