import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveDemo } from "@/components/site/LiveDemo";

function fill({ url, email }: { url: string; email: string }) {
  fireEvent.change(screen.getByLabelText("Page to scrape"), { target: { value: url } });
  fireEvent.change(screen.getByLabelText("Company email"), { target: { value: email } });
  fireEvent.click(screen.getByRole("checkbox"));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Live demo", () => {
  it("starts on the target step", () => {
    render(<LiveDemo />);
    expect(screen.getByRole("button", { name: "Send verification code" })).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp number/)).toBeInTheDocument();
  });

  it("refuses a free mailbox without calling the server", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<LiveDemo />);

    fill({ url: "example-store.com", email: "someone@gmail.com" });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    expect(screen.getByText(/free mailboxes like Gmail or Outlook/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks for consent before sending a code", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<LiveDemo />);

    fireEvent.change(screen.getByLabelText("Page to scrape"), {
      target: { value: "example-store.com" },
    });
    fireEvent.change(screen.getByLabelText("Company email"), {
      target: { value: "buyer@northwind-logistics.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    expect(screen.getByText("Please confirm you may scrape this site")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("moves to the code step once the server accepts the address", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        maskedEmail: "b•••r@northwind-logistics.com",
        url: "https://example-store.com/",
        resendInMs: 60000,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<LiveDemo />);

    fill({ url: "example-store.com", email: "buyer@northwind-logistics.com" });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    await waitFor(() => expect(screen.getByText("Enter your code")).toBeInTheDocument());
    expect(screen.getByText("b•••r@northwind-logistics.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify and start scraping" })).toBeDisabled();

    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toMatchObject({
      url: "https://example-store.com",
      email: "buyer@northwind-logistics.com",
      consent: true,
    });
  });

  it("shows the server's message when a code can't be sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Email verification is not switched on yet." }),
      }),
    );
    render(<LiveDemo />);

    fill({ url: "example-store.com", email: "buyer@northwind-logistics.com" });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email verification is not switched on yet.",
      ),
    );
  });
});
