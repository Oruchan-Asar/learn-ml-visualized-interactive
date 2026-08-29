"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "gradient:theme";
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Theme, string> = { system: "Auto", light: "Light", dark: "Dark" };
const ICON: Record<Theme, string> = { system: "◐", light: "☀", dark: "☾" };

/** Cycles system → light → dark → system, overriding the OS-level prefers-color-scheme. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  const cycle = () => {
    const next = NEXT[theme];
    setTheme(next);
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
      document.documentElement.removeAttribute("data-theme");
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={cycle}
      aria-label={`Theme: ${LABEL[theme]}. Click to change.`}
    >
      <span aria-hidden="true" className={styles.icon}>
        {ICON[theme]}
      </span>
      {LABEL[theme]}
    </button>
  );
}
