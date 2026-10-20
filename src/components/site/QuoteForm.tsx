"use client";

import { SimpleForm } from "./SimpleForm";
import { formats, frequencies, quoteSchema } from "./forms";

export function QuoteForm() {
  return (
    <SimpleForm
      schema={quoteSchema}
      submitLabel="Get a quote"
      success="We'll reply within one business day with a plan and a quote."
      fields={[
        { name: "name", label: "Name" },
        { name: "email", label: "Work email", type: "email" },
        { name: "company", label: "Company" },
        { name: "data", label: "What data you need", textarea: true, placeholder: "e.g. product names, prices and stock status" },
        { name: "websites", label: "Which websites", textarea: true, placeholder: "e.g. example-store.com, example-shop.com" },
        { name: "frequency", label: "How often", options: frequencies },
        { name: "format", label: "Delivery format", options: formats },
        { name: "notes", label: "Notes", textarea: true, optional: true },
      ]}
    />
  );
}
