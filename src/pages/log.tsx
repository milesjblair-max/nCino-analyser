// Log page. Three buttons → renders the corresponding form. A daily mini-form
// appears when the current phase has depressive_load_cadence === "daily".
// On submit, appends entry to localStorage under the right key.

import { useState } from "react";
import { FormRenderer } from "../components/form-renderer";
import biDaily from "../config/forms/bi-daily.json";
import weekly from "../config/forms/weekly.json";
import monthly from "../config/forms/monthly.json";
import dailyDetox from "../config/forms/daily-detox.json";
import { KEYS, appendLog, newId } from "../lib/storage";
import { isDailyDepressiveLoadDay, todayString } from "../lib/phase";
import type { FormConfig } from "../lib/types";

type Form = "bi-daily" | "weekly" | "monthly" | "daily-detox" | null;

export function LogPage() {
  const [active, setActive] = useState<Form>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const showDailyMini = isDailyDepressiveLoadDay();

  function save(formKey: keyof typeof KEYS, values: Record<string, any>) {
    const entry: Record<string, any> = { id: newId(), ...values };
    if (!entry.entry_date) entry.entry_date = todayString();
    appendLog(KEYS[formKey], entry as any);
    setSavedMessage("Saved.");
    setActive(null);
    setTimeout(() => setSavedMessage(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Btn label="Bi-daily log" active={active === "bi-daily"} onClick={() => setActive("bi-daily")} />
        <Btn label="Weekly synthesis" active={active === "weekly"} onClick={() => setActive("weekly")} />
        <Btn label="Monthly review" active={active === "monthly"} onClick={() => setActive("monthly")} />
        {showDailyMini && (
          <Btn
            label="Daily depressive-load (detox)"
            active={active === "daily-detox"}
            onClick={() => setActive("daily-detox")}
          />
        )}
      </div>

      {savedMessage && <div className="text-sm text-emerald-700">{savedMessage}</div>}

      {active === "bi-daily" && (
        <FormCard config={biDaily as FormConfig} onSubmit={(v) => save("biDaily", v)} />
      )}
      {active === "weekly" && (
        <FormCard config={weekly as FormConfig} onSubmit={(v) => save("weekly", v)} />
      )}
      {active === "monthly" && (
        <FormCard config={monthly as FormConfig} onSubmit={(v) => save("monthly", v)} />
      )}
      {active === "daily-detox" && (
        <FormCard config={dailyDetox as FormConfig} onSubmit={(v) => save("dailyDetox", v)} />
      )}

      {active === null && (
        <div className="text-sm text-stone-500">
          Choose a form above. {showDailyMini && "Daily depressive-load log is showing because the current phase requires daily tracking."}
        </div>
      )}
    </div>
  );
}

function Btn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded border text-sm " +
        (active
          ? "bg-stone-900 text-white border-stone-900"
          : "bg-white text-stone-800 border-stone-300 hover:border-stone-500")
      }
    >
      {label}
    </button>
  );
}

function FormCard({ config, onSubmit }: { config: FormConfig; onSubmit: (v: any) => void }) {
  return (
    <div className="border border-stone-300 rounded p-5 bg-white">
      <h2 className="text-base font-semibold text-stone-900 mb-4">{config.title}</h2>
      <FormRenderer config={config} onSubmit={onSubmit} initial={{ entry_date: todayString() }} />
    </div>
  );
}
