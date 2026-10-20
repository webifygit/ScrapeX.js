"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import type { z } from "zod";
import { fieldClass } from "./Layout";

export type Field = { name: string; label: string; type?: string; textarea?: boolean; optional?: boolean; placeholder?: string; options?: readonly string[] };

export function SimpleForm({ fields, schema, submitLabel, success }: { fields: Field[]; schema: z.ZodType; submitLabel: string; success: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = schema.safeParse(data);
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setDone(true);
  };

  if (done)
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-8" role="status">
        <p className="text-2xl font-semibold">Thank you.</p>
        <p className="mt-2 text-muted-foreground">{success}</p>
      </motion.div>
    );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl border bg-card p-6 md:p-8">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="text-sm font-medium">{f.label}{f.optional && <span className="text-muted-foreground"> (optional)</span>}</label>
          {f.options ? (
            <select id={f.name} name={f.name} defaultValue="" className={fieldClass} aria-invalid={!!errors[f.name]}>
              <option value="" disabled>Choose one</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.textarea ? (
            <textarea id={f.name} name={f.name} rows={3} placeholder={f.placeholder} className={fieldClass} aria-invalid={!!errors[f.name]} />
          ) : (
            <input id={f.name} name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} className={fieldClass} aria-invalid={!!errors[f.name]} />
          )}
          {errors[f.name] && <p className="mt-1 text-sm text-destructive">{errors[f.name]}</p>}
        </div>
      ))}
      <button type="submit" className="w-full rounded-full border border-ink bg-lime px-5 py-3 text-sm font-semibold text-foreground-foreground hover:bg-burnt/90">{submitLabel}</button>
    </form>
  );
}
