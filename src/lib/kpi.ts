// KPI calculations. Pull entries from localStorage, extract series, compute
// most recent value, simple thresholded status. Used by Plan + Dashboard.

import kpiDefs from "../config/kpi-definitions.json";
import outcomes from "../config/outcomes.json";
import { KEYS, getLogs } from "./storage";
import type { Kpi, Outcome } from "./types";

export function allKpis(): Kpi[] {
  return kpiDefs.kpis as Kpi[];
}

export function kpiById(id: string): Kpi | undefined {
  return (kpiDefs.kpis as Kpi[]).find((k) => k.id === id);
}

export function allOutcomes(): Outcome[] {
  return outcomes.outcomes as Outcome[];
}

// Build a numeric time series for score-style KPIs by reading the named
// field off every bi-daily (and daily-detox, for depressive_load) entry.
// Returns [{ date, value }] sorted ascending.
export function numericSeries(kpiId: string): { date: string; value: number }[] {
  const k = kpiById(kpiId);
  if (!k) return [];
  const series: { date: string; value: number }[] = [];

  if (k.source === "bi-daily" || k.source === "bi-daily-or-daily") {
    for (const e of getLogs(KEYS.biDaily)) {
      const v = e[k.field];
      if (typeof v === "number") series.push({ date: e.entry_date, value: v });
    }
  }
  if (k.source === "bi-daily-or-daily") {
    for (const e of getLogs(KEYS.dailyDetox)) {
      const v = e[k.field];
      if (typeof v === "number") series.push({ date: e.entry_date, value: v });
    }
  }
  return series.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function lastN<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

export function mostRecent(kpiId: string): number | null {
  const s = numericSeries(kpiId);
  return s.length ? s[s.length - 1].value : null;
}

// Average over the most recent `days` calendar days.
export function recentAverage(kpiId: string, days: number): number | null {
  const s = numericSeries(kpiId);
  if (!s.length) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = s.filter((p) => new Date(p.date + "T00:00:00") >= cutoff);
  if (!recent.length) return null;
  return recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
}

// Status: green / amber / red driven by thresholds. Direction matters:
// for lower_is_better, exceeding escalate_at is red.
export type KpiStatus = "green" | "amber" | "red" | "unknown";

export function thresholdStatus(kpiId: string): KpiStatus {
  const k = kpiById(kpiId);
  if (!k || !k.thresholds) return "unknown";
  const v = mostRecent(kpiId);
  if (v == null) return "unknown";
  const { escalate_at, watch_at } = k.thresholds;
  if (k.direction === "lower_is_better") {
    if (escalate_at != null && v >= escalate_at) return "red";
    if (watch_at != null && v >= watch_at) return "amber";
    return "green";
  }
  // higher_is_better (presence)
  if (watch_at != null && v < watch_at) return "amber";
  return "green";
}

// Habit 2 7-day verification rate across all stored weekly syntheses.
export function habit2VerificationRate(): { rate: number | null; total: number; yes: number } {
  const weeklies = getLogs(KEYS.weekly);
  let total = 0;
  let yes = 0;
  for (const w of weeklies) {
    const v = w.habit_2_verifications;
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      total += 1;
      if (item.verified === true || item.verified === "yes") yes += 1;
    }
  }
  return { rate: total ? yes / total : null, total, yes };
}

// Outcome roll-up: a coarse status derived from its KPIs' threshold statuses.
// Red beats amber beats green. Unknown if no KPIs have data yet.
export function outcomeStatus(o: Outcome): KpiStatus {
  let worst: KpiStatus = "unknown";
  for (const id of o.kpis) {
    const s = thresholdStatus(id);
    if (s === "red") return "red";
    if (s === "amber") worst = worst === "green" ? "amber" : worst === "unknown" ? "amber" : worst;
    if (s === "green" && worst === "unknown") worst = "green";
  }
  return worst;
}
