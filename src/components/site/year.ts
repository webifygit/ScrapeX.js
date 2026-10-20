import { cacheLife } from "next/cache";

// Cache Components rejects `new Date()` inside a prerendered component. Caching the
// value with a daily lifetime keeps the footer static while still rolling over each year.
export async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
