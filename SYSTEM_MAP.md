# System map

Every file in this project, named for what it holds. If something is broken or
needs changing, find the file from the description and tell Claude Code to
change it.

## Configuration — edit JSON to change the plan

| File | What it holds |
|---|---|
| `src/config/outcomes.json` | The seven outcomes, the KPIs serving each, and status rules. |
| `src/config/kpi-definitions.json` | KPI metadata: label, scale, source form, threshold rules, direction, outcomes served. |
| `src/config/timeline.json` | Phase boundaries (anchor ids), anchor dates, depressive-load cadence per phase, Day 90 questions, derived events (conception/birth/Day 180). |
| `src/config/forms/bi-daily.json` | Bi-daily log field schema. |
| `src/config/forms/weekly.json` | Weekly synthesis schema. |
| `src/config/forms/monthly.json` | Monthly review schema. |
| `src/config/forms/daily-detox.json` | Daily depressive-load mini-form (active during detox phases). |

## App shell

| File | What it does |
|---|---|
| `src/main.tsx` | Mounts React app. No logic. |
| `src/App.tsx` | Holds active-tab state and switches between the four pages. |
| `src/index.css` | Tailwind import. Nothing else. |
| `index.html` | Page shell. |

## Pages — one per tab

| File | What it does |
|---|---|
| `src/pages/plan.tsx` | Current phase card, anchor distances, seven outcomes with rolled-up KPI status. |
| `src/pages/timeline.tsx` | Forward-looking phase-by-phase view from today onward. Each phase card lists the anchors and derived events falling inside it. |
| `src/pages/log.tsx` | Buttons → renders the chosen form via FormRenderer. Saves to localStorage. Daily mini-form auto-shows during detox phases. |
| `src/pages/dashboard.tsx` | KPI sparklines, Habit 2 verification rate, scrollable internal-question audit. |
| `src/pages/settings.tsx` | Export JSON, two-step reset, data counts, modification instructions. |

## Components

| File | What it does |
|---|---|
| `src/components/tab-bar.tsx` | Top tabs. To add a tab: append to TABS here and add a case in App.tsx. |
| `src/components/sparkline.tsx` | Hand-written inline SVG sparkline. |
| `src/components/form-renderer.tsx` | Reads a form JSON and renders inputs. One switch case per field type. Add a type by adding a case. |

## Lib

| File | What it does |
|---|---|
| `src/lib/types.ts` | Shared TS type names. Light typing — most config flows as untyped JSON. |
| `src/lib/storage.ts` | localStorage wrapper. KEYS lists every storage key the app owns. exportAll() and resetAll() power Settings. |
| `src/lib/phase.ts` | Phase + anchor + day-difference math. currentPhase() and isDailyDepressiveLoadDay() drive UI behaviour. |
| `src/lib/kpi.ts` | Numeric series extraction, threshold status, outcome roll-up, Habit 2 verification rate. |

## Docs

| File | What it does |
|---|---|
| `SYSTEM_MAP.md` | This file. |
| `CHANGELOG.md` | Append-only log of every change made to the system. |
| `README.md` | How to run, how to export, example prompts for modifying. |

## Decisions made during build (where the plan was ambiguous)

- **Timeline year**: Anchor dates default to **2026** in `timeline.json` because today is 2026-05-12. If the plan was written with a different year in mind, edit the dates there.
- **Depressive-load escalation threshold**: Set to **7/10 sustained 3+ consecutive days** (the plan said "sustained at a high level across multiple consecutive days"). Edit `kpi-definitions.json` → `depressive_load.thresholds.escalate_at` and `clinical_rule`.
- **Stress/anxiety watch thresholds**: Watch at 6, escalate at 8. Edit in `kpi-definitions.json`.
- **Presence threshold**: Watch if < 5. Higher-is-better has no "escalate" threshold — the trend matters more than the level.
- **Outcome status roll-up**: Coarse — outcome is red if any of its KPIs is red, amber if any is amber, green if all known-status KPIs are green. Reflective outcomes (O1, O3, O6, O7) lean on KPIs that don't have numeric thresholds, so their status is mostly driven by score KPIs they share with O5.
- **Day 90 lapse threshold**: ≤2 unplanned 3/4 instances across 90 days (from the plan; encoded as a note in `outcomes.json` O2.status_rules).
- **Sparkline window**: 28 most recent entries on the Dashboard; 4 weeks on monthly review trend reflections.
- **Re-entry rule**: Habit 2 limit set at 2 instances/week post-Day 90 (from the plan). Not enforced by the app — there's nothing to enforce; the rule lives in `timeline.json` P6.focus as a reminder.
- **Conception assumption**: 1–2 months from December attempts begin → conception likely Jan–Feb 2027. Gestation modelled as 280 days. Expected-birth window shows both ends. Edit `timeline.json` → `derived_events` to change the assumption.
- **Day 180**: Encoded as a derived event (180 days from `detox_day_1`). Lands around end of Feb 2027. Re-evaluate Habit 2 cadence per the plan.
- **Loop instance detection**: The bi-daily form asks per-instance whether each Habit 3/4 instance was part of the loop. We don't auto-detect from timestamps because the bi-daily granularity doesn't have them — the user codes it manually.
- **Two-step reset**: 5-second wait + explicit confirm button. Adjust in `src/pages/settings.tsx`.

## Proposed additions (not built — note here, ask before adding)

- Auto-fill date with today: done.
- A "compare June vs November dominant questions" side-by-side view: useful for Day 90 question 4 but the audit list already supports the comparison by scrolling. Build only if scrolling proves insufficient.
- Sleep-hours tracking: noted in the example prompts as a candidate. Not built.
- A clinician-alert banner when depressive load has been ≥7 for 3+ consecutive days during detox phases: probably worth building. Held off because the threshold logic should be reviewed first.
