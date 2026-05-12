// Renders a form from a JSON config. Holds form state internally; calls
// onSubmit with the assembled values. Each field type is handled inline —
// no abstraction. Add a new type by adding a case below and a definition
// in the form JSON.

import { useMemo, useState } from "react";
import type { FormConfig, FieldConfig } from "../lib/types";
import { KEYS, getLogs } from "../lib/storage";
import { numericSeries, lastN } from "../lib/kpi";
import { Sparkline } from "./sparkline";

type Values = Record<string, any>;

export function FormRenderer({
  config,
  onSubmit,
  initial = {},
}: {
  config: FormConfig;
  onSubmit: (values: Values) => void;
  initial?: Values;
}) {
  const [values, setValues] = useState<Values>(initial);

  function update(id: string, v: any) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  // For group_per_count fields with count_from === "habit_3_plus_4", we sum
  // habit_3_instances and habit_4_instances.
  function resolveCount(field: FieldConfig): number {
    const src = field.count_from;
    if (src === "habit_3_plus_4") {
      return (values.habit_3_instances || 0) + (values.habit_4_instances || 0);
    }
    return Number(values[src] || 0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
    setValues({});
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {config.fields.map((field) => (
        <Field
          key={field.id}
          field={field}
          value={values[field.id]}
          update={(v) => update(field.id, v)}
          resolveCount={resolveCount}
        />
      ))}
      <div className="pt-2">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-emerald-900 text-white text-sm font-medium hover:bg-emerald-800"
        >
          Save entry
        </button>
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  update,
  resolveCount,
}: {
  field: FieldConfig;
  value: any;
  update: (v: any) => void;
  resolveCount: (f: FieldConfig) => number;
}) {
  const label = (
    <label className="block text-sm font-medium text-stone-800 mb-1">
      {field.label}
      {field.required ? <span className="text-rose-600"> *</span> : null}
    </label>
  );
  const help = field.help ? (
    <p className="text-xs text-stone-500 mt-1">{field.help}</p>
  ) : null;

  switch (field.type) {
    case "date":
      return (
        <div>
          {label}
          <input
            type="date"
            className="border border-stone-300 rounded px-2 py-1 text-sm"
            value={value ?? ""}
            onChange={(e) => update(e.target.value)}
            required={field.required}
          />
          {help}
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            type="number"
            min={field.min}
            max={field.max}
            className="border border-stone-300 rounded px-2 py-1 text-sm w-24"
            value={value ?? ""}
            onChange={(e) => update(e.target.value === "" ? "" : Number(e.target.value))}
          />
          {help}
        </div>
      );

    case "score":
      return (
        <div>
          {label}
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: (field.max || 10) - (field.min || 1) + 1 }, (_, i) => i + (field.min || 1)).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update(n)}
                className={
                  "w-9 h-9 rounded text-sm border " +
                  (value === n
                    ? "bg-emerald-900 text-white border-emerald-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-emerald-700")
                }
              >
                {n}
              </button>
            ))}
          </div>
          {help}
        </div>
      );

    case "textarea":
      return (
        <div>
          {label}
          <textarea
            className="border border-stone-300 rounded px-2 py-1 text-sm w-full min-h-[60px]"
            value={value ?? ""}
            onChange={(e) => update(e.target.value)}
          />
          {help}
        </div>
      );

    case "radio":
      return (
        <div>
          {label}
          <div className="flex gap-2">
            {(field.options as string[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => update(opt)}
                className={
                  "px-3 py-1 rounded border text-sm " +
                  (value === opt
                    ? "bg-emerald-900 text-white border-emerald-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-emerald-700")
                }
              >
                {opt}
              </button>
            ))}
          </div>
          {help}
        </div>
      );

    case "checkbox":
      return (
        <div>
          <label className="flex items-center gap-2 text-sm text-stone-800">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => update(e.target.checked)}
            />
            {field.label}
          </label>
          {help}
        </div>
      );

    case "multiselect": {
      const selected: string[] = Array.isArray(value) ? value : [];
      const toggle = (v: string) => {
        if (selected.includes(v)) update(selected.filter((x) => x !== v));
        else update([...selected, v]);
      };
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {(field.options as { value: string; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={
                  "px-3 py-1 rounded border text-sm " +
                  (selected.includes(opt.value)
                    ? "bg-emerald-900 text-white border-emerald-900"
                    : "bg-white text-stone-700 border-stone-300 hover:border-emerald-700")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          {help}
        </div>
      );
    }

    case "group_per_count": {
      const count = resolveCount(field);
      if (count <= 0) {
        return (
          <div>
            {label}
            <p className="text-xs text-stone-400">(no instances logged above)</p>
          </div>
        );
      }
      const list: any[] = Array.isArray(value) ? value : [];
      const ensure = (i: number) => {
        while (list.length <= i) list.push({});
        return list;
      };
      return (
        <div>
          {label}
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="border border-stone-200 rounded p-3 bg-stone-50">
                <div className="text-xs text-stone-500 mb-2">Instance {i + 1}</div>
                {(field.fields as FieldConfig[]).map((sub) => (
                  <Field
                    key={sub.id}
                    field={sub}
                    value={(list[i] || {})[sub.id]}
                    update={(v) => {
                      const next = ensure(i).map((x) => ({ ...x }));
                      next[i] = { ...next[i], [sub.id]: v };
                      update(next);
                    }}
                    resolveCount={resolveCount}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "three_text": {
      const arr: string[] = Array.isArray(value) ? value : ["", "", ""];
      const setAt = (i: number, v: string) => {
        const next = [...arr];
        while (next.length < 3) next.push("");
        next[i] = v;
        update(next);
      };
      return (
        <div>
          {label}
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="text"
                placeholder={`Question ${i + 1}`}
                className="border border-stone-300 rounded px-2 py-1 text-sm w-full"
                value={arr[i] ?? ""}
                onChange={(e) => setAt(i, e.target.value)}
              />
            ))}
          </div>
          {help}
        </div>
      );
    }

    case "auto_verifications":
      return <Habit2Verifications field={field} value={value} update={update} />;

    case "trend_reflection":
      return <TrendReflection field={field} value={value} update={update} />;

    case "auto_metric":
      return <AutoMetric field={field} value={value} update={update} />;

    default:
      return (
        <div className="text-xs text-rose-600">
          Unknown field type: {field.type} ({field.id})
        </div>
      );
  }
}

// Pulls bi-daily logs from the last `lookback_days`, flattens any
// habit_2_details groups, and shows a yes/no toggle per instance.
function Habit2Verifications({
  field,
  value,
  update,
}: {
  field: FieldConfig;
  value: any;
  update: (v: any) => void;
}) {
  const lookback = field.lookback_days ?? 7;
  const candidates = useMemo(() => {
    const logs = getLogs(KEYS.biDaily);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lookback);
    const out: { logId: string; date: string; index: number; state?: string; insight?: string }[] = [];
    for (const log of logs) {
      const d = new Date(log.entry_date + "T00:00:00");
      if (d < cutoff) continue;
      const details = Array.isArray(log.habit_2_details) ? log.habit_2_details : [];
      details.forEach((dt: any, i: number) => {
        out.push({ logId: log.id, date: log.entry_date, index: i, state: dt?.state, insight: dt?.insight });
      });
    }
    return out;
  }, [lookback]);

  const list: any[] = Array.isArray(value) ? value : [];
  const findEntry = (logId: string, index: number) =>
    list.find((x) => x.logId === logId && x.index === index);

  function setVerified(logId: string, index: number, verified: boolean) {
    const next = list.filter((x) => !(x.logId === logId && x.index === index));
    next.push({ logId, index, verified });
    update(next);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-stone-800 mb-1">{field.label}</label>
      {candidates.length === 0 ? (
        <p className="text-xs text-stone-500">No Habit 2 instances logged in the past {lookback} days.</p>
      ) : (
        <ul className="space-y-2">
          {candidates.map((c) => {
            const entry = findEntry(c.logId, c.index);
            return (
              <li key={`${c.logId}_${c.index}`} className="border border-stone-200 rounded p-2 bg-stone-50">
                <div className="text-xs text-stone-500">
                  {c.date} · state: {c.state ?? "—"}
                </div>
                <div className="text-sm text-stone-800 mb-1">
                  {c.insight ? c.insight : <span className="text-stone-400 italic">no insight recorded</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerified(c.logId, c.index, true)}
                    className={
                      "px-2 py-0.5 rounded text-xs border " +
                      (entry?.verified === true
                        ? "bg-emerald-700 text-white border-emerald-700"
                        : "bg-white border-stone-300")
                    }
                  >
                    Acted within 7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerified(c.logId, c.index, false)}
                    className={
                      "px-2 py-0.5 rounded text-xs border " +
                      (entry?.verified === false
                        ? "bg-rose-700 text-white border-rose-700"
                        : "bg-white border-stone-300")
                    }
                  >
                    Did not act
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Sparkline of the last ~28 entries for the linked KPI plus a free-text
// reflection. The reflection is what we persist; the sparkline is read-only.
function TrendReflection({
  field,
  value,
  update,
}: {
  field: FieldConfig;
  value: any;
  update: (v: any) => void;
}) {
  const series = numericSeries(field.kpi);
  const recent = lastN(series, 28);
  const values = recent.map((p) => p.value);
  const text: string = typeof value === "object" && value ? value.reflection ?? "" : value ?? "";

  return (
    <div>
      <label className="block text-sm font-medium text-stone-800 mb-1">{field.label}</label>
      <div className="flex items-center gap-3 mb-2 text-stone-700">
        <Sparkline values={values} min={1} max={10} />
        <span className="text-xs text-stone-500">
          {values.length ? `${values.length} points · last ${values[values.length - 1]}` : "no data yet"}
        </span>
      </div>
      <textarea
        className="border border-stone-300 rounded px-2 py-1 text-sm w-full min-h-[60px]"
        placeholder="Reflection on this trend"
        value={text}
        onChange={(e) => update({ reflection: e.target.value })}
      />
    </div>
  );
}

// Read-only auto metric. Currently supports computed_habit_2_rate, which is
// the % of weekly synthesis verifications marked verified=true this month.
function AutoMetric({
  field,
  value: _value,
  update: _update,
}: {
  field: FieldConfig;
  value: any;
  update: (v: any) => void;
}) {
  let display = "—";
  if (field.source === "computed_habit_2_rate") {
    const weeklies = getLogs(KEYS.weekly);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    let total = 0;
    let yes = 0;
    for (const w of weeklies) {
      if (new Date(w.entry_date + "T00:00:00") < cutoff) continue;
      const v = w.habit_2_verifications;
      if (!Array.isArray(v)) continue;
      for (const item of v) {
        total += 1;
        if (item.verified === true) yes += 1;
      }
    }
    display = total ? `${Math.round((yes / total) * 100)}% (${yes}/${total})` : "no verifications yet";
  }
  return (
    <div>
      <label className="block text-sm font-medium text-stone-800 mb-1">{field.label}</label>
      <div className="text-sm text-stone-700 bg-stone-100 rounded px-2 py-1 inline-block">
        {display}
      </div>
    </div>
  );
}
