import type { ReactNode } from "react";
import { SiteShell } from "@/components/site/Layout";
import { getCopyrightYear } from "@/components/site/year";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const year = await getCopyrightYear();
  return <SiteShell year={year}>{children}</SiteShell>;
}
