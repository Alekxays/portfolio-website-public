import Image from "next/image";
import type { Dictionary } from "@/content/dictionaries/types";
import type { Locale } from "@/lib/i18n";
import { site, skills } from "@/content/site";
import { Reveal } from "./Reveal";

export function About({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="section-pad border-t border-[var(--color-rule)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow mb-4">{dict.about.eyebrow}</p>
          <h2
            id="about-title"
            className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl"
          >
            {dict.about.title}
          </h2>

          <figure className="relative mt-10 w-full max-w-[220px]">
            <div className="relative aspect-[4/5] overflow-hidden border border-[var(--color-rule)] bg-[oklch(97%_0_0)]">
              <Image
                src={site.portrait}
                alt={
                  locale === "en"
                    ? "Portrait of Alexandre Boissel"
                    : "Portrait d'Alexandre Boissel"
                }
                fill
                sizes="220px"
                className="portrait-mono object-contain object-bottom"
              />
            </div>
          </figure>
        </Reveal>

        <div className="space-y-6 text-[1.05rem] leading-relaxed text-[var(--color-ink-soft)]">
          <p>{dict.about.p1}</p>
          <p>{dict.about.p2}</p>
          <p>{dict.about.p3}</p>
          <p className="font-medium text-[var(--color-ink)]">
            {dict.about.conclusion}
          </p>

          <div className="border-t border-[var(--color-rule)] pt-6">
            <p className="eyebrow mb-3">{dict.about.skillsLabel}</p>
            <p className="font-[family-name:var(--font-mono)] text-[0.8rem] leading-7 tracking-[0.02em] text-[var(--color-ink-soft)]">
              {skills.join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
