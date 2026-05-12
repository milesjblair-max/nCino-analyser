// Settings. Backup (share or download), restore from a JSON file, two-step
// reset. No accounts — the local-only design relies on you saving the JSON
// somewhere durable (iCloud Drive, email, etc.). The reminder banner in
// App.tsx nags when you haven't exported in a while.

import { useRef, useState } from "react";
import {
  KEYS,
  daysSinceLastExport,
  exportAll,
  getLogs,
  importAll,
  markExported,
  resetAll,
} from "../lib/storage";
import { todayString } from "../lib/phase";

export function SettingsPage() {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function makeJsonFile(): { file: File; filename: string; text: string } {
    const text = exportAll();
    const filename = `behaviour-tracker-${todayString()}.json`;
    const file = new File([text], filename, { type: "application/json" });
    return { file, filename, text };
  }

  function downloadJson(text: string, filename: string) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function shareBackup() {
    const { file, filename, text } = makeJsonFile();
    const nav: any = navigator;
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "Behaviour Tracker backup" });
        markExported();
        setMessage("Backup shared. Saved a copy to wherever you sent it.");
      } catch {
        // user cancelled — no message
      }
    } else {
      downloadJson(text, filename);
      markExported();
      setMessage("Backup downloaded. Save it to Files or iCloud Drive.");
    }
    setTimeout(() => setMessage(null), 4000);
  }

  function onChooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result ?? "");
      const result = importAll(json);
      if (result.errors.length) {
        setMessage("Restore failed: " + result.errors.join(" · "));
        return;
      }
      setMessage(`Restored ${result.restored} data sets. Reloading…`);
      setTimeout(() => location.reload(), 800);
    };
    reader.onerror = () => setMessage("Could not read that file.");
    reader.readAsText(file);
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
  const daysSince = daysSinceLastExport();

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm px-3 py-2">
          {message}
        </div>
      )}

      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Backup</h2>
        <p className="text-xs text-stone-600 mb-2">
          Your data lives in this browser. Save a backup somewhere durable (iCloud Drive, email to yourself, etc.) — at least weekly during synthesis.
        </p>
        <div className="text-xs text-stone-500 mb-3">
          Last backup:{" "}
          <span className="font-medium text-stone-700">
            {daysSince == null
              ? "never"
              : daysSince === 0
              ? "today"
              : daysSince === 1
              ? "yesterday"
              : `${daysSince} days ago`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={shareBackup}
            className="px-4 py-2 rounded bg-emerald-900 text-white text-sm hover:bg-emerald-800"
          >
            Save backup…
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded border border-stone-300 text-stone-800 text-sm hover:border-emerald-700"
          >
            Restore from file…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onChooseFile}
          />
        </div>
        <p className="text-[11px] text-stone-500 mt-2">
          On iPhone the Save button opens the Share Sheet — pick <span className="font-medium">Save to Files</span> (iCloud Drive folder is best). On desktop it downloads a JSON file.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-stone-900 mb-2">Make the storage stickier</h2>
        <p className="text-sm text-stone-700 mb-1">
          iOS Safari evicts site data after about 7 days of no visits — unless you add the site to your Home Screen first.
        </p>
        <ol className="text-xs text-stone-600 list-decimal pl-5 space-y-1">
          <li>Tap the Share icon in Safari's address bar.</li>
          <li>Pick <span className="font-medium">Add to Home Screen</span>.</li>
          <li>Open the tracker from the new icon. Data now persists like a native app.</li>
        </ol>
        <p className="text-[11px] text-stone-500 mt-2">
          This doesn't replace backups — if you delete the icon, the data still goes. But it stops the silent 7-day eviction.
        </p>
      </section>

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
      </section>

      <section>
        <h2 className="text-base font-semibold text-rose-800 mb-2">Reset</h2>
        <p className="text-xs text-stone-500 mb-2">
          Wipes every log on this browser. Cannot be undone. Save a backup first.
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
            <p className="text-sm text-rose-900">Confirm wipe. Button activates after a short pause.</p>
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
          Open this project in Claude Code and describe the change. The agent finds the file, edits it,
          updates <code className="text-xs bg-stone-100 px-1 rounded">SYSTEM_MAP.md</code> and{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">CHANGELOG.md</code>, and confirms what changed.
        </p>
      </section>
    </div>
  );
}
