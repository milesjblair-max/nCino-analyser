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
}

export function newId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
