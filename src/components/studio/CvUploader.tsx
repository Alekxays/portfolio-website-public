"use client";

import { useEffect, useState } from "react";
import type { CvLocale, CvMeta } from "@/lib/cv";
import { monthsBetween, publicCvPath } from "@/lib/cv";

export function CvUploader() {
  const [files, setFiles] = useState<CvMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<CvLocale | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/studio/cv");
    if (!res.ok) {
      setMessage("Unable to load CV files");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { files: CvMeta[] };
    setFiles(data.files);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onUpload(locale: CvLocale, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(locale);
    setMessage(null);

    const body = new FormData();
    body.set("locale", locale);
    body.set("file", file);

    const res = await fetch("/api/studio/cv", { method: "POST", body });
    setUploading(null);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(err?.error ?? "Upload failed");
      return;
    }
    setMessage(`CV ${locale.toUpperCase()} updated — public download uses this file`);
    await load();
  }

  async function onReset(locale: CvLocale) {
    if (!confirm(`Revert ${locale.toUpperCase()} CV to the static repo file?`)) return;
    const res = await fetch(
      `/api/studio/cv?locale=${encodeURIComponent(locale)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      setMessage("Reset failed");
      return;
    }
    setMessage(`CV ${locale.toUpperCase()} reset to static file`);
    await load();
  }

  return (
    <section className="space-y-4 border border-[var(--color-rule)] p-5 sm:p-6">
      <div>
        <p className="font-[family-name:var(--font-mono)] text-[0.68rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase">
          Public CV download
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">PDF files</h3>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Replaces the Hero “Download CV” PDFs. You get a reminder email if an
          uploaded CV is older than 6 months.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-neutral)]">Loading…</p>
      ) : (
        <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {files.map((file) => {
            const age = file.updatedAt ? monthsBetween(file.updatedAt) : null;
            const stale = age !== null && age >= 6;
            return (
              <li
                key={file.locale}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium uppercase">{file.locale} PDF</p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.06em] text-[var(--color-neutral)]">
                    {file.hasUpload
                      ? `${file.filename} · updated ${file.updatedAt.slice(0, 10)}`
                      : "Using static repo file"}
                    {stale ? " · stale (>6 months)" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={publicCvPath(file.locale, {
                      v: file.updatedAt || String(Date.now()),
                    })}
                    className="btn btn-ghost !min-h-9 !px-3"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Preview
                  </a>
                  <label className="btn btn-ghost !min-h-9 !px-3 cursor-pointer">
                    {uploading === file.locale ? "Uploading…" : "Upload PDF"}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      disabled={Boolean(uploading)}
                      onChange={(e) => {
                        void onUpload(file.locale, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {file.hasUpload ? (
                    <button
                      type="button"
                      className="btn btn-ghost !min-h-9 !px-3"
                      onClick={() => void onReset(file.locale)}
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message ? (
        <p className="text-sm text-[var(--color-ink-soft)]">{message}</p>
      ) : null}
    </section>
  );
}
