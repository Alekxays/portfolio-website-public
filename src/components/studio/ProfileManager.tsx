"use client";

import { FormEvent, useEffect, useState } from "react";
import { emptyProfile, type StudioProfile } from "@/lib/profile";

export function ProfileManager() {
  const [profile, setProfile] = useState<StudioProfile>(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/studio/profile");
      if (!res.ok) {
        setMessage("Unable to load profile");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { profile: StudioProfile };
      setProfile(data.profile);
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/studio/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(err?.error ?? "Save failed");
      return;
    }
    const data = (await res.json()) as { profile: StudioProfile };
    setProfile(data.profile);
    setMessage("Profile saved — used for LM / Mail / CV generation");
  }

  if (loading) {
    return <p className="text-sm text-[var(--color-neutral)]">Loading…</p>;
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="eyebrow mb-2">Candidate</p>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-soft)]">
          Filled once, reused for every application draft. Paste your CV text and
          key projects — the AI will not invent missing facts.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 border border-[var(--color-rule)] p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              required
              className={inputClass}
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
          </Field>
          <Field label="Target role">
            <input
              className={inputClass}
              placeholder="Alternance développeur full-stack…"
              value={profile.targetRole}
              onChange={(e) =>
                setProfile({ ...profile, targetRole: e.target.value })
              }
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </Field>
          <Field label="School">
            <input
              className={inputClass}
              value={profile.school}
              onChange={(e) => setProfile({ ...profile, school: e.target.value })}
            />
          </Field>
          <Field label="Program">
            <input
              className={inputClass}
              placeholder="Bachelor / Master…"
              value={profile.program}
              onChange={(e) => setProfile({ ...profile, program: e.target.value })}
            />
          </Field>
          <Field label="Tone">
            <select
              className={inputClass}
              value={profile.tone}
              onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
            >
              <option value="pro_chaleureux">Pro & chaleureux</option>
              <option value="pro_direct">Pro & direct</option>
              <option value="startup">Startup / casually pro</option>
            </select>
          </Field>
        </div>

        <Field label="Skills">
          <textarea
            className={inputClass}
            rows={3}
            placeholder="TypeScript, React, Cloudflare Workers…"
            value={profile.skills}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
          />
        </Field>
        <Field label="Experience & projects">
          <textarea
            className={inputClass}
            rows={6}
            placeholder="Bullet points, stages, projets perso…"
            value={profile.experience}
            onChange={(e) =>
              setProfile({ ...profile, experience: e.target.value })
            }
          />
        </Field>
        <Field label="CV text (paste)">
          <textarea
            className={inputClass}
            rows={12}
            placeholder="Colle ici le texte de ton CV…"
            value={profile.cvText}
            onChange={(e) => setProfile({ ...profile, cvText: e.target.value })}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
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
