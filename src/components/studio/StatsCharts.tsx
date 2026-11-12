"use client";

type SeriesPoint = { day: string; requests: number; visits: number };
type RankedRow = { label: string; value: number };

function formatDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day.slice(5);
  return d.toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildPolyline(
  values: number[],
  width: number,
  height: number,
  padX: number,
  padY: number,
) {
  const max = Math.max(...values, 1);
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = values.length <= 1 ? 0 : innerW / (values.length - 1);

  return values
    .map((value, index) => {
      const x = padX + index * step;
      const y = padY + innerH - (value / max) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  padX: number,
  padY: number,
) {
  const line = buildPolyline(values, width, height, padX, padY);
  if (!line) return "";
  const points = line.split(" ");
  const first = points[0]?.split(",")[0] ?? String(padX);
  const last = points[points.length - 1]?.split(",")[0] ?? String(width - padX);
  const baseY = height - padY;
  return `M ${first},${baseY} L ${line.replace(/ /g, " L ")} L ${last},${baseY} Z`;
}

export function SeriesChart({
  series,
  label,
}: {
  series: SeriesPoint[];
  label: string;
}) {
  if (series.length === 0) {
    return (
      <p className="py-8 text-sm text-[var(--color-neutral)]">No series data</p>
    );
  }

  const width = 640;
  const height = 220;
  const padX = 12;
  const padY = 16;
  const requests = series.map((p) => p.requests);
  const visits = series.map((p) => p.visits);
  const requestsLine = buildPolyline(requests, width, height, padX, padY);
  const visitsLine = buildPolyline(visits, width, height, padX, padY);
  const area = buildAreaPath(requests, width, height, padX, padY);
  const ticks = [
    series[0],
    series[Math.floor(series.length / 2)],
    series[series.length - 1],
  ].filter(Boolean);

  return (
    <figure className="space-y-3">
      <figcaption className="font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.1em] text-[var(--color-neutral)] uppercase">
        {label}
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        className="h-auto w-full border border-[var(--color-rule)] bg-[var(--color-paper-2)]"
      >
        <path
          d={area}
          fill="currentColor"
          className="text-[var(--color-ink)] opacity-[0.08]"
        />
        <polyline
          points={requestsLine}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--color-ink)]"
        />
        <polyline
          points={visitsLine}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className="text-[var(--color-neutral)]"
        />
        {series.map((point, index) => {
          const max = Math.max(...requests, 1);
          const innerW = width - padX * 2;
          const innerH = height - padY * 2;
          const step = series.length <= 1 ? 0 : innerW / (series.length - 1);
          const x = padX + index * step;
          const y = padY + innerH - (point.requests / max) * innerH;
          return (
            <circle
              key={point.day}
              cx={x}
              cy={y}
              r="2.5"
              className="fill-[var(--color-ink)]"
            >
              <title>
                {formatDay(point.day)} · {point.requests.toLocaleString()} req ·{" "}
                {point.visits.toLocaleString()} visits
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.7rem] text-[var(--color-neutral)]">
        <div className="flex gap-4 font-[family-name:var(--font-mono)] tracking-[0.06em] uppercase">
          <span className="inline-flex items-center gap-2">
            <span className="h-px w-4 bg-[var(--color-ink)]" aria-hidden />
            Requests
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="h-px w-4 border-t border-dashed border-[var(--color-neutral)]"
              aria-hidden
            />
            Visits
          </span>
        </div>
        <div className="flex gap-4 font-[family-name:var(--font-mono)]">
          {ticks.map((tick) => (
            <span key={tick.day}>{formatDay(tick.day)}</span>
          ))}
        </div>
      </div>
    </figure>
  );
}

export function RankedBars({
  rows,
  label,
}: {
  rows: RankedRow[];
  label: string;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.1em] text-[var(--color-neutral)] uppercase">
          {label}
        </h3>
        <p className="py-3 text-sm text-[var(--color-neutral)]">No data</p>
      </div>
    );
  }

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div>
      <h3 className="mb-3 font-[family-name:var(--font-mono)] text-[0.7rem] tracking-[0.1em] text-[var(--color-neutral)] uppercase">
        {label}
      </h3>
      <ul
        className="space-y-3"
        role="list"
        aria-label={label}
      >
        {rows.map((row) => {
          const pct = Math.max(2, (row.value / max) * 100);
          return (
            <li key={row.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-[family-name:var(--font-mono)] text-[0.8rem]">
                  {row.label}
                </span>
                <span className="shrink-0 text-[var(--color-neutral)]">
                  {row.value.toLocaleString()}
                </span>
              </div>
              <div
                className="h-1.5 w-full bg-[var(--color-paper-3)]"
                role="presentation"
              >
                <div
                  className="h-full bg-[var(--color-ink)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
