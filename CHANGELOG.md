# Changelog

Append-only. Newest entries on top. Each entry: date, what changed, why (in one sentence if needed).

## 2026-05-12 — Dark-green palette

- White-dominant theme with a dark forest-green header band (`emerald-900`).
- Active tab indicator, active form buttons, score selections, and submit buttons all use `emerald-900` with `emerald-800` hover.
- Hover borders on un-selected option chips tint to `emerald-700`.
- Status chips keep their semantic palette (emerald / amber / rose) so green/amber/red still read as on-track / watching / off-track.

## 2026-05-12 — Add Timeline tab

- New `src/pages/timeline.tsx`: phase-by-phase forward view, each card lists the anchors and derived events landing inside it. Current phase outlined; past phases dimmed.
- `timeline.json` gained `derived_events`: conception window (1- and 2-month assumptions), Day 180, and earliest/latest expected birth (40-week gestation).
- `src/lib/phase.ts` gained `allDerivedEvents`, `derivedEventDate`, `formatLongDate`.
- Tab order: Plan / **Timeline** / Log / Dashboard / Settings.

## 2026-05-12 — Initial build

- Scaffolded Vite + React + TypeScript + Tailwind project at repo root.
- Wrote configuration in JSON: `outcomes.json`, `kpi-definitions.json`, `timeline.json`, and four form schemas under `src/config/forms/`.
- Built four pages: Plan (current phase, outcomes, KPI snapshot), Log (bi-daily / weekly / monthly / daily-detox forms), Dashboard (sparklines, Habit 2 verification rate, internal-question audit), Settings (export, two-step reset).
- Storage: localStorage with one key per log type; export-all-to-JSON and two-step reset live in Settings.
- Form renderer reads JSON schemas — adding a field means editing the JSON.
- See `SYSTEM_MAP.md` for the file-by-file map and the list of defaults chosen where the plan was ambiguous.
