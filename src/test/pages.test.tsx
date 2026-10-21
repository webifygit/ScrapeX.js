import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/components/site/Home";
import { QuoteForm } from "@/components/site/QuoteForm";
import { RemoveForm } from "@/components/site/RemoveForm";
import { SiteShell } from "@/components/site/Layout";
import { FaviconSpin } from "@/components/site/FaviconSpin";

describe("Home page", () => {
  it("renders the hero and the main sections", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Any website.");
    expect(screen.getByRole("heading", { name: "From website to spreadsheet in four steps" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read the case study/ })).toHaveAttribute("href", "/case-studies");
  });
});

describe("Quote form", () => {
  it("shows a validation message per empty field", () => {
    render(<QuoteForm />);
    fireEvent.click(screen.getByRole("button", { name: "Get a quote" }));
    expect(screen.getByText("Please enter your name")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid work email")).toBeInTheDocument();
    expect(screen.getByText("Choose how often")).toBeInTheDocument();
    expect(screen.getByText("Choose a delivery format")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("Removal form", () => {
  it("accepts a complete request and shows the confirmation", () => {
    render(<RemoveForm />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Reyes" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "j.reyes@example.edu" } });
    fireEvent.change(screen.getByLabelText("Website where you're listed"), { target: { value: "example.edu/team" } });
    fireEvent.click(screen.getByRole("button", { name: "Request removal" }));
    expect(screen.getByRole("status")).toHaveTextContent("Thank you.");
  });
});

describe("Site footer", () => {
  it("credits webify.ai with a followed link", () => {
    render(
      <SiteShell year={2026}>
        <p>page</p>
      </SiteShell>,
    );
    const link = screen.getByRole("link", { name: "webify.ai" });
    expect(link).toHaveAttribute("href", "https://www.webify.ai/");
    expect(link).not.toHaveAttribute("rel");
    expect(link.closest("p")).toHaveTextContent("Powered by webify.ai");
  });
});

describe("Favicon spin", () => {
  it("swaps the SVG icon for animation frames and restores it on unmount", () => {
    document.head.innerHTML = '<link rel="icon" type="image/svg+xml" href="/icon.svg?v=2">';
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    const link = document.head.querySelector("link") as HTMLLinkElement;
    const { unmount } = render(<FaviconSpin />);
    expect(link.getAttribute("href")).toMatch(/^data:image\/svg\+xml,/);
    unmount();
    expect(link.getAttribute("href")).toBe("/icon.svg?v=2");
  });
});
