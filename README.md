# Behaviour Tracker

Personal, local, browser-only tracking app for the behavioural change plan. No
server, no auth, no cloud. The data lives in this browser's localStorage. The
app is the artefact; the modification loop with Claude Code is the actual product.

## Run

```
npm install
npm run dev
```

Open <http://localhost:5173>.

## Tabs

- **Plan** — current phase, anchor distances, the seven outcomes with rolled-up status from their KPIs.
- **Log** — bi-daily, weekly synthesis, monthly review forms. A daily depressive-load mini-form auto-appears during phases that require it (detox phases per `timeline.json`).
- **Dashboard** — KPI sparklines, Habit 2 7-day verification rate, scrollable internal-question audit (newest first).
- **Settings** — export everything as JSON, two-step reset.

## Export your data

Settings → Export → "Download all data as JSON". Do this during weekly synthesis. localStorage is fragile; clearing browser data wipes everything.

## Modifying the system

Open the project in Claude Code and describe what you want changed. Examples:

- _"Drop the most-automatic-moment field from the bi-daily log."_ → it edits `src/config/forms/bi-daily.json`.
- _"Change the depressive load escalation threshold from 7 to 8."_ → `src/config/kpi-definitions.json`.
- _"Add a sleep hours field (number, 0–12) to bi-daily."_ → adds to `src/config/forms/bi-daily.json`, optionally adds a KPI in `kpi-definitions.json` and wires it to an outcome.
- _"The Day 90 markers should include a wife transparency question."_ → `src/config/timeline.json` (`day_90_questions`).
- _"Add a daily 'wife transparency check' yes/no toggle in Phase 3."_ → would need a new mini-form schema + a phase-aware trigger; expect Claude to flag this as larger than a one-file edit.

Each time something changes, Claude updates `SYSTEM_MAP.md` and appends a line
to `CHANGELOG.md`, then explains in a paragraph what changed.

## File-by-file map

See `SYSTEM_MAP.md`.
