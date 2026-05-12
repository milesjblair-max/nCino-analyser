# Changelog

Append-only. Newest entries on top. Each entry: date, what changed, why (in one sentence if needed).

## 2026-05-12 — Initial build

- Scaffolded Vite + React + TypeScript + Tailwind project at repo root.
- Wrote configuration in JSON: `outcomes.json`, `kpi-definitions.json`, `timeline.json`, and four form schemas under `src/config/forms/`.
- Built four pages: Plan (current phase, outcomes, KPI snapshot), Log (bi-daily / weekly / monthly / daily-detox forms), Dashboard (sparklines, Habit 2 verification rate, internal-question audit), Settings (export, two-step reset).
- Storage: localStorage with one key per log type; export-all-to-JSON and two-step reset live in Settings.
- Form renderer reads JSON schemas — adding a field means editing the JSON.
- See `SYSTEM_MAP.md` for the file-by-file map and the list of defaults chosen where the plan was ambiguous.
