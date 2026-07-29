import Image from "next/image";
import type { Dictionary } from "@/content/dictionaries/types";
import type { Locale } from "@/lib/i18n";
import { localizedHref } from "@/lib/i18n";
import { site } from "@/content/site";
import { Reveal } from "./Reveal";

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section
      id="home"
      aria-labelledby="hero-brand"
      className="relative flex min-h-[100svh] flex-col justify-end pb-16 pt-[calc(var(--nav-h)+2rem)] sm:justify-center sm:pb-24 sm:pt-[var(--nav-h)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, transparent 40%, var(--color-paper) 100%), radial-gradient(ellipse 80% 60% at 70% 40%, color-mix(in oklch, var(--color-accent) 14%, transparent), transparent 70%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
        <Reveal className="min-w-0">
          <p className="eyebrow mb-5">{dict.hero.eyebrow}</p>
          <h1
            id="hero-brand"
            className="max-w-[14ch] text-[clamp(2.75rem,8vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--color-ink)]"
            style={{ overflowWrap: "anywhere" }}
          >
            {dict.hero.brand}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
            {dict.hero.lede}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={localizedHref(locale, "projects")} className="btn btn-primary">
              {dict.hero.ctaPrimary}
            </a>
            <a
              href={site.cv[locale]}
              className="btn btn-ghost"
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              {dict.hero.ctaSecondary}
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-[family-name:var(--font-mono)] text-[0.75rem] tracking-[0.04em] text-[var(--color-neutral)]">
            <li>
              <a
                href={site.socials.github}
                className="link-accent hover:text-[var(--color-accent)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href={site.socials.linkedin}
                className="link-accent hover:text-[var(--color-accent)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={`mailto:${site.email}`}
                className="link-accent hover:text-[var(--color-accent)]"
              >
                {site.email}
              </a>
            </li>
          </ul>
        </Reveal>

        <Reveal className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
          <figure className="relative mx-auto aspect-[4/5] w-full max-w-[380px]">
            <Image
              src={site.portrait}
              alt={
                locale === "en"
                  ? "Portrait of Alexandre Boissel"
                  : "Portrait d'Alexandre Boissel"
              }
              fill
              priority
              sizes="(max-width: 1024px) 80vw, 380px"
              className="object-contain object-bottom"
            />
          </figure>
        </Reveal>
      </div>

      <a
        href={localizedHref(locale, "about")}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.12em] text-[var(--color-neutral)] sm:inline-flex"
      >
        {dict.hero.scroll}
        <span aria-hidden className="ml-2 animate-bounce">
          ↓
        </span>
      </a>
    </section>
  );
}
