import { useEffect, useState } from "react";

/** Light is the standard theme; dark is opt-in and remembered per browser. */
export type Theme = "light" | "dark";
const KEY = "ps_theme";
const EVENT = "parkshare:theme";

function read(): Theme {
  try {
    return window.localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme = read()) {
  const dark = theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0f1719" : "#176b67");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => {
    const sync = () => setTheme(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  function set(next: Theme) {
    try {
      if (next === "dark") window.localStorage.setItem(KEY, "dark");
      else window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    applyTheme(next);
    window.dispatchEvent(new Event(EVENT));
  }

  return { theme, isDark: theme === "dark", set, toggle: () => set(theme === "dark" ? "light" : "dark") };
}
