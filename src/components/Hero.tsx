"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/content/dictionaries/types";
import type { Locale } from "@/lib/i18n";
import { localizedHref } from "@/lib/i18n";
import { site } from "@/content/site";
import { Intro } from "./Intro";

const HeroScene = dynamic(
  () => import("./three/HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("portfolio-intro-seen") === "1";
    const delay = reduced || seen ? 40 : 1180;
    const id = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section
      id="home"
      aria-labelledby="hero-brand"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-16 pt-[calc(var(--nav-h)+2rem)] sm:justify-center sm:pb-24 sm:pt-[var(--nav-h)]"
    >
      <Intro />
      <HeroScene />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--color-paper)] to-transparent"
      />

      <div
        className={`hero-copy relative mx-auto w-full max-w-6xl px-5 sm:px-8${ready ? " is-ready" : ""}`}
      >
        <div className="max-w-3xl">
          <p className="eyebrow mb-6">{dict.hero.eyebrow}</p>
          <h1
            id="hero-brand"
            className="max-w-[12ch] text-[clamp(3rem,10vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--color-ink)]"
            style={{ overflowWrap: "anywhere" }}
          >
            {dict.hero.brand}
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
            {dict.hero.lede}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={localizedHref(locale, "projects")} className="btn btn-primary">
              {dict.hero.ctaPrimary}
            </a>
            <a
              href={`${site.cv[locale]}?download=1`}
              className="btn btn-ghost"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              {dict.hero.ctaSecondary}
              <span className="sr-only"> ({dict.projects.newTab})</span>
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-[family-name:var(--font-mono)] text-[0.75rem] tracking-[0.06em] text-[var(--color-neutral)]">
            <li>
              <a
                href={site.socials.github}
                className="link-accent hover:text-[var(--color-ink)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <span className="sr-only"> ({dict.projects.newTab})</span>
              </a>
            </li>
            <li>
              <a
                href={site.socials.linkedin}
                className="link-accent hover:text-[var(--color-ink)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
                <span className="sr-only"> ({dict.projects.newTab})</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="link-accent hover:text-[var(--color-ink)]"
              >
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
