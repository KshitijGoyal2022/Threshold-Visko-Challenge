import type { Reading } from "@/lib/threshold/engine";

// A small sparkline of the patient's ratings over the session.

export function AnxietyChart({ readings }: { readings: Reading[] }) {
  const width = 284;
  const height = 84;
  const pad = 6;
  const span = Math.max(60_000, readings.at(-1)?.t ?? 0);

  const x = (t: number) => pad + (t / span) * (width - pad * 2);
  const y = (suds: number) => pad + (1 - suds / 100) * (height - pad * 2);

  const points = readings.map((reading) => `${x(reading.t)},${y(reading.suds)}`);
  const line = points.length ? `M${points.join(" L")}` : "";
  const area = points.length
    ? `${line} L${x(readings.at(-1)!.t)},${height - pad} L${x(readings[0].t)},${height - pad} Z`
    : "";

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id="anxiety-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--state))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--state))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((level) => (
        <line
          key={level}
          x1={pad}
          x2={width - pad}
          y1={y(level)}
          y2={y(level)}
          stroke="var(--line)"
          strokeDasharray="2 4"
        />
      ))}
      {area && <path d={area} fill="url(#anxiety-fill)" />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke="hsl(var(--state))"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
