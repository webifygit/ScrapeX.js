"use client";

import { SimpleForm } from "./SimpleForm";
import { removeSchema } from "./forms";

export function RemoveForm() {
  return (
    <SimpleForm
      schema={removeSchema}
      submitLabel="Request removal"
      success="Your request is in. We'll confirm by email once your details are removed."
      fields={[
        { name: "name", label: "Name" },
        { name: "email", label: "Email", type: "email" },
        { name: "website", label: "Website where you're listed", placeholder: "e.g. example.com/team" },
      ]}
    />
  );
}
