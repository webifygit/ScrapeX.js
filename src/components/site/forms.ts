import { z } from "zod";

export const frequencies = ["One-off", "Daily", "Weekly", "Monthly"] as const;
export const formats = ["Excel", "CSV", "Google Sheets", "Data feed", "CRM import"] as const;

export const quoteSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.email("Enter a valid work email").max(255),
  company: z.string().trim().min(1, "Please enter your company").max(120),
  data: z.string().trim().min(1, "Tell us what data you need").max(1000),
  websites: z.string().trim().min(1, "Tell us which websites").max(1000),
  frequency: z.enum(frequencies, { error: "Choose how often" }),
  format: z.enum(formats, { error: "Choose a delivery format" }),
  notes: z.string().trim().max(1000).optional(),
});

export const removeSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.email("Enter a valid email").max(255),
  website: z.string().trim().min(1, "Tell us the website where you're listed").max(255),
});
