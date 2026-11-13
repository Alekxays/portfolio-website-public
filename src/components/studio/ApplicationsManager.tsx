"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  APPLICATION_CHANNELS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  type Application,
  type ApplicationChannel,
  type ApplicationStatus,
} from "@/lib/applications";
import type { StudioGenerateKind } from "@/lib/ai";

type StatusFilter = ApplicationStatus | "all";

const emptyApplication = (): Omit<
  Application,
  "id" | "createdAt" | "updatedAt"
> & { id: string } => ({
  id: "",
  company: "",
  role: "",
  status: "todo",
  channel: "website",
  url: "",
  location: "",
  appliedAt: "",
  followUpAt: "",
  interviewAt: "",
  notes: "",
  jobDescription: "",
  draftLm: "",
  draftMail: "",
  draftCv: "",
});

export function ApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [draft, setDraft] = useState(emptyApplication());
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<StudioGenerateKind | null>(null);
  const [quality, setQuality] = useState(false);
  const [mailKind, setMailKind] = useState<"apply" | "followup">("apply");
  const [message, setMessage] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base = Object.fromEntries(
      APPLICATION_STATUSES.map((status) => [status, 0]),
    ) as Record<ApplicationStatus, number>;
    for (const app of applications) {
      base[app.status] += 1;
    }
    return base;
  }, [applications]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? applications
        : applications.filter((app) => app.status === filter),
    [applications, filter],
  );

  async function load() {
    setLoading(true);
    const res = await fetch("/api/studio/applications");
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(err?.error ?? "Unable to load applications");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { applications: Application[] };
    setApplications(data.applications);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function startCreate() {
    setMode("create");
    setDraft(emptyApplication());
    setMessage(null);
  }

  function startEdit(application: Application) {
    setMode("edit");
    setDraft({
      id: application.id,
      company: application.company,
      role: application.role,
      status: application.status,
      channel: application.channel,
      url: application.url ?? "",
      location: application.location ?? "",
      appliedAt: application.appliedAt ?? "",
      followUpAt: application.followUpAt ?? "",
      interviewAt: application.interviewAt ?? "",
      notes: application.notes,
      jobDescription: application.jobDescription ?? "",
      draftLm: application.draftLm ?? "",
      draftMail: application.draftMail ?? "",
      draftCv: application.draftCv ?? "",
    });
    setMessage(null);
  }

  function applySaved(application: Application) {
    setApplications((prev) => {
      const exists = prev.some((item) => item.id === application.id);
      if (!exists) return [application, ...prev];
      return prev.map((item) =>
        item.id === application.id ? application : item,
      );
    });
    if (mode === "edit" && draft.id === application.id) {
      startEdit(application);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const isCreate = mode === "create" || !draft.id.trim();
    const payload = {
      ...draft,
      id: isCreate ? undefined : draft.id.trim(),
      company: draft.company.trim(),
      role: draft.role.trim(),
      url: draft.url?.trim() || undefined,
      location: draft.location?.trim() || undefined,
      appliedAt: draft.appliedAt?.trim() || undefined,
      followUpAt: draft.followUpAt?.trim() || undefined,
      interviewAt: draft.interviewAt?.trim() || undefined,
    };

    const res = await fetch("/api/studio/applications", {
      method: isCreate ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(err?.error ?? "Save failed");
      return;
    }

    const data = (await res.json()) as { application: Application };
    setMessage(isCreate ? "Application created" : "Application updated");
    await load();
    startEdit(data.application);
  }

  async function onDelete(id: string, label: string) {
    if (!confirm(`Delete application “${label}” ?`)) return;
    const res = await fetch(
      `/api/studio/applications?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      setMessage("Delete failed");
      return;
    }
    setMessage("Application deleted");
    if (draft.id === id) startCreate();
    await load();
  }

  async function quickStatus(application: Application, status: ApplicationStatus) {
    const res = await fetch("/api/studio/applications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...application,
        status,
        appliedAt:
          status === "applied" && !application.appliedAt
            ? new Date().toISOString().slice(0, 10)
            : application.appliedAt,
      }),
    });
    if (!res.ok) {
      setMessage("Status update failed");
      return;
    }
    await load();
  }

  async function generate(
    kind: StudioGenerateKind,
    nextMailKind: "apply" | "followup" = mailKind,
  ) {
    if (!draft.id || mode !== "edit") {
      setMessage("Save the application first, then generate.");
      return;
    }
    if (kind === "mail") setMailKind(nextMailKind);
    setGenerating(kind);
    setMessage(null);

    const res = await fetch("/api/studio/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: draft.id,
        kind,
        jobDescription: draft.jobDescription,
        mailKind: kind === "mail" ? nextMailKind : undefined,
        quality,
        save: true,
      }),
    });

    setGenerating(null);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(err?.error ?? "Generation failed");
      return;
    }

    const data = (await res.json()) as {
      text: string;
      model: string;
      application: Application;
    };
    applySaved(data.application);
    setMessage(
      `${kind.toUpperCase()} generated · ${data.model.replace("@cf/", "")}`,
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Pipeline</p>
          <h2 className="text-2xl font-semibold tracking-tight">Applications</h2>
        </div>
        <button type="button" className="btn btn-ghost !min-h-10" onClick={startCreate}>
          New application
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-y border-[var(--color-rule)] py-3">
        <FilterChip
          active={filter === "all"}
          label={`All ${applications.length}`}
          onClick={() => setFilter("all")}
        />
        {APPLICATION_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={filter === status}
            label={`${APPLICATION_STATUS_LABELS[status]} ${counts[status]}`}
            onClick={() => setFilter(status)}
          />
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-neutral)]">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-[var(--color-neutral)]">
          No applications{filter === "all" ? " yet" : ` in “${APPLICATION_STATUS_LABELS[filter]}”`}.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {visible.map((application) => (
            <li key={application.id} className="space-y-3 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {application.company}
                    <span className="text-[var(--color-neutral)]"> · </span>
                    {application.role}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-neutral)]">
                    {APPLICATION_STATUS_LABELS[application.status]} · {application.channel}
                    {application.location ? ` · ${application.location}` : ""}
                    {application.draftLm ? " · LM" : ""}
                    {application.draftMail ? " · Mail" : ""}
                    {application.draftCv ? " · CV" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {application.url ? (
                    <a
                      href={application.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost !min-h-9 !px-3"
                    >
                      Offer
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-ghost !min-h-9 !px-3"
                    onClick={() => startEdit(application)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !min-h-9 !px-3"
                    onClick={() =>
                      void onDelete(
                        application.id,
                        `${application.company} - ${application.role}`,
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {APPLICATION_STATUSES.filter((s) => s !== application.status).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      className="font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.06em] text-[var(--color-neutral)] uppercase hover:text-[var(--color-ink)]"
                      onClick={() => void quickStatus(application, status)}
                    >
                      → {APPLICATION_STATUS_LABELS[status]}
                    </button>
                  ),
                )}
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
          {mode === "create" ? "Create application" : `Edit · ${draft.company}`}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <input
              required
              className={inputClass}
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <input
              required
              className={inputClass}
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={draft.status}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  status: e.target.value as ApplicationStatus,
                })
              }
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {APPLICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Channel">
            <select
              className={inputClass}
              value={draft.channel}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  channel: e.target.value as ApplicationChannel,
                })
              }
            >
              {APPLICATION_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Offer URL">
            <input
              className={inputClass}
              type="url"
              placeholder="https://"
              value={draft.url ?? ""}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
            />
          </Field>
          <Field label="Location">
            <input
              className={inputClass}
              placeholder="Paris · remote · hybrid"
              value={draft.location ?? ""}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </Field>
          <Field label="Applied at">
            <input
              className={inputClass}
              type="date"
              value={draft.appliedAt ?? ""}
              onChange={(e) => setDraft({ ...draft, appliedAt: e.target.value })}
            />
          </Field>
          <Field label="Follow-up at">
            <input
              className={inputClass}
              type="date"
              value={draft.followUpAt ?? ""}
              onChange={(e) => setDraft({ ...draft, followUpAt: e.target.value })}
            />
          </Field>
          <Field label="Interview at">
            <input
              className={inputClass}
              type="date"
              value={draft.interviewAt ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, interviewAt: e.target.value })
              }
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Contact, feedback, next step…"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </Field>

        <Field label="Job description (paste offer text)">
          <textarea
            className={inputClass}
            rows={6}
            placeholder="Colle l’annonce ici pour des brouillons plus ciblés…"
            value={draft.jobDescription}
            onChange={(e) =>
              setDraft({ ...draft, jobDescription: e.target.value })
            }
          />
        </Field>

        {mode === "edit" ? (
          <div className="space-y-4 border-t border-[var(--color-rule)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[0.68rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase">
                  AI drafts
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  Separate buttons - one generation at a time. Fill{" "}
                  <a href="/studio/profile" className="underline underline-offset-2">
                    Profile
                  </a>{" "}
                  first.
                </p>
              </div>
              <label className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-neutral)] uppercase">
                <input
                  type="checkbox"
                  checked={quality}
                  onChange={(e) => setQuality(e.target.checked)}
                />
                Quality model (70B)
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary !min-h-10"
                disabled={Boolean(generating)}
                onClick={() => void generate("lm")}
              >
                {generating === "lm" ? "LM…" : "Generate LM"}
              </button>
              <button
                type="button"
                className="btn btn-ghost !min-h-10"
                disabled={Boolean(generating)}
                onClick={() => void generate("mail", "apply")}
              >
                {generating === "mail" && mailKind === "apply"
                  ? "Mail…"
                  : "Generate Mail"}
              </button>
              <button
                type="button"
                className="btn btn-ghost !min-h-10"
                disabled={Boolean(generating)}
                onClick={() => void generate("mail", "followup")}
              >
                {generating === "mail" && mailKind === "followup"
                  ? "Relance…"
                  : "Generate Relance"}
              </button>
              <button
                type="button"
                className="btn btn-ghost !min-h-10"
                disabled={Boolean(generating)}
                onClick={() => void generate("cv")}
              >
                {generating === "cv" ? "CV…" : "Generate CV"}
              </button>
            </div>

            <Field label="Lettre de motivation">
              <textarea
                className={inputClass}
                rows={10}
                value={draft.draftLm}
                onChange={(e) => setDraft({ ...draft, draftLm: e.target.value })}
              />
            </Field>
            <Field label="Mail">
              <textarea
                className={inputClass}
                rows={8}
                value={draft.draftMail}
                onChange={(e) =>
                  setDraft({ ...draft, draftMail: e.target.value })
                }
              />
            </Field>
            <Field label="CV adapté">
              <textarea
                className={inputClass}
                rows={10}
                value={draft.draftCv}
                onChange={(e) => setDraft({ ...draft, draftCv: e.target.value })}
              />
            </Field>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-neutral)]">
            Save the application once to unlock LM / Mail / CV generation.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </button>
          {mode === "edit" ? (
            <button type="button" className="btn btn-ghost" onClick={startCreate}>
              Cancel
            </button>
          ) : null}
          {message ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{message}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] uppercase ${
        active
          ? "text-[var(--color-ink)] underline underline-offset-4"
          : "text-[var(--color-neutral)] hover:text-[var(--color-ink)]"
      }`}
    >
      {label}
    </button>
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
