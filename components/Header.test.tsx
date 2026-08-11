import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { usePathname } from "next/navigation";

const NAV_LABELS = ["Human vs Bot", "Env vs Env", "Page Comparison", "Library Comparison"];

describe("Header", () => {
  it("renders the BotLens logo linking to /", () => {
    render(<Header />);
    const logo = screen.getByRole("link", { name: /botlens/i });
    expect(logo).toHaveAttribute("href", "/");
  });

  it("renders all navigation items", () => {
    render(<Header />);
    for (const label of NAV_LABELS) {
      expect(screen.getByRole("link", { name: new RegExp(label, "i") })).toBeInTheDocument();
    }
  });

  it("applies active styling to the link matching the current pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/env-vs-env");
    render(<Header />);

    const activeLink = screen.getByRole("link", { name: /env vs env/i });
    expect(activeLink.className).toMatch(/text-brand/);
  });

  it("does not apply active styling to non-current links", () => {
    vi.mocked(usePathname).mockReturnValue("/env-vs-env");
    render(<Header />);

    const inactiveLink = screen.getByRole("link", { name: /human vs bot/i });
    expect(inactiveLink.className).not.toMatch(/text-brand[^/]/);
  });
});
