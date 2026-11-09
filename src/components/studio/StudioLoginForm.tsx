"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function StudioLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/studio/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Login failed");
      return;
    }
    router.push("/studio");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-24 w-full max-w-sm space-y-4 border border-[var(--color-rule)] p-6"
    >
      <div>
        <p className="eyebrow mb-2">Studio</p>
        <h1 className="text-2xl font-semibold tracking-tight">Local access</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Dev password only. In production, Cloudflare Access protects this
          area.
        </p>
      </div>
      <label className="block space-y-2">
        <span className="font-[family-name:var(--font-mono)] text-[0.68rem] tracking-[0.08em] text-[var(--color-neutral)] uppercase">
          Password
        </span>
        <input
          type="password"
          required
          autoFocus
          className="w-full border border-[var(--color-rule-strong)] bg-transparent px-3 py-2.5 outline-none focus:border-[var(--color-ink)]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
