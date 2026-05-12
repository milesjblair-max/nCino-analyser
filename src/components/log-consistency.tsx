// Logging consistency card. Shows missed bi-daily count, days-since-last,
// current streak, and a 28-day grid (4 rows × 7 columns) where each cell
// is colour-coded: dark green = logged that day, light green = covered
// (logged the day before, still inside the bi-daily window), amber =
// missed, grey = before you started logging.

import { loggingStats } from "../lib/kpi";

const CELL_BG: Record<string, string> = {
  logged: "bg-emerald-700",
  covered: "bg-emerald-300",
  missed: "bg-amber-400",
  empty: "bg-stone-200",
};

export function LogConsistency() {
  const stats = loggingStats(28);
  const hasAnyData = stats.daysSinceLast !== null;

  const status =
    !hasAnyData
      ? "neutral"
      : stats.missedInWindow >= 3
      ? "alert"
      : stats.missedInWindow >= 1
      ? "warn"
      : "ok";

  const cardClass =
    status === "alert"
      ? "border-rose-300 bg-rose-50"
      : status === "warn"
      ? "border-amber-300 bg-amber-50"
      : status === "ok"
      ? "border-emerald-300 bg-emerald-50"
      : "border-stone-300 bg-white";

  return (
    <div className={"border rounded p-3 " + cardClass}>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="text-sm font-semibold text-stone-900">Bi-daily logging</div>
        <div className="text-[11px] text-stone-500">last 28 days</div>
      </div>

      {!hasAnyData ? (
        <div className="text-sm text-stone-600">
          No bi-daily logs yet. Start one from the Log tab — every 2 days, evening.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Stat
            label="Logged"
            value={String(stats.loggedInWindow)}
            sub={`of ${stats.expectedInWindow || "—"} expected`}
          />
          <Stat
            label="Missed"
            value={String(stats.missedInWindow)}
            sub={stats.missedInWindow === 0 ? "all good" : "bi-daily slots"}
            highlight={stats.missedInWindow > 0}
          />
          <Stat
            label="Last log"
            value={
              stats.daysSinceLast === 0
                ? "today"
                : stats.daysSinceLast === 1
                ? "1d ago"
                : `${stats.daysSinceLast}d ago`
            }
            sub={`streak ${stats.currentStreak}d`}
          />
        </div>
      )}

      {/* 28-day grid (4 rows × 7) */}
      <div className="grid grid-cols-7 gap-1">
        {stats.grid.map((g) => (
          <div
            key={g.date}
            title={`${g.date} · ${g.status}`}
            className={"aspect-square rounded-sm " + (CELL_BG[g.status] ?? "bg-stone-200")}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-stone-600">
        <LegendDot color="bg-emerald-700" label="logged" />
        <LegendDot color="bg-emerald-300" label="covered" />
        <LegendDot color="bg-amber-400" label="missed" />
        <LegendDot color="bg-stone-200" label="no data" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="border border-stone-200 rounded px-2 py-1.5 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className={"text-lg font-semibold " + (highlight ? "text-rose-700" : "text-stone-900")}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-stone-500">{sub}</div>}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={"w-2.5 h-2.5 rounded-sm " + color} />
      {label}
    </span>
  );
}
