"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle({
  labels,
}: {
  labels: { light: string; dark: string };
}) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-[var(--radius-sm)] border border-[var(--color-rule-strong)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.08em] text-[var(--color-ink-soft)] uppercase transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      aria-label={next === "dark" ? labels.dark : labels.light}
      title={next === "dark" ? labels.dark : labels.light}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
