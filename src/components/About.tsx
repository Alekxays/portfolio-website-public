import type { Dictionary } from "@/content/dictionaries/types";
import { skills } from "@/content/site";
import { Reveal } from "./Reveal";

export function About({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="section-pad border-t border-[var(--color-rule)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow mb-4">{dict.about.eyebrow}</p>
          <h2
            id="about-title"
            className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl"
          >
            {dict.about.title}
          </h2>
        </Reveal>

        <div className="space-y-6 text-[1.05rem] leading-relaxed text-[var(--color-ink-soft)]">
          <Reveal as="p">{dict.about.p1}</Reveal>
          <Reveal as="p">{dict.about.p2}</Reveal>
          <Reveal as="p">{dict.about.p3}</Reveal>
          <Reveal as="p" className="font-medium text-[var(--color-ink)]">
            {dict.about.conclusion}
          </Reveal>

          <Reveal className="pt-4">
            <p className="eyebrow mb-4">{dict.about.skillsLabel}</p>
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[0.75rem] tracking-[0.02em] text-[var(--color-ink-soft)]"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
