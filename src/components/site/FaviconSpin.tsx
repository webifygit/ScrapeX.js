"use client";

import { useEffect } from "react";

// Same mark and colours as public/icon.svg and the header logo: ink circle, lime X.
const frame = (deg: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#0b0b0b"/><path d="M10.5 10.5 21.5 21.5M21.5 10.5 10.5 21.5" stroke="#bdff44" stroke-width="3" stroke-linecap="round" transform="rotate(${deg} 16 16)"/></svg>`;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Spins the favicon's X like the header logo: a quarter turn over 1s, then a 1s pause.
 * An X looks the same every 90 degrees, so the loop is seamless. Chrome and Safari never
 * animate favicons themselves, so this swaps the SVG icon's href frame by frame.
 * Skipped for reduced-motion users and paused while the tab is hidden.
 */
export function FaviconSpin() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const icon = () => document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    const original = icon()?.getAttribute("href") ?? null;
    let last = -1;
    const tick = () => {
      if (document.hidden) return;
      const link = icon();
      if (!link) return;
      const t = (performance.now() % 2000) / 1000;
      const deg = t < 1 ? (Math.round((easeInOut(t) * 90) / 6) * 6) % 90 : 0;
      if (deg === last && link.getAttribute("href")?.startsWith("data:")) return;
      last = deg;
      link.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(frame(deg))}`);
    };
    tick();
    const id = window.setInterval(tick, 50);
    return () => {
      window.clearInterval(id);
      const link = icon();
      if (link && original) link.setAttribute("href", original);
    };
  }, []);
  return null;
}
