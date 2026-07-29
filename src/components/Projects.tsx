"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import type { Dictionary } from "@/content/dictionaries/types";
import type { Locale } from "@/lib/i18n";
import {
  projects,
  type Project,
  type ProjectLinkType,
  type ProjectStatus,
} from "@/content/projects";
import { Reveal } from "./Reveal";

function statusTone(status: ProjectStatus): string {
  if (status === "finished") return "text-[var(--color-success)]";
  if (status === "paused") return "text-[var(--color-neutral)]";
  return "text-[var(--color-accent)]";
}

export function Projects({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [active, setActive] = useState<Project | null>(null);
  const years = Array.from(new Set(projects.map((p) => p.year))).sort(
    (a, b) => Number(b) - Number(a),
  );
  const [filter, setFilter] = useState<string>("all");

  const visible =
    filter === "all" ? projects : projects.filter((p) => p.year === filter);

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="section-pad border-t border-[var(--color-rule)]"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-4">{dict.projects.eyebrow}</p>
            <h2
              id="projects-title"
              className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl"
            >
              {dict.projects.title}
            </h2>
            <p className="mt-3 max-w-md text-[var(--color-ink-soft)]">
              {dict.projects.tagline}
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={dict.projects.filterAll}
          >
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label={dict.projects.filterAll}
            />
            {years.map((year) => (
              <FilterChip
                key={year}
                active={filter === year}
                onClick={() => setFilter(year)}
                label={year}
              />
            ))}
          </div>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((project) => (
            <Reveal as="li" key={project.id} className="min-w-0">
              <button
                type="button"
                onClick={() => setActive(project)}
                className="group flex h-full w-full min-w-0 flex-col border border-[var(--color-rule)] bg-[var(--color-paper)] p-0 text-left transition-[border-color,background] hover:border-[var(--color-accent)] hover:bg-[var(--color-paper-2)] focus-visible:border-[var(--color-accent)]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[var(--color-rule)] bg-[var(--color-paper-3)]">
                  {project.image ? (
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-end p-5">
                      <span className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase">
                        {project.year} · {project.skills[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                      {project.title}
                    </h3>
                    <span
                      className={`shrink-0 font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.08em] uppercase ${statusTone(project.status)}`}
                    >
                      {dict.projects.status[project.status]}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {project.summary[locale]}
                  </p>
                  <span className="mt-auto pt-2 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-accent)] uppercase">
                    {dict.projects.open} →
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      {active ? (
        <ProjectModal
          project={active}
          locale={locale}
          dict={dict}
          onClose={() => setActive(null)}
        />
      ) : null}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[var(--radius-sm)] border px-3 py-1.5 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] uppercase transition-colors ${
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[oklch(98%_0.004_250)]"
          : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]"
      }`}
    >
      {label}
    </button>
  );
}

function ProjectModal({
  project,
  locale,
  dict,
  onClose,
}: {
  project: Project;
  locale: Locale;
  dict: Dictionary;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const linkLabel = (type: ProjectLinkType) => dict.projects.links[type];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[color-mix(in_oklch,var(--color-ink)_45%,transparent)] p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[92svh] w-full max-w-2xl overflow-y-auto border border-[var(--color-rule)] bg-[var(--color-paper)] shadow-[0_1px_2px_color-mix(in_oklch,var(--color-ink)_12%,transparent)] outline-none sm:rounded-[var(--radius-md)]"
        onClick={(e) => e.stopPropagation()}
      >
        {project.image ? (
          <div className="relative aspect-[16/9] w-full border-b border-[var(--color-rule)] bg-[var(--color-paper-3)]">
            <Image
              src={project.image}
              alt=""
              fill
              sizes="672px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">
                {project.year} · {dict.projects.status[project.status]}
              </p>
              <h3
                id={titleId}
                className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]"
              >
                {project.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost shrink-0 !min-h-10 !px-3"
            >
              {dict.projects.close}
            </button>
          </div>

          <div className="mt-6 space-y-4 whitespace-pre-line text-[0.98rem] leading-relaxed text-[var(--color-ink-soft)]">
            {project.pitch[locale]}
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[0.7rem] text-[var(--color-ink-soft)]"
              >
                {skill}
              </li>
            ))}
          </ul>

          {project.links.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-3 border-t border-[var(--color-rule)] pt-6">
              {project.links.map((link) => (
                <li key={link.type}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost !min-h-10"
                  >
                    {linkLabel(link.type)} ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
