// Dashboard. Visual-first: logging consistency, KPI status summary,
// score trend chart, Habit 2 verification, internal-question audit.
// Add a new section by adding another <section> and a component.

import { LogConsistency } from "../components/log-consistency";
import { ScoreChart } from "../components/score-chart";
import { habit2VerificationRate, statusCounts } from "../lib/kpi";
import { KEYS, getLogs } from "../lib/storage";

export function DashboardPage() {
  const h2 = habit2VerificationRate();
  const counts = statusCounts();
  const tracked = counts.green + counts.amber + counts.red + counts.unknown;

  return (
    <div className="space-y-6">
      <section>
        <LogConsistency />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-900 mb-2">KPI status</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatusBlock label="on track" count={counts.green} total={tracked} tone="emerald" />
          <StatusBlock label="watching" count={counts.amber} total={tracked} tone="amber" />
          <StatusBlock label="off track" count={counts.red} total={tracked} tone="rose" />
          <StatusBlock label="no data" count={counts.unknown} total={tracked} tone="stone" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-900 mb-2">Score trends</h2>
        <div className="border border-stone-200 rounded p-3 bg-white">
          <ScoreChart windowSize={28} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-900 mb-2">Habit 2 — 7-day action verification</h2>
        <div className="border border-stone-200 rounded p-3 bg-white text-sm">
          {h2.rate == null ? (
            <span className="text-stone-500">No verifications recorded yet.</span>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-emerald-900">{Math.round(h2.rate * 100)}%</span>
                <span className="text-stone-500 text-xs">
                  ({h2.yes} of {h2.total} reflective instances acted on within 7 days)
                </span>
              </div>
              <div className="mt-2 h-2 bg-stone-200 rounded overflow-hidden">
                <div className="h-full bg-emerald-700" style={{ width: `${Math.round(h2.rate * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </section>

      <InternalQuestionAudit />
    </div>
  );
}

function StatusBlock({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: "emerald" | "amber" | "rose" | "stone";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : tone === "rose"
      ? "border-rose-300 bg-rose-50 text-rose-900"
      : "border-stone-300 bg-stone-50 text-stone-700";
  return (
    <div className={"rounded border px-2 py-2 " + toneClass}>
      <div className="text-xl font-semibold leading-none">{count}</div>
      <div className="text-[10px] uppercase tracking-wide mt-1">{label}</div>
      <div className="text-[10px] opacity-70">of {total}</div>
    </div>
  );
}

function InternalQuestionAudit() {
  const weeklies = getLogs(KEYS.weekly)
    .slice()
    .sort((a, b) => (a.entry_date > b.entry_date ? -1 : 1));

  return (
    <section>
      <h2 className="text-sm font-semibold text-stone-900 mb-2">Internal-question audit</h2>
      <p className="text-xs text-stone-500 mb-2">
        Three dominant questions from each weekly synthesis, newest first. Watch for the shift away from urgency framing.
      </p>
      <div className="border border-stone-200 rounded bg-white max-h-96 overflow-y-auto divide-y divide-stone-200">
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
