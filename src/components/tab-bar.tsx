// Top tab bar. No router — App keeps a string state and renders one page.

export type TabId = "plan" | "timeline" | "log" | "dashboard" | "settings";

const TABS: { id: TabId; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "timeline", label: "Timeline" },
  { id: "log", label: "Log" },
  { id: "dashboard", label: "Dashboard" },
  { id: "settings", label: "Settings" },
];

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="max-w-4xl mx-auto flex gap-1 px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors " +
              (active === t.id
                ? "border-emerald-900 text-emerald-900"
                : "border-transparent text-stone-500 hover:text-stone-800")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
