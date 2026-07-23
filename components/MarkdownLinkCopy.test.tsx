import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { CopyLinkToast, makeLinkComponents, useCopyLinkToast } from "./MarkdownLinkCopy";

const MAX_URL_LENGTH = 50;

describe("CopyLinkToast", () => {
  it("renders nothing when url is null", () => {
    const { container } = render(<CopyLinkToast url={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the URL when url is short enough", () => {
    render(<CopyLinkToast url="https://example.com" />);
    expect(screen.getByText(/https:\/\/example\.com/)).toBeInTheDocument();
  });

  it("truncates URLs longer than the max length", () => {
    const longUrl = "https://example.com/" + "a".repeat(MAX_URL_LENGTH);
    render(<CopyLinkToast url={longUrl} />);
    expect(screen.getByText(/…$/)).toBeInTheDocument();
    expect(screen.queryByText(longUrl)).not.toBeInTheDocument();
  });
});

describe("makeLinkComponents", () => {
  it("returns an anchor that calls the click handler and prevents default navigation", async () => {
    const onLinkClick = vi.fn();
    const user = userEvent.setup();
    const components = makeLinkComponents(onLinkClick);
    const AnchorComponent = components.a;

    render(<AnchorComponent href="https://example.com/page">click me</AnchorComponent>);

    await user.click(screen.getByRole("link", { name: "click me" }));

    expect(onLinkClick).toHaveBeenCalledOnce();
    expect(onLinkClick).toHaveBeenCalledWith("https://example.com/page");
  });
});

describe("useCopyLinkToast", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with copiedUrl as null", () => {
    const { result } = renderHook(() => useCopyLinkToast());
    expect(result.current.copiedUrl).toBeNull();
  });

  it("sets copiedUrl after triggerCopy is called", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCopyLinkToast());

    act(() => {
      result.current.triggerCopy("https://example.com");
    });

    expect(result.current.copiedUrl).toMatch(/^https:\/\/example\.com/);
  });

  it("resolves relative URLs to absolute before setting copiedUrl", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCopyLinkToast());

    act(() => {
      result.current.triggerCopy("/relative/path");
    });

    expect(result.current.copiedUrl).toMatch(/^http/);
  });

  it("clears copiedUrl after the toast duration", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCopyLinkToast());

    act(() => {
      result.current.triggerCopy("https://example.com");
    });
    expect(result.current.copiedUrl).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(result.current.copiedUrl).toBeNull();
  });
});
