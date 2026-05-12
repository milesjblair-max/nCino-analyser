// Settings. Export everything to a JSON file. Reset behind two-step confirm.
// No other settings exist — the rest is config files edited directly.

import { useState } from "react";
import { KEYS, exportAll, getLogs, resetAll } from "../lib/storage";

export function SettingsPage() {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);

  function download() {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `behaviour-tracker-export-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function startReset() {
    setConfirmingReset(true);
    setResetCountdown(5);
    const i = setInterval(() => {
      setResetCountdown((c) => {
        if (c == null) return null;
        if (c <= 1) {
          clearInterval(i);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function doReset() {
    resetAll();
    setConfirmingReset(false);
    setResetCountdown(null);
    location.reload();
  }

  const counts = {
    "Bi-daily logs": getLogs(KEYS.biDaily).length,
    "Weekly syntheses": getLogs(KEYS.weekly).length,
    "Monthly reviews": getLogs(KEYS.monthly).length,
    "Daily detox logs": getLogs(KEYS.dailyDetox).length,
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Data on this browser</h2>
        <div className="border border-stone-300 rounded bg-white divide-y divide-stone-200">
          {Object.entries(counts).map(([label, n]) => (
            <div key={label} className="px-4 py-2 flex items-center justify-between text-sm">
              <span className="text-stone-700">{label}</span>
              <span className="font-mono text-stone-900">{n}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Storage lives in this browser only. Clear your browser data and it's gone. Export during weekly synthesis.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Export</h2>
        <button
          onClick={download}
          className="px-4 py-2 rounded bg-emerald-900 text-white text-sm hover:bg-emerald-800"
        >
          Download all data as JSON
        </button>
      </section>

      <section>
        <h2 className="text-base font-semibold text-rose-800 mb-2">Reset</h2>
        <p className="text-xs text-stone-500 mb-2">
          Wipes every log on this browser. Cannot be undone. Export first.
        </p>
        {!confirmingReset && (
          <button
            onClick={startReset}
            className="px-4 py-2 rounded border border-rose-400 text-rose-700 text-sm hover:bg-rose-50"
          >
            Reset all data…
          </button>
        )}
        {confirmingReset && (
          <div className="border border-rose-300 bg-rose-50 rounded p-3 space-y-2">
            <p className="text-sm text-rose-900">
              Confirm wipe. Button activates after a short pause.
            </p>
            <div className="flex gap-2">
              <button
                disabled={(resetCountdown ?? 1) > 0}
                onClick={doReset}
                className="px-3 py-1.5 rounded bg-rose-700 text-white text-sm disabled:opacity-50"
              >
                {resetCountdown && resetCountdown > 0 ? `Wait ${resetCountdown}s…` : "Yes — wipe everything"}
              </button>
              <button
                onClick={() => {
                  setConfirmingReset(false);
                  setResetCountdown(null);
                }}
                className="px-3 py-1.5 rounded border border-stone-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Modifying this system</h2>
        <p className="text-sm text-stone-700">
          Open this project in Claude Code and describe the change in plain language. The agent finds the file, edits it,
          updates <code className="text-xs bg-stone-100 px-1 rounded">SYSTEM_MAP.md</code> and{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">CHANGELOG.md</code>, and confirms what changed. See
          README.md for example prompts.
        </p>
      </section>
    </div>
  );
}
