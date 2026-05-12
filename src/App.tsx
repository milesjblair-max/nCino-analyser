// Top-level app shell. Holds the active tab and renders one page at a time.
// No router. To add a tab: add an id to TabBar's TABS and a case here.

import { useState } from "react";
import { TabBar, type TabId } from "./components/tab-bar";
import { daysSinceLastExport } from "./lib/storage";
import { PlanPage } from "./pages/plan";
import { RoadmapPage } from "./pages/roadmap";
import { TimelinePage } from "./pages/timeline";
import { LogPage } from "./pages/log";
import { DashboardPage } from "./pages/dashboard";
import { SettingsPage } from "./pages/settings";

export default function App() {
  const [tab, setTab] = useState<TabId>("plan");

  // Show a small reminder when the backup is stale. Never backed up
  // counts as stale; > 7 days counts as stale.
  const daysSince = daysSinceLastExport();
  const backupStale = daysSince === null || daysSince > 7;

  return (
    <div className="min-h-full flex flex-col overflow-x-hidden">
      <header className="bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Behaviour Tracker</h1>
          <p className="text-xs text-emerald-100/80">Habits, scores, milestones — through the phases.</p>
        </div>
      </header>
      {backupStale && tab !== "settings" && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-900">
            <span>
              {daysSince === null
                ? "No backup yet. Save one to keep your data safe."
                : `Last backup was ${daysSince} days ago.`}
            </span>
            <button
              onClick={() => setTab("settings")}
              className="px-2 py-1 rounded bg-amber-900 text-white font-medium whitespace-nowrap"
            >
              Back up now
            </button>
          </div>
        </div>
      )}
      <TabBar active={tab} onChange={setTab} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        {tab === "plan" && <PlanPage />}
        {tab === "roadmap" && <RoadmapPage />}
        {tab === "timeline" && <TimelinePage />}
        {tab === "log" && <LogPage />}
        {tab === "dashboard" && <DashboardPage />}
        {tab === "settings" && <SettingsPage />}
      </main>
      <footer className="border-t border-stone-200 py-3 text-center text-xs text-stone-400">
        Data lives on this device. Back up regularly from Settings.
      </footer>
    </div>
  );
}
