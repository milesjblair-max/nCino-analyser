// Forward-looking timeline view. Renders phases as cards, with the anchors
// and derived events that fall inside each phase nested underneath. Reads
// purely from src/config/timeline.json — to change a date or add a milestone,
// edit the JSON.

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
import type { DerivedEvent } from "../lib/phase";

type TimelineEntry = {
  date: string;
  label: string;
  kind: "anchor" | "derived";
  derivedKind?: string;
};

export function TimelinePage() {
  const today = todayString();
  const phases = allPhases();
  const current = currentPhase(today);

  // Collect all dated events (anchors + derived) and group them by the phase
  // whose interval contains them.
  const anchors = allAnchors();
  const derived = allDerivedEvents();

  const entries: TimelineEntry[] = [
    ...anchors.map((a) => ({ date: a.date, label: a.label, kind: "anchor" as const })),
    ...derived.map((e) => ({
      date: derivedEventDate(e),
      label: e.label,
      kind: "derived" as const,
      derivedKind: e.kind,
    })),
  ];

  function phaseRange(p: Phase): [number, number] {
    const start = parseDate(getAnchorDate(p.starts, anchors)).getTime();
    const end = p.ends ? parseDate(getAnchorDate(p.ends, anchors)).getTime() : Infinity;
    return [start, end];
  }

  function entriesInPhase(p: Phase): TimelineEntry[] {
    const [start, end] = phaseRange(p);
    return entries
      .filter((e) => {
        const t = parseDate(e.date).getTime();
        return t >= start && t < end;
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Timeline</h2>
        <p className="text-xs text-stone-500 mt-1">
          From today forward. Phases come from <code className="text-[10px] bg-stone-100 px-1 rounded">timeline.json</code>; pregnancy and birth dates are derived
          from the December attempt date plus a 1–2 month conception assumption and a 40-week gestation.
        </p>
      </div>

      <ol className="space-y-4">
        {phases.map((p) => {
          const isCurrent = p.id === current.id;
          const startDate = getAnchorDate(p.starts, anchors);
          const endDate = p.ends ? getAnchorDate(p.ends, anchors) : null;
          const startsInDays = daysBetween(today, startDate);
          const isPast = endDate ? parseDate(endDate).getTime() <= parseDate(today).getTime() : false;
          const inner = entriesInPhase(p);

          return (
            <li
              key={p.id}
              className={
                "border rounded p-4 " +
                (isCurrent
                  ? "border-stone-900 bg-white"
                  : isPast
                  ? "border-stone-200 bg-stone-50 opacity-70"
                  : "border-stone-300 bg-white")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-stone-900">{p.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {formatLongDate(startDate)}
                    {endDate ? <> → {formatLongDate(endDate)}</> : <> → indefinite</>}
                  </div>
                </div>
                <span
                  className={
                    "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border " +
                    (isCurrent
                      ? "border-stone-900 bg-stone-900 text-white"
                      : isPast
                      ? "border-stone-300 text-stone-500"
                      : "border-stone-300 text-stone-600")
                  }
                >
                  {isCurrent ? "current" : isPast ? "past" : `in ${startsInDays}d`}
                </span>
              </div>
              <p className="text-sm text-stone-700 mt-2">{p.focus}</p>
              <div className="text-[11px] text-stone-500 mt-1">
                Depressive-load cadence: <span className="font-medium">{p.depressive_load_cadence}</span>
              </div>

              {inner.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-stone-200 pt-3">
                  {inner.map((e, i) => (
                    <EventRow key={i} entry={e} today={today} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EventRow({ entry, today }: { entry: TimelineEntry; today: string }) {
  const days = daysBetween(today, entry.date);
  const isPast = days < 0;
  const tagColor =
    entry.kind === "derived" && entry.derivedKind === "pregnancy"
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : entry.kind === "derived" && entry.derivedKind === "review"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-stone-100 text-stone-700 border-stone-200";
  const tagLabel = entry.kind === "anchor" ? "anchor" : entry.derivedKind ?? "milestone";

  return (
    <li className="flex items-start justify-between gap-3 text-sm">
      <div className={isPast ? "text-stone-400" : "text-stone-800"}>
        <div className="font-medium">{entry.label}</div>
        <div className="text-xs text-stone-500">
          {formatLongDate(entry.date)}{" "}
          <span className="text-stone-400">
            · {isPast ? `${Math.abs(days)}d ago` : `in ${days}d`}
          </span>
        </div>
      </div>
      <span className={"text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border whitespace-nowrap " + tagColor}>
        {tagLabel}
      </span>
    </li>
  );
}

function getAnchorDate(id: string, anchors: Anchor[]): string {
  return anchors.find((a) => a.id === id)?.date ?? "";
}
