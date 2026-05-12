// localStorage wrapper. One key per log type plus one config-overrides key.
// All log lists are arrays of entries with an id and entry_date.
// Read whatever-shape JSON via getRaw / setRaw if you need it.

import type { LogEntry } from "./types";

export const KEYS = {
  biDaily: "bi_daily_logs",
  weekly: "weekly_syntheses",
  monthly: "monthly_reviews",
  dailyDetox: "daily_detox_logs",
  configOverrides: "system_config_overrides",
} as const;

// Tracked separately so a restore from JSON doesn't reset the timestamp.
export const META_KEYS = {
  lastExport: "meta_last_export_iso",
} as const;

export type LogKey = typeof KEYS[keyof typeof KEYS];

export function getLogs(key: LogKey): LogEntry[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setLogs(key: LogKey, logs: LogEntry[]) {
  localStorage.setItem(key, JSON.stringify(logs));
}

export function appendLog(key: LogKey, entry: LogEntry) {
  const logs = getLogs(key);
  logs.push(entry);
  setLogs(key, logs);
}

export function deleteLog(key: LogKey, id: string) {
  setLogs(
    key,
    getLogs(key).filter((l) => l.id !== id),
  );
}

export function getRaw<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setRaw(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Export everything (logs + overrides) as a single JSON blob for download.
export function exportAll(): string {
  const dump: Record<string, unknown> = { exported_at: new Date().toISOString() };
  for (const key of Object.values(KEYS)) {
    dump[key] = getRaw(key, null);
  }
  return JSON.stringify(dump, null, 2);
}

// Reset clears every key this app owns. Caller is responsible for the
// two-step confirmation flow.
export function resetAll() {
  for (const key of Object.values(KEYS)) {
    localStorage.removeItem(key);
  }
  for (const key of Object.values(META_KEYS)) {
    localStorage.removeItem(key);
  }
}

export function newId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Stamp the last export so we can nag the user when overdue.
export function markExported() {
  localStorage.setItem(META_KEYS.lastExport, new Date().toISOString());
}

export function getLastExportIso(): string | null {
  return localStorage.getItem(META_KEYS.lastExport);
}

export function daysSinceLastExport(): number | null {
  const iso = getLastExportIso();
  if (!iso) return null;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

// Replace local data from a JSON dump (the one exportAll() produces).
// Returns the number of keys restored and any errors encountered.
export function importAll(json: string): { restored: number; errors: string[] } {
  const errors: string[] = [];
  let restored = 0;
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { restored: 0, errors: ["File is not valid JSON."] };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { restored: 0, errors: ["File does not contain an object."] };
  }
  for (const key of Object.values(KEYS)) {
    const v = parsed[key];
    if (v === undefined) continue;
    if (v === null) {
      localStorage.removeItem(key);
      restored += 1;
      continue;
    }
    try {
      localStorage.setItem(key, JSON.stringify(v));
      restored += 1;
    } catch (e) {
      errors.push(`Could not restore ${key}: ${String(e)}`);
    }
  }
  return { restored, errors };
}
