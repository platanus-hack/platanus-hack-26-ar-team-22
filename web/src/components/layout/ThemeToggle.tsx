"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui";

const storageKey = "guardrail_theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    window.localStorage.setItem(storageKey, next ? "dark" : "light");
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{dark ? "Oscuro" : "Claro"}</span>
      <Toggle pressed={dark} onClick={toggleTheme} aria-label="Cambiar tema" />
    </div>
  );
}
