"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import type { Dictionary } from "@/content/dictionaries/types";
import type { Locale } from "@/lib/i18n";
import {
  type Project,
  type ProjectLinkType,
  type ProjectStatus,
} from "@/content/projects";
import { Reveal } from "./Reveal";

function statusLabel(status: ProjectStatus, dict: Dictionary): string {
  return dict.projects.status[status];
}

export function Projects({
  locale,
  dict,
  projects,
}: {
  locale: Locale;
  dict: Dictionary;
  projects: Project[];
}) {
  const [active, setActive] = useState<Project | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const years = Array.from(new Set(projects.map((p) => p.year))).sort(
    (a, b) => Number(b) - Number(a),
  );
  const [filter, setFilter] = useState<string>("all");

  const visible =
    filter === "all" ? projects : projects.filter((p) => p.year === filter);

  function openProject(project: Project, opener: HTMLElement) {
    openerRef.current = opener;
    setActive(project);
  }

  function closeProject() {
    setActive(null);
    queueMicrotask(() => {
      openerRef.current?.focus();
      openerRef.current = null;
    });
  }

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="section-pad border-t border-[var(--color-rule)]"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
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
            className="flex flex-wrap gap-x-4 gap-y-2 border-b border-[var(--color-rule)] pb-2"
            role="group"
            aria-label={dict.projects.filterByYear}
          >
            <FilterLink
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label={dict.projects.filterAll}
            />
            {years.map((year) => (
              <FilterLink
                key={year}
                active={filter === year}
                onClick={() => setFilter(year)}
                label={year}
              />
            ))}
          </div>
        </Reveal>

        <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {visible.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={(e) => openProject(project, e.currentTarget)}
                className="group grid w-full grid-cols-[4.5rem_1fr_auto] items-baseline gap-4 py-5 text-left transition-colors hover:bg-[var(--color-paper-2)] sm:grid-cols-[5.5rem_1fr_auto_auto] sm:gap-6 sm:py-6"
              >
                <span className="font-[family-name:var(--font-mono)] text-[0.75rem] tracking-[0.06em] text-[var(--color-neutral)]">
                  {project.year}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold tracking-tight text-[var(--color-ink)] sm:text-xl">
                    {project.title}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--color-ink-soft)] sm:hidden">
                    {project.summary[locale]}
                  </span>
                  <span className="mt-2 hidden font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.04em] text-[var(--color-neutral)] sm:block">
                    {project.skills.slice(0, 4).join(" · ")}
                  </span>
                </span>
                <span className="hidden font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase sm:inline">
                  {statusLabel(project.status, dict)}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-ink)] uppercase transition-transform group-hover:translate-x-0.5">
                  {dict.projects.open} →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {active ? (
        <ProjectModal
          project={active}
          locale={locale}
          dict={dict}
          onClose={closeProject}
        />
      ) : null}
    </section>
  );
}

function FilterLink({
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
      className={`font-[family-name:var(--font-mono)] text-[0.72rem] tracking-[0.08em] uppercase transition-colors ${
        active
          ? "text-[var(--color-ink)]"
          : "text-[var(--color-neutral)] hover:text-[var(--color-ink)]"
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
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[color-mix(in_oklch,var(--color-ink)_40%,transparent)] p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92svh] w-full max-w-2xl overflow-y-auto border border-[var(--color-rule)] bg-[var(--color-paper)] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {project.image ? (
          <div className="relative aspect-[16/9] w-full border-b border-[var(--color-rule)] bg-[var(--color-paper-3)]">
            <Image
              src={project.image}
              alt={`${project.title} — preview`}
              fill
              sizes="672px"
              className="object-cover grayscale"
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
              ref={closeRef}
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

          <p className="mt-6 font-[family-name:var(--font-mono)] text-[0.75rem] leading-6 tracking-[0.02em] text-[var(--color-neutral)]">
            {project.skills.join(" · ")}
          </p>

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
                    <span className="sr-only"> ({dict.projects.newTab})</span>
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
