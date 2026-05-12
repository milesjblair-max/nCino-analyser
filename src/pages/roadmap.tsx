// Visual roadmap. Left column = phase bands sized proportionally to their
// duration. Right column = milestone dots anchored to their date. Both
// columns share a single time axis (today at top → latest event at bottom).
//
// To adjust: shading per phase lives in PHASE_BG below; total visual
// height lives in TOTAL_HEIGHT_PX; the time range is computed from
// timeline.json (today to latest anchor/derived event).

import {
  allAnchors,
  allDerivedEvents,
  allPhases,
  daysBetween,
  derivedEventDate,
  formatLongDate,
  parseDate,
  todayString,
} from "../lib/phase";
import type { Anchor } from "../lib/types";

const TOTAL_HEIGHT_PX = 1500;
const MIN_PHASE_HEIGHT_PX = 32;

const PHASE_BG: Record<string, string> = {
  P0: "bg-emerald-50 text-stone-800 border-emerald-200",
  P1: "bg-emerald-100 text-stone-800 border-emerald-200",
  P2: "bg-emerald-700 text-white border-emerald-800",
  P3: "bg-emerald-800 text-white border-emerald-900",
  P4: "bg-emerald-600 text-white border-emerald-700",
  P5: "bg-emerald-900 text-white border-emerald-950",
  P6: "bg-emerald-50 text-stone-800 border-emerald-200",
};

export function RoadmapPage() {
  const today = todayString();
  const phases = allPhases();
  const anchors = allAnchors();
  const derived = allDerivedEvents();

  function anchorDateById(id: string): string {
    return anchors.find((a) => a.id === id)?.date ?? today;
  }

  // Range: today → latest known event date.
  const allDates = [
    today,
    ...anchors.map((a) => a.date),
    ...derived.map((e) => derivedEventDate(e)),
  ].sort();
  const endDate = allDates[allDates.length - 1];
  const totalDays = Math.max(1, daysBetween(today, endDate));

  function pxFromTop(date: string): number {
    const days = Math.max(0, daysBetween(today, date));
    return (days / totalDays) * TOTAL_HEIGHT_PX;
  }

  // Phases clipped to the [today, end] window.
  const visiblePhases = phases
    .map((p) => {
      const start = anchorDateById(p.starts);
      const end = p.ends ? anchorDateById(p.ends) : endDate;
      return { phase: p, start, end };
    })
    .filter(({ end }) => parseDate(end).getTime() > parseDate(today).getTime());

  // Milestones in the window (today forward).
  const milestones = [
    ...anchors.map((a) => ({ date: a.date, label: a.label, kind: "anchor" as const })),
    ...derived.map((e) => ({
      date: derivedEventDate(e),
      label: e.label,
      kind: e.kind,
    })),
  ]
    .filter((m) => parseDate(m.date).getTime() >= parseDate(today).getTime())
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Roadmap</h2>
        <p className="text-xs text-stone-500 mt-1">
          {formatLongDate(today)} → {formatLongDate(endDate)} · {totalDays} days · vertically to scale
        </p>
      </div>

      <div className="flex gap-2">
        {/* Left column: phase bands */}
        <div className="relative flex-shrink-0" style={{ width: "38%", maxWidth: 200, height: TOTAL_HEIGHT_PX }}>
          <div className="absolute -top-3 left-0 right-0 text-[10px] text-stone-500 text-center">
            Today
          </div>
          {visiblePhases.map(({ phase, start, end }) => {
            const top = pxFromTop(start);
            const naturalHeight = pxFromTop(end) - top;
            const height = Math.max(naturalHeight, MIN_PHASE_HEIGHT_PX);
            return (
              <div
                key={phase.id}
                className={
                  "absolute left-0 right-0 px-2 py-1 border-y overflow-hidden " +
                  (PHASE_BG[phase.id] ?? "bg-stone-100 text-stone-800 border-stone-200")
                }
                style={{ top, height }}
              >
                <div className="text-[11px] font-semibold leading-tight">{phase.name}</div>
                <div className="text-[9px] opacity-80 leading-tight">
                  {formatLongDate(start)}
                  <br />→ {formatLongDate(end)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: milestone dots + labels */}
        <div className="relative flex-1 min-w-0" style={{ height: TOTAL_HEIGHT_PX }}>
          {/* Vertical spine */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-stone-200" />
          {milestones.map((m, i) => {
            const top = pxFromTop(m.date);
            const tone =
              m.kind === "pregnancy"
                ? "bg-rose-100 border-rose-300 text-rose-900"
                : m.kind === "review"
                ? "bg-amber-100 border-amber-300 text-amber-900"
                : "bg-white border-stone-300 text-stone-800";
            return (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-start gap-1"
                style={{ top, transform: "translateY(-6px)" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full border-2 border-emerald-900 bg-white flex-shrink-0 mt-0.5 ml-[-5px]"
                />
                <div className={"text-[10px] px-1.5 py-0.5 rounded border min-w-0 break-words " + tone}>
                  <div className="font-medium leading-tight">{m.label}</div>
                  <div className="text-[9px] opacity-70 leading-tight">{formatLongDate(m.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-stone-200 pt-3 text-[11px] text-stone-500">
        <span className="font-medium text-stone-700">Reading this:</span> phase block height ≈ phase duration.
        Detox phases (P2–P4) shown in solid dark green. Milestones with rose tone are pregnancy-derived; amber tone is the Day 180 review.
      </div>
    </div>
  );
}
