// Top-level app shell. Holds the active tab and renders one page at a time.
// No router. To add a tab: add an id to TabBar's TABS and a case here.

import { useState } from "react";
import { TabBar, type TabId } from "./components/tab-bar";
import { PlanPage } from "./pages/plan";
import { RoadmapPage } from "./pages/roadmap";
import { TimelinePage } from "./pages/timeline";
import { LogPage } from "./pages/log";
import { DashboardPage } from "./pages/dashboard";
import { SettingsPage } from "./pages/settings";

export default function App() {
  const [tab, setTab] = useState<TabId>("plan");

  return (
    <div className="min-h-full flex flex-col overflow-x-hidden">
      <header className="bg-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold">Behaviour Tracker</h1>
          <p className="text-xs text-emerald-100/80">Personal. Local. The artefact is the modification loop.</p>
        </div>
      </header>
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
        localStorage only · export from Settings · open the project in Claude Code to modify
      </footer>
    </div>
  );
}
