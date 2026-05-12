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

// Logging stats. Bi-daily logs are expected every 2 days; we compute how
// many are missing in the last `windowDays` and per-day status for a grid.
export type DayStatus = "logged" | "covered" | "missed" | "empty";
export type LoggingStats = {
  windowDays: number;
  loggedInWindow: number;
  expectedInWindow: number;
  missedInWindow: number;
  daysSinceLast: number | null;
  currentStreak: number;
  grid: { date: string; daysAgo: number; status: DayStatus }[];
};

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function loggingStats(windowDays = 28): LoggingStats {
  const now = new Date();
  const biDaily = getLogs(KEYS.biDaily);
  const daily = getLogs(KEYS.dailyDetox);

  const loggedDates = new Set<string>([
    ...biDaily.map((l) => l.entry_date).filter(Boolean),
    ...daily.map((l) => l.entry_date).filter(Boolean),
  ]);

  const allBiDaily = biDaily
    .map((l) => l.entry_date)
    .filter(Boolean)
    .sort();

  const firstBiDailyMs = allBiDaily.length ? new Date(allBiDaily[0] + "T00:00:00").getTime() : null;
  const lastBiDailyMs = allBiDaily.length ? new Date(allBiDaily[allBiDaily.length - 1] + "T00:00:00").getTime() : null;

  // Days since last bi-daily.
  let daysSinceLast: number | null = null;
  if (lastBiDailyMs != null) {
    daysSinceLast = Math.max(0, Math.floor((now.getTime() - lastBiDailyMs) / (1000 * 60 * 60 * 24)));
  }

  // Bi-daily logs that fall in the window.
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - windowDays);
  const inWindow = biDaily.filter((l) => {
    if (!l.entry_date) return false;
    return new Date(l.entry_date + "T00:00:00").getTime() >= cutoff.getTime();
  });

  // Expected count: the window is windowDays long; one log every 2 days.
  // But until you start logging, "missed" doesn't make sense — so cap
  // expected at days_since_first_log/2.
  const daysFromFirst = firstBiDailyMs == null
    ? 0
    : Math.floor((now.getTime() - firstBiDailyMs) / (1000 * 60 * 60 * 24));
  const expected = Math.floor(Math.min(windowDays, daysFromFirst) / 2);
  const missed = Math.max(0, expected - inWindow.length);

  // Build per-day grid (oldest first).
  const grid: LoggingStats["grid"] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = isoDate(d);
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    const prevStr = isoDate(prev);
    const dMs = new Date(dateStr + "T00:00:00").getTime();

    let status: DayStatus;
    if (firstBiDailyMs == null || dMs < firstBiDailyMs) {
      status = "empty";
    } else if (loggedDates.has(dateStr)) {
      status = "logged";
    } else if (loggedDates.has(prevStr)) {
      status = "covered";
    } else {
      status = "missed";
    }
    grid.push({ date: dateStr, daysAgo: i, status });
  }

  // Current streak: how many trailing (most-recent) grid entries are logged or covered.
  let streak = 0;
  for (let i = grid.length - 1; i >= 0; i--) {
    if (grid[i].status === "logged" || grid[i].status === "covered") streak += 1;
    else break;
  }

  return {
    windowDays,
    loggedInWindow: inWindow.length,
    expectedInWindow: expected,
    missedInWindow: missed,
    daysSinceLast,
    currentStreak: streak,
    grid,
  };
}

// Status counts across all KPIs that have thresholds.
export function statusCounts(): Record<KpiStatus, number> {
  const out: Record<KpiStatus, number> = { green: 0, amber: 0, red: 0, unknown: 0 };
  for (const k of allKpis()) {
    if (!k.thresholds && !k.direction) continue;
    out[thresholdStatus(k.id)] += 1;
  }
  return out;
}
