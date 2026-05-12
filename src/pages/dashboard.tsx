// Dashboard. KPI list with sparklines + threshold-driven status, plus a
// scrollable internal-question audit pulled from weekly syntheses.

import { Sparkline } from "../components/sparkline";
import {
  allKpis,
  habit2VerificationRate,
  lastN,
  mostRecent,
  numericSeries,
  thresholdStatus,
} from "../lib/kpi";
import { KEYS, getLogs } from "../lib/storage";

const STATUS_COLORS: Record<string, string> = {
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-rose-700",
  unknown: "text-stone-400",
};

export function DashboardPage() {
  const kpis = allKpis();
  const h2 = habit2VerificationRate();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Score trends (last 28 entries)</h2>
        <div className="border border-stone-300 rounded bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead className="text-left text-xs text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-3 py-2">KPI</th>
                <th className="px-3 py-2">Latest</th>
                <th className="px-3 py-2">Sparkline</th>
                <th className="px-3 py-2">Outcomes</th>
              </tr>
            </thead>
            <tbody>
              {kpis
                .filter((k) => k.thresholds || k.direction)
                .map((k) => {
                  const series = numericSeries(k.id);
                  const values = lastN(series, 28).map((p) => p.value);
                  const v = mostRecent(k.id);
                  const status = thresholdStatus(k.id);
                  return (
                    <tr key={k.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-3 py-2 font-medium text-stone-800">{k.label}</td>
                      <td className={"px-3 py-2 font-mono " + STATUS_COLORS[status]}>
                        {v == null ? "—" : v}
                      </td>
                      <td className={"px-3 py-2 " + STATUS_COLORS[status]}>
                        <Sparkline values={values} min={1} max={10} />
                      </td>
                      <td className="px-3 py-2 text-xs text-stone-500">{k.outcomes.join(", ")}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Habit 2 7-day verification</h2>
        <div className="border border-stone-300 rounded p-4 bg-white text-sm">
          {h2.rate == null ? (
            <span className="text-stone-500">No verifications recorded yet.</span>
          ) : (
            <span>
              <span className="font-mono text-lg">{Math.round(h2.rate * 100)}%</span>{" "}
              <span className="text-stone-500">
                ({h2.yes} of {h2.total} reflective instances acted on within 7 days)
              </span>
            </span>
          )}
        </div>
      </section>

      <InternalQuestionAudit />
    </div>
  );
}

function InternalQuestionAudit() {
  const weeklies = getLogs(KEYS.weekly)
    .slice()
    .sort((a, b) => (a.entry_date > b.entry_date ? -1 : 1));

  return (
    <section>
      <h2 className="text-base font-semibold text-stone-900 mb-2">Internal-question audit</h2>
      <p className="text-xs text-stone-500 mb-2">
        The three dominant questions from each weekly synthesis, newest first. Watch for the shift from urgency framing
        to presence framing.
      </p>
      <div className="border border-stone-300 rounded bg-white max-h-96 overflow-y-auto divide-y divide-stone-200">
        {weeklies.length === 0 && (
          <div className="px-4 py-3 text-sm text-stone-500">No weekly syntheses yet.</div>
        )}
        {weeklies.map((w) => {
          const qs: string[] = Array.isArray(w.internal_questions) ? w.internal_questions : [];
          return (
            <div key={w.id} className="px-4 py-3">
              <div className="text-xs text-stone-500 mb-1">{w.entry_date}</div>
              <ol className="list-decimal pl-5 text-sm text-stone-800 space-y-0.5">
                {qs.filter(Boolean).map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
