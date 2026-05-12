// Plan view. Renders outcomes, current phase, anchors, and per-outcome KPI snapshot.
// Pure read view — no logging happens here.

import { allOutcomes, allKpis, kpiById, mostRecent, outcomeStatus, thresholdStatus } from "../lib/kpi";
import { currentPhase, lastAnchor, nextAnchor, daysBetween, todayString } from "../lib/phase";
import type { Kpi } from "../lib/types";

const STATUS_COLORS: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-900 border-emerald-300",
  amber: "bg-amber-100 text-amber-900 border-amber-300",
  red: "bg-rose-100 text-rose-900 border-rose-300",
  unknown: "bg-stone-100 text-stone-600 border-stone-300",
};

const STATUS_LABEL: Record<string, string> = {
  green: "on track",
  amber: "watching",
  red: "off track",
  unknown: "no data",
};

export function PlanPage() {
  const today = todayString();
  const phase = currentPhase(today);
  const last = lastAnchor(today);
  const next = nextAnchor(today);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Current phase</h2>
        <div className="border border-stone-300 rounded p-4 bg-white">
          <div className="text-lg font-medium">{phase.name}</div>
          <p className="text-sm text-stone-700 mt-1">{phase.focus}</p>
          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <span className="text-stone-500">Last anchor: </span>
              {last ? (
                <>
                  <span className="font-medium">{last.label}</span>
                  <span className="text-stone-500"> · {daysBetween(last.date, today)}d ago</span>
                </>
              ) : (
                "—"
              )}
            </div>
            <div>
              <span className="text-stone-500">Next anchor: </span>
              {next ? (
                <>
                  <span className="font-medium">{next.label}</span>
                  <span className="text-stone-500"> · in {daysBetween(today, next.date)}d</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="text-xs text-stone-500 mt-3">
            Depressive-load cadence: <span className="font-medium">{phase.depressive_load_cadence}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Seven outcomes</h2>
        <div className="space-y-3">
          {allOutcomes().map((o) => {
            const s = outcomeStatus(o);
            return (
              <div key={o.id} className="border border-stone-300 rounded p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-stone-900">
                      {o.id}. {o.name}
                    </div>
                    <p className="text-sm text-stone-700 mt-1">{o.summary}</p>
                  </div>
                  <span className={"text-xs px-2 py-0.5 rounded border " + STATUS_COLORS[s]}>{STATUS_LABEL[s]}</span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {o.kpis.map((kpiId) => {
                    const k = kpiById(kpiId);
                    if (!k) return null;
                    return <KpiChip key={kpiId} kpi={k} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function KpiChip({ kpi }: { kpi: Kpi }) {
  const s = thresholdStatus(kpi.id);
  const v = mostRecent(kpi.id);
  return (
    <div className={"text-xs px-2 py-1 rounded border flex items-center justify-between " + STATUS_COLORS[s]}>
      <span>{kpi.label}</span>
      <span className="font-mono">{v == null ? "—" : v}</span>
    </div>
  );
}
