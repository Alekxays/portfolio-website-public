"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/content/dictionaries/types";
import type { Locale } from "@/lib/i18n";
import { alternateLocale, localizedHref } from "@/lib/i18n";
import { site } from "@/content/site";
import { ThemeToggle } from "./ThemeToggle";

export function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const eggClicks = useRef(0);
  const eggTimer = useRef<number | null>(null);
  const other = alternateLocale(locale);
  const otherHref = locale === "fr" ? "/en" : "/";
  const otherLabel = other.toUpperCase();

  function onBrandClick(e: MouseEvent<HTMLAnchorElement>) {
    eggClicks.current += 1;
    if (eggTimer.current) window.clearTimeout(eggTimer.current);
    eggTimer.current = window.setTimeout(() => {
      eggClicks.current = 0;
    }, 2800);

    if (eggClicks.current >= 7) {
      e.preventDefault();
      eggClicks.current = 0;
      router.push("/studio");
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navItems = [
    { id: "about" as const, label: dict.nav.about },
    { id: "projects" as const, label: dict.nav.projects },
    { id: "contact" as const, label: dict.nav.contact },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background,backdrop-filter,border-color] ${
        scrolled || open
          ? "border-[var(--color-rule)] bg-[color-mix(in_oklch,var(--color-paper)_90%,transparent)] backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
      style={{ height: "var(--nav-h)" }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a
          href={localizedHref(locale)}
          onClick={onBrandClick}
          className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold tracking-tight text-[var(--color-ink)]"
        >
          {site.name}
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={localizedHref(locale, item.id)}
              className="link-accent text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              {item.label}
            </a>
          ))}
          <ThemeToggle labels={dict.theme} />
          <Link
            href={otherHref}
            className="rounded-[var(--radius-sm)] border border-[var(--color-rule-strong)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.08em] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            hrefLang={other}
            lang={other}
          >
            {otherLabel}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle labels={dict.theme} />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-rule)]"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">
              {open ? dict.nav.closeMenu : dict.nav.openMenu}
            </span>
            <span aria-hidden className="flex w-4 flex-col gap-1">
              <span
                className={`h-px w-full bg-[var(--color-ink)] transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-full bg-[var(--color-ink)] transition-opacity ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`h-px w-full bg-[var(--color-ink)] transition-transform ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-b border-[var(--color-rule)] bg-[var(--color-paper)] md:hidden"
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4"
            aria-label="Mobile"
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={localizedHref(locale, item.id)}
                className="rounded-[var(--radius-sm)] px-3 py-3 text-base text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href={otherHref}
              className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-3 font-[family-name:var(--font-mono)] text-sm tracking-[0.06em]"
              hrefLang={other}
              onClick={() => setOpen(false)}
            >
              {otherLabel} →
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
