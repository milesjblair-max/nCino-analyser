// Phase detection. Given today and timeline.json, return the current phase
// plus distances to the nearest anchors. Phases are intervals between
// anchor ids; the last phase has ends=null and extends forever.

import timeline from "../config/timeline.json";
import type { Anchor, Phase } from "./types";

const anchorById: Record<string, Anchor> = Object.fromEntries(
  (timeline.anchors as Anchor[]).map((a) => [a.id, a]),
);

export function getAnchor(id: string): Anchor | undefined {
  return anchorById[id];
}

export function allAnchors(): Anchor[] {
  return timeline.anchors as Anchor[];
}

export function allPhases(): Phase[] {
  return timeline.phases as Phase[];
}

export function dayMs() {
  return 1000 * 60 * 60 * 24;
}

export function parseDate(d: string): Date {
  return new Date(d + "T00:00:00");
}

export function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function currentPhase(today = todayString()): Phase {
  const t = parseDate(today).getTime();
  const phases = allPhases();
  for (const p of phases) {
    const start = parseDate(anchorById[p.starts].date).getTime();
    const end = p.ends ? parseDate(anchorById[p.ends].date).getTime() : Infinity;
    if (t >= start && t < end) return p;
  }
  // Before everything: return first. After everything: return last.
  const firstStart = parseDate(anchorById[phases[0].starts].date).getTime();
  if (t < firstStart) return phases[0];
  return phases[phases.length - 1];
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / dayMs());
}

export function nextAnchor(today = todayString()): Anchor | null {
  const t = parseDate(today).getTime();
  const upcoming = allAnchors()
    .filter((a) => parseDate(a.date).getTime() > t)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  return upcoming[0] ?? null;
}

export function lastAnchor(today = todayString()): Anchor | null {
  const t = parseDate(today).getTime();
  const past = allAnchors()
    .filter((a) => parseDate(a.date).getTime() <= t)
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
  return past[0] ?? null;
}

export function isDailyDepressiveLoadDay(today = todayString()): boolean {
  return currentPhase(today).depressive_load_cadence === "daily";
}

export type DerivedEvent = {
  id: string;
  from_anchor: string;
  offset_days: number;
  label: string;
  kind: string;
};

export function allDerivedEvents(): DerivedEvent[] {
  return (timeline as any).derived_events ?? [];
}

export function derivedEventDate(e: DerivedEvent): string {
  const a = anchorById[e.from_anchor];
  if (!a) return "";
  const d = parseDate(a.date);
  d.setDate(d.getDate() + e.offset_days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatLongDate(iso: string): string {
  const d = parseDate(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
