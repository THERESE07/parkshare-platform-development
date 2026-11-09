import { useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";
const KEY = "ps_theme";
const EVENT = "parkshare:theme";

function read(): ThemeChoice {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function prefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function applyTheme(choice: ThemeChoice = read()) {
  const dark = choice === "dark" || (choice === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0f1719" : "#176b67");
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(read);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const sync = () => {
      setChoice(read());
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (read() === "system") {
        applyTheme("system");
        sync();
      }
    };
    window.addEventListener(EVENT, sync);
    media?.addEventListener("change", onSystem);
    return () => {
      window.removeEventListener(EVENT, sync);
      media?.removeEventListener("change", onSystem);
    };
  }, []);

  function set(next: ThemeChoice) {
    try {
      if (next === "system") window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
    window.dispatchEvent(new Event(EVENT));
  }

  return { choice, isDark, set };
}
