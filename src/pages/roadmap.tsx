// Event-based roadmap, grouped by phase. Each phase renders a header card
// (name, focus text, start/end dates, depressive-load cadence) followed by
// any anchors or derived events that fall inside it. A continuous phase-
// colour stripe runs down the left of every row so the eye can follow
// phase progression.
//
// To change phase colours: edit PHASE_STRIPE. Milestone tones live in
// milestoneTone(). Anything added to timeline.json (anchors, derived
// events) flows in automatically.

import {
  allAnchors,
  allDerivedEvents,
  allPhases,
  currentPhase,
  daysBetween,
  derivedEventDate,
  formatLongDate,
  parseDate,
  todayString,
} from "../lib/phase";
import type { Anchor, Phase } from "../lib/types";

const PHASE_STRIPE: Record<string, string> = {
  P0: "bg-emerald-200",
  P1: "bg-emerald-300",
  P2: "bg-emerald-700",
  P3: "bg-emerald-800",
  P4: "bg-emerald-600",
  P5: "bg-emerald-900",
  P6: "bg-emerald-200",
};

type Entry = {
  date: string;
  label: string;
  kind: "today" | "anchor" | string;
};

export function RoadmapPage() {
  const today = todayString();
  const todayMs = parseDate(today).getTime();
  const phases = allPhases();
  const anchors = allAnchors();
  const derived = allDerivedEvents();

  const anchorById: Record<string, Anchor> = Object.fromEntries(anchors.map((a) => [a.id, a]));
  const phaseStartAnchorIds = new Set(phases.map((p) => p.starts));

  function phaseAtDate(date: string): Phase {
    const t = parseDate(date).getTime();
    for (const p of phases) {
      const start = parseDate(anchorById[p.starts]?.date ?? today).getTime();
      const end = p.ends ? parseDate(anchorById[p.ends]?.date ?? today).getTime() : Infinity;
      if (t >= start && t < end) return p;
    }
    return phases[phases.length - 1];
  }

  // Entries are: today, every anchor that is NOT a phase boundary, every
  // derived event. Phase boundaries themselves are absorbed into the phase
  // header card, so we don't double-render them.
  const allEntries: Entry[] = [
    { date: today, label: "Today", kind: "today" },
    ...anchors
      .filter((a) => parseDate(a.date).getTime() > todayMs)
      .filter((a) => !phaseStartAnchorIds.has(a.id))
      .map<Entry>((a) => ({ date: a.date, label: a.label, kind: "anchor" })),
    ...derived
      .map<Entry>((e) => ({ date: derivedEventDate(e), label: e.label, kind: e.kind }))
      .filter((e) => parseDate(e.date).getTime() > todayMs),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const entriesByPhase: Record<string, Entry[]> = {};
  for (const e of allEntries) {
    const id = phaseAtDate(e.date).id;
    (entriesByPhase[id] ??= []).push(e);
  }

  // Show every phase that hasn't ended yet (or has no end).
  const visiblePhases = phases.filter((p) => {
    if (p.ends == null) return true;
    return parseDate(anchorById[p.ends]?.date ?? today).getTime() > todayMs;
  });

  const lastDate = allEntries[allEntries.length - 1]?.date ?? today;

  const currentPhaseObj = currentPhase(today);
  const currentPhaseStartDate = anchorById[currentPhaseObj.starts]?.date ?? today;
  const currentPhaseEndDate = currentPhaseObj.ends ? anchorById[currentPhaseObj.ends]?.date ?? null : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Roadmap</h2>
        <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
            <span className="font-medium">Today:</span> {formatLongDate(today)}
          </span>
          <span className="text-stone-400">·</span>
          <span>in <span className="font-medium">{currentPhaseObj.id} {currentPhaseObj.name}</span></span>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Plan runs through {formatLongDate(lastDate)}. Each phase has a description card with milestones nested below.
        </p>
      </div>

      <ol>
        {visiblePhases.map((p) => {
          const phaseEntries = entriesByPhase[p.id] ?? [];
          const startDate = anchorById[p.starts]?.date ?? today;
          const endDate = p.ends ? anchorById[p.ends]?.date ?? lastDate : lastDate;
          const stripe = PHASE_STRIPE[p.id] ?? "bg-stone-200";
          // Current phase: visual start = today rather than the (possibly past) anchor.
          const effectiveStart =
            parseDate(startDate).getTime() < todayMs ? today : startDate;
          const isCurrent = p.id === phaseAtDate(today).id;

          return (
            <li key={p.id} className="flex gap-3">
              <div className={"w-2 flex-shrink-0 " + stripe} />
              <div className="flex-1 min-w-0 py-3 space-y-3">
                {/* Phase header card */}
                <div
                  className={
                    "rounded p-3 " +
                    (isCurrent
                      ? "border-2 border-emerald-700 bg-emerald-50"
                      : "border border-emerald-200 bg-white")
                  }
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-900 font-semibold">
                      {p.id}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-900 text-white">
                        current
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-stone-900 leading-snug">{p.name}</div>
                  <p className="text-xs text-stone-700 mt-1 leading-relaxed">{p.focus}</p>
                  <div className="text-[10px] text-stone-500 mt-2">
                    {formatLongDate(effectiveStart)}
                    {p.ends ? <> → {formatLongDate(endDate)}</> : <> → indefinite</>}
                    {" · "}depressive-load: <span className="font-medium">{p.depressive_load_cadence}</span>
                  </div>
                  {isCurrent && p.ends && (
                    <PhaseProgress today={today} startDate={anchorById[p.starts]?.date ?? today} endDate={endDate} />
                  )}
                </div>

                {/* Milestones inside this phase */}
                {phaseEntries.map((e, j) => {
                  const prev = j > 0 ? phaseEntries[j - 1] : null;
                  const daysFromPrev = prev ? daysBetween(prev.date, e.date) : 0;
                  return (
                    <div key={j}>
                      {prev && daysFromPrev > 0 && (
                        <div className="text-[10px] text-stone-400 mb-1.5 flex items-center gap-1">
                          <span className="block w-3 h-px bg-stone-300" />
                          + {daysFromPrev} {daysFromPrev === 1 ? "day" : "days"}
                        </div>
                      )}
                      <div
                        className={
                          "inline-block px-2.5 py-1.5 rounded border max-w-full " +
                          milestoneTone(e.kind)
                        }
                      >
                        <div className="text-sm font-medium leading-snug break-words">{e.label}</div>
                        <div className="text-[11px] opacity-70 mt-0.5">{formatLongDate(e.date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-stone-200 pt-3 text-[11px] text-stone-500">
        <span className="font-medium text-stone-700">Stripe colour</span> tracks phase progression — detox (P2–P4) is the bold dark green stretch.{" "}
        <span className="font-medium text-stone-700">Milestone tone:</span> dark green = today, rose = pregnancy-derived, amber = review, white = anchor.
      </div>
    </div>
  );
}

function PhaseProgress({
  today,
  startDate,
  endDate,
}: {
  today: string;
  startDate: string;
  endDate: string;
}) {
  const totalDays = Math.max(1, daysBetween(startDate, endDate));
  const elapsed = Math.max(0, Math.min(totalDays, daysBetween(startDate, today)));
  const remaining = Math.max(0, totalDays - elapsed);
  const pct = Math.round((elapsed / totalDays) * 100);
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-stone-600">
        <span>
          Day {elapsed + 1} of {totalDays} · {pct}%
        </span>
        <span>{remaining}d remaining</span>
      </div>
      <div className="mt-1 h-1.5 bg-stone-200 rounded overflow-hidden">
        <div className="h-full bg-emerald-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function milestoneTone(kind: string): string {
  switch (kind) {
    case "today":
      return "bg-emerald-900 text-white border-emerald-900";
    case "pregnancy":
      return "bg-rose-50 border-rose-300 text-rose-900";
    case "review":
      return "bg-amber-50 border-amber-300 text-amber-900";
    default:
      return "bg-white border-stone-300 text-stone-800";
  }
}
