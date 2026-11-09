"use client";

import { useEffect, useState } from "react";
import {
  formatBytes,
  type AnalyticsSnapshot,
} from "@/lib/analytics";

export function StatsPanel() {
  const [days, setDays] = useState(7);
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/studio/stats?days=${days}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load analytics");
        const data = (await res.json()) as { snapshot: AnalyticsSnapshot };
        if (!cancelled) setSnapshot(data.snapshot);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Monitoring</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Cloudflare analytics
          </h2>
        </div>
        <div className="flex gap-3 font-[family-name:var(--font-mono)] text-[0.72rem] tracking-[0.08em] uppercase">
          {[1, 7, 14, 30].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={
                days === value
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-neutral)] hover:text-[var(--color-ink)]"
              }
            >
              {value}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-neutral)]">Loading…</p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      ) : null}
      {snapshot?.message ? (
        <p className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          {snapshot.message}
        </p>
      ) : null}

      {snapshot ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Requests" value={snapshot.requests.toLocaleString()} />
            <StatCard label="Visits" value={snapshot.visits.toLocaleString()} />
            <StatCard
              label="HTML page views"
              value={snapshot.pageViews.toLocaleString()}
            />
            <StatCard label="Bandwidth" value={formatBytes(snapshot.bytes)} />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.1em] text-[var(--color-neutral)] uppercase">
                Top paths
              </h3>
              <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                {snapshot.topPaths.length === 0 ? (
                  <li className="py-3 text-sm text-[var(--color-neutral)]">
                    No data
                  </li>
                ) : (
                  snapshot.topPaths.map((row) => (
                    <li
                      key={row.path}
                      className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm"
                    >
                      <span className="truncate font-[family-name:var(--font-mono)] text-[0.8rem]">
                        {row.path}
                      </span>
                      <span className="text-[var(--color-neutral)]">
                        {row.requests.toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.1em] text-[var(--color-neutral)] uppercase">
                Top countries
              </h3>
              <ul className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
                {snapshot.topCountries.length === 0 ? (
                  <li className="py-3 text-sm text-[var(--color-neutral)]">
                    No data
                  </li>
                ) : (
                  snapshot.topCountries.map((row) => (
                    <li
                      key={row.country}
                      className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm"
                    >
                      <span>{row.country}</span>
                      <span className="text-[var(--color-neutral)]">
                        {row.requests.toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--color-rule)] p-4">
      <p className="font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.1em] text-[var(--color-neutral)] uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
