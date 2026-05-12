// Shared type names used across the app. Keep this tiny — most config is
// loaded as untyped JSON and consumed with light shape assumptions.

export type LogEntry = {
  id: string;
  entry_date: string;
  [key: string]: any;
};

export type FormConfig = {
  title: string;
  fields: FieldConfig[];
  [key: string]: any;
};

export type FieldConfig = {
  id: string;
  type: string;
  label: string;
  [key: string]: any;
};

export type Phase = {
  id: string;
  name: string;
  starts: string;
  ends: string | null;
  focus: string;
  habit_2_log_cadence: string;
  depressive_load_cadence: "bi-daily" | "daily";
};

export type Anchor = {
  id: string;
  date: string;
  label: string;
};

export type Outcome = {
  id: string;
  name: string;
  summary: string;
  kpis: string[];
  status_rules: { on_track: string; watching: string; off_track: string };
};

export type Kpi = {
  id: string;
  label: string;
  scale: string;
  source: string;
  field: string;
  direction?: "lower_is_better" | "higher_is_better";
  thresholds?: { escalate_at?: number; watch_at?: number };
  outcomes: string[];
  clinical_rule?: string;
  options?: any;
};
