import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "t4p.theme";

export function applyStoredTheme() {
  try {
    const stored = window.localStorage.getItem(KEY);
    document.documentElement.classList.toggle("dark", stored === "dark");
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="grid size-12 shrink-0 place-items-center rounded-full text-primary transition-opacity hover:opacity-70"
    >
      {dark ? <Sun className="size-6" /> : <Moon className="size-6" />}
    </button>
  );
}
