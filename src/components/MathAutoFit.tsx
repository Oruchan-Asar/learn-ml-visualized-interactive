"use client";

import { useEffect } from "react";

const MIN_SCALE = 0.6;

/**
 * KaTeX display formulas don't wrap — a wide one (two expressions joined by an arrow, a long
 * underbrace chain) will overflow its card's edge. Scrolling it sideways works but reads badly,
 * so instead this shrinks the formula's own font size until it fits, per-formula, leaving short
 * formulas untouched. Runs on mount, on resize, and on any DOM mutation (MDX content mounted by
 * client-side navigation) since this is a plain client-side scan, not tied to one render.
 */
export function MathAutoFit() {
  useEffect(() => {
    function fit() {
      document.querySelectorAll<HTMLElement>(".katex-display").forEach((el) => {
        el.style.fontSize = "";
        el.style.overflowX = "";
        const available = el.clientWidth;
        const needed = el.scrollWidth;
        if (available <= 0 || needed <= available) return;
        const base = parseFloat(getComputedStyle(el).fontSize);
        const scale = Math.max(MIN_SCALE, (available / needed) * 0.97);
        el.style.fontSize = `${base * scale}px`;
        // Shrinking to the minimum legible size still isn't enough for a genuinely long formula —
        // fall back to a horizontal scrollbar rather than letting it overflow the card's edge. Set
        // as an inline style, not in CSS, so the common case (fits after shrinking) keeps the plain
        // "overflow: visible" that lets arrow labels and sub/superscripts draw outside the line box.
        if (el.scrollWidth > el.clientWidth) el.style.overflowX = "auto";
      });
    }

    fit();
    window.addEventListener("resize", fit);
    const observer = new MutationObserver(fit);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("resize", fit);
      observer.disconnect();
    };
  }, []);

  return null;
}
