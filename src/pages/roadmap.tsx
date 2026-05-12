// Event-based roadmap. Vertical list of milestones, each in its own row,
// with a continuous phase-colour stripe down the left so the eye can follow
// phase progression. Time gaps between events are shown as small "+ N days"
// labels instead of literal empty space — earlier versions used strict
// proportional spacing which left the post-detox months mostly blank.
//
// To change phase colours: edit PHASE_STRIPE. To change milestone tones:
// edit milestoneTone(). To add a new event: edit timeline.json — anything
// added there flows in automatically.

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
  kind: "today" | "anchor" | "phase-start" | string;
  isPhaseStart: boolean;
  phaseId: string;
};

export function RoadmapPage() {
  const today = todayString();
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

  const todayMs = parseDate(today).getTime();

  const entries: Entry[] = [
    {
      date: today,
      label: "Today",
      kind: "today",
      isPhaseStart: false,
      phaseId: currentPhase(today).id,
    },
    ...anchors
      .filter((a) => parseDate(a.date).getTime() > todayMs)
      .map<Entry>((a) => ({
        date: a.date,
        label: a.label,
        kind: phaseStartAnchorIds.has(a.id) ? "phase-start" : "anchor",
        isPhaseStart: phaseStartAnchorIds.has(a.id),
        phaseId: phaseAtDate(a.date).id,
      })),
    ...derived
      .map<Entry>((e) => {
        const d = derivedEventDate(e);
        return {
          date: d,
          label: e.label,
          kind: e.kind,
          isPhaseStart: false,
          phaseId: phaseAtDate(d).id,
        };
      })
      .filter((e) => parseDate(e.date).getTime() > todayMs),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const lastEntry = entries[entries.length - 1];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Roadmap</h2>
        <p className="text-xs text-stone-500 mt-1">
          {formatLongDate(today)} → {formatLongDate(lastEntry.date)} ·
          {" "}colour stripe on the left tracks phase progression. Time gaps shown as labels, not blank space.
        </p>
      </div>

      <ol>
        {entries.map((e, i) => {
          const prev = i > 0 ? entries[i - 1] : null;
          const daysFromPrev = prev ? daysBetween(prev.date, e.date) : 0;
          const phaseColor = PHASE_STRIPE[e.phaseId] ?? "bg-stone-200";
          const phase = phases.find((p) => p.id === e.phaseId);

          return (
            <li key={i} className="flex gap-3 items-stretch">
              <div className={"w-2 flex-shrink-0 " + phaseColor} />
              <div className="flex-1 min-w-0 py-3">
                {prev && daysFromPrev > 0 && (
                  <div className="text-[10px] text-stone-400 mb-2 flex items-center gap-1">
                    <span className="block w-3 h-px bg-stone-300" />
                    + {daysFromPrev} {daysFromPrev === 1 ? "day" : "days"}
                  </div>
                )}
                {e.isPhaseStart && phase && (
                  <div className="text-[10px] uppercase tracking-wider text-emerald-900 font-semibold mb-1">
                    {phase.name}
                  </div>
                )}
                <div className={"inline-block px-2.5 py-1.5 rounded border max-w-full " + milestoneTone(e.kind)}>
                  <div className="text-sm font-medium leading-snug break-words">{e.label}</div>
                  <div className="text-[11px] opacity-70 mt-0.5">{formatLongDate(e.date)}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-stone-200 pt-3 text-[11px] text-stone-500 space-y-1">
        <div>
          <span className="font-medium text-stone-700">Stripe colour:</span>{" "}
          P0/P1 light · P2–P4 detox dark green · P6 re-entry light.
        </div>
        <div>
          <span className="font-medium text-stone-700">Milestone tone:</span>{" "}
          rose = pregnancy-derived · amber = Day 180 review · white = anchor · green = phase start.
        </div>
      </div>
    </div>
  );
}

function milestoneTone(kind: string): string {
  switch (kind) {
    case "today":
      return "bg-emerald-900 text-white border-emerald-900";
    case "phase-start":
      return "bg-emerald-50 border-emerald-300 text-emerald-900";
    case "pregnancy":
      return "bg-rose-50 border-rose-300 text-rose-900";
    case "review":
      return "bg-amber-50 border-amber-300 text-amber-900";
    default:
      return "bg-white border-stone-300 text-stone-800";
  }
}
