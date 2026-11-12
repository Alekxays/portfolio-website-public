"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Project, ProjectLinkType, ProjectStatus } from "@/content/projects";

const emptyProject = (): Project => ({
  id: "",
  title: "",
  year: String(new Date().getFullYear()),
  status: "ongoing",
  skills: [],
  summary: { fr: "", en: "" },
  pitch: { fr: "", en: "" },
  links: [],
  image: "",
});

export function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState<Project>(emptyProject());
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [qualityImport, setQualityImport] = useState(false);
  const [manualImport, setManualImport] = useState(false);
  const [manualReadme, setManualReadme] = useState("");
  const [manualPackageJson, setManualPackageJson] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualHomepage, setManualHomepage] = useState("");
  const [manualLanguages, setManualLanguages] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const skillsText = useMemo(() => draft.skills.join(", "), [draft.skills]);
  const linksText = useMemo(
    () =>
      draft.links
        .map((l) => `${l.type}|${l.url}`)
        .join("\n"),
    [draft.links],
  );

  async function load() {
    setLoading(true);
    const res = await fetch("/api/studio/projects");
    if (!res.ok) {
      setMessage("Unable to load projects");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { projects: Project[] };
    setProjects(data.projects);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function startCreate() {
    setMode("create");
    setDraft(emptyProject());
    setMessage(null);
  }

  function startEdit(project: Project) {
    setMode("edit");
    setDraft({ ...project, image: project.image ?? "" });
    setMessage(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload: Project = {
      ...draft,
      id: draft.id.trim(),
      title: draft.title.trim(),
      image: draft.image?.trim() || undefined,
    };

    const res = await fetch("/api/studio/projects", {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(err?.error ?? "Save failed");
      return;
    }

    setMessage(mode === "create" ? "Project created" : "Project updated");
    await load();
    if (mode === "create") startCreate();
  }

  async function onDelete(id: string) {
    if (!confirm(`Delete project “${id}” ?`)) return;
    const res = await fetch(`/api/studio/projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setMessage("Delete failed");
      return;
    }
    setMessage("Project deleted");
    if (draft.id === id) startCreate();
    await load();
  }

  async function onImportGithub() {
    const url = githubUrl.trim();
    if (!url) {
      setMessage("Paste a GitHub URL or owner/repo");
      return;
    }
    if (
      manualImport &&
      !manualReadme.trim() &&
      !manualPackageJson.trim() &&
      !manualDescription.trim()
    ) {
      setMessage("Paste at least a README, package.json, or description");
      return;
    }

    setImporting(true);
    setMessage(null);

    const res = await fetch("/api/studio/projects/import-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        quality: qualityImport,
        manual: manualImport,
        ...(manualImport
          ? {
              readme: manualReadme,
              packageJson: manualPackageJson,
              description: manualDescription,
              homepage: manualHomepage,
              languages: manualLanguages,
            }
          : {}),
      }),
    });

    setImporting(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(err?.error ?? "GitHub import failed");
      return;
    }

    const data = (await res.json()) as {
      project: Project;
      model?: string;
      mode?: "manual" | "api";
      source?: { owner: string; repo: string };
    };

    setMode("create");
    setDraft({
      ...data.project,
      image: data.project.image ?? "",
    });
    const via = data.mode === "manual" ? " (manual paste)" : "";
    setMessage(
      data.source
        ? `Draft from ${data.source.owner}/${data.source.repo}${via}${
            data.model ? ` · ${data.model}` : ""
          } - review then Create`
        : "Draft ready - review then Create",
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Content</p>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
        </div>
        <button type="button" className="btn btn-ghost !min-h-10" onClick={startCreate}>
          New project
        </button>
      </div>

      <div className="space-y-3 border border-[var(--color-rule)] p-5 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight">Import from GitHub</h3>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Fetch README / languages / package.json, draft bilingual copy with Workers AI,
          then validate before saving to D1. If the org blocks API tokens, paste files
          locally instead.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 space-y-2">
            <span className="font-[family-name:var(--font-mono)] text-[0.68rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase">
              Repo URL or owner/repo
            </span>
            <input
              className={inputClass}
              value={githubUrl}
              placeholder="https://github.com/you/repo or you/repo"
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !manualImport) {
                  e.preventDefault();
                  void onImportGithub();
                }
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary shrink-0"
            disabled={importing}
            onClick={() => void onImportGithub()}
          >
            {importing ? "Importing…" : "Import draft"}
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input
              type="checkbox"
              checked={qualityImport}
              onChange={(e) => setQualityImport(e.target.checked)}
            />
            Quality model (70B)
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input
              type="checkbox"
              checked={manualImport}
              onChange={(e) => setManualImport(e.target.checked)}
            />
            Manual paste (private / org-blocked)
          </label>
        </div>
        {manualImport ? (
          <div className="grid gap-4 border-t border-[var(--color-rule)] pt-4 lg:grid-cols-2">
            <Field label="README (paste)">
              <textarea
                className={inputClass}
                rows={10}
                value={manualReadme}
                placeholder="Paste README.md contents"
                onChange={(e) => setManualReadme(e.target.value)}
              />
            </Field>
            <Field label="package.json (paste, optional)">
              <textarea
                className={inputClass}
                rows={10}
                value={manualPackageJson}
                placeholder='{ "name": "...", "dependencies": { ... } }'
                onChange={(e) => setManualPackageJson(e.target.value)}
              />
            </Field>
            <Field label="Short description (optional)">
              <input
                className={inputClass}
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
              />
            </Field>
            <Field label="Homepage (optional)">
              <input
                className={inputClass}
                value={manualHomepage}
                placeholder="https://…"
                onChange={(e) => setManualHomepage(e.target.value)}
              />
            </Field>
            <Field label="Languages / stack (comma separated, optional)">
              <input
                className={inputClass}
                value={manualLanguages}
                placeholder="TypeScript, React, Next.js"
                onChange={(e) => setManualLanguages(e.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-neutral)]">Loading…</p>
      ) : (
        <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium">{project.title}</p>
                <p className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-neutral)]">
                  {project.year} · {project.status} · {project.id}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost !min-h-9 !px-3"
                  onClick={() => startEdit(project)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !min-h-9 !px-3"
                  onClick={() => void onDelete(project.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-4 border border-[var(--color-rule)] p-5 sm:p-6"
      >
        <h3 className="text-lg font-semibold tracking-tight">
          {mode === "create" ? "Create project" : `Edit · ${draft.id}`}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input
              required
              className={inputClass}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="ID (slug)">
            <input
              className={inputClass}
              value={draft.id}
              disabled={mode === "edit"}
              placeholder="auto from title if empty"
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
            />
          </Field>
          <Field label="Year">
            <input
              required
              className={inputClass}
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ProjectStatus })
              }
            >
              <option value="ongoing">ongoing</option>
              <option value="paused">paused</option>
              <option value="finished">finished</option>
            </select>
          </Field>
        </div>

        <Field label="Skills (comma separated)">
          <input
            className={inputClass}
            value={skillsText}
            onChange={(e) =>
              setDraft({
                ...draft,
                skills: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>

        <Field label="Image path (optional)">
          <input
            className={inputClass}
            value={draft.image ?? ""}
            placeholder="/img/projects/example.jpg"
            onChange={(e) => setDraft({ ...draft, image: e.target.value })}
          />
        </Field>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Summary FR">
            <textarea
              className={inputClass}
              rows={3}
              value={draft.summary.fr}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  summary: { ...draft.summary, fr: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Summary EN">
            <textarea
              className={inputClass}
              rows={3}
              value={draft.summary.en}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  summary: { ...draft.summary, en: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Pitch FR">
            <textarea
              className={inputClass}
              rows={6}
              value={draft.pitch.fr}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  pitch: { ...draft.pitch, fr: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Pitch EN">
            <textarea
              className={inputClass}
              rows={6}
              value={draft.pitch.en}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  pitch: { ...draft.pitch, en: e.target.value },
                })
              }
            />
          </Field>
        </div>

        <Field label="Links (one per line: type|url - github, figma, website)">
          <textarea
            className={inputClass}
            rows={3}
            value={linksText}
            onChange={(e) => {
              const links = e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [type, ...rest] = line.split("|");
                  return {
                    type: (type.trim() || "website") as ProjectLinkType,
                    url: rest.join("|").trim(),
                  };
                })
                .filter((l) => l.url);
              setDraft({ ...draft, links });
            }}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </button>
          {message ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{message}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

const inputClass =
  "w-full border border-[var(--color-rule-strong)] bg-transparent px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-ink)]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="font-[family-name:var(--font-mono)] text-[0.68rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
