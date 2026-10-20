import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/components/site/Home";
import { QuoteForm } from "@/components/site/QuoteForm";
import { RemoveForm } from "@/components/site/RemoveForm";

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
