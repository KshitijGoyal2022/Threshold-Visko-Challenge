import { AnxietyChart } from "@/components/threshold/anxiety-chart";
import type { Reading } from "@/lib/threshold/engine";
import type { Ladder } from "@/lib/threshold/ladders";
import type { RungVisit } from "@/lib/threshold/protocol";

// What a session produced: the anxiety curve, how far the patient climbed,
// and how much the anxiety fell from its peak by the end.

function fmt(ms: number) {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function Report({
  ladder,
  readings,
  history,
}: {
  ladder: Ladder;
  readings: Reading[];
  history: RungVisit[];
}) {
  const last = readings.at(-1);
  const duration = last?.t ?? 0;
  const peak = Math.max(0, ...readings.map((reading) => reading.suds));
  const final = last?.suds ?? 0;
  const drop = peak ? Math.round(((peak - final) / peak) * 100) : 0;
  const highest = Math.max(0, ...history.map((visit) => visit.level));

  const timeAtRung = ladder.rungs.map(() => 0);
  history.forEach((visit, index) => {
    const end = history[index + 1]?.t ?? duration;
    timeAtRung[visit.level] += Math.max(0, end - visit.t);
  });

  return (
    <div className="report">
      <div className="stats">
        <div className="stat">
          <span className="mono big">{fmt(duration)}</span>
          <span>Session length</span>
        </div>
        <div className="stat">
          <span className="mono big">{peak}</span>
          <span>Peak anxiety</span>
        </div>
        <div className="stat">
          <span className="mono big">{final}</span>
          <span>At the end</span>
        </div>
        <div className="stat">
          <span className="mono big">{drop}%</span>
          <span>Drop from peak</span>
        </div>
        <div className="stat">
          <span className="mono big">
            {highest + 1}/{ladder.rungs.length}
          </span>
          <span>Highest step</span>
        </div>
      </div>
      <AnxietyChart readings={readings} />
      <ol className="ladder report-ladder">
        {ladder.rungs.map((rung) => (
          <li key={rung.level} className={rung.level <= highest ? "done" : ""}>
            <span className="step">{rung.level + 1}</span>
            <span>{rung.label}</span>
            <span className="mono">{timeAtRung[rung.level] ? fmt(timeAtRung[rung.level]) : "—"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
