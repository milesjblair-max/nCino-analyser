# Changelog

Append-only. Newest entries on top. Each entry: date, what changed, why (in one sentence if needed).

## 2026-05-12 — Backup, restore, and stale-backup reminder

- Settings → Backup uses the Web Share API (iOS Share Sheet → Save to Files / iCloud Drive / email). Falls back to a download on desktop.
- Settings → Restore reads a previously-saved JSON file and replaces localStorage. Reloads on success.
- Last-backup timestamp shown in Settings. `meta_last_export_iso` tracks it.
- Stale-backup banner sits between the header and the tab bar whenever the last backup was > 7 days ago or never. Dismissed by tapping "Back up now".
- Settings explains the iOS "Add to Home Screen" trick — once added, iOS Safari stops the 7-day silent eviction.

## 2026-05-12 — Today indicator + current-phase progress

- "Today: {date}" badge added to Plan and Roadmap so the date the app is using is always visible. `todayString()` reads from the browser's `new Date()`, so it tracks the device clock.
- Current phase header on Roadmap now shows a progress bar with "Day X of Y · N%" and "Nd remaining" inside the header card.

## 2026-05-12 — Roadmap: phase description cards

- Every phase now renders a header card at the top of its section: phase ID, name, focus text from `timeline.json`, start/end dates, depressive-load cadence. Current phase is outlined in solid green with a "current" badge.
- Phase-start anchors are no longer listed as separate milestones — the header card absorbs them.
- Milestones (Today, anchors, derived events) nest inside the phase they belong to.

## 2026-05-12 — Roadmap: switch to event-based layout

- Roadmap no longer renders a strict proportional time axis. The previous version left ~600px of blank space in the post-Day-180 stretch (no events between Feb 2027 and Oct 2027).
- New layout: vertical list of milestones, each row contains a phase-colour stripe on the left, the event in the centre, and a "+ N days" gap label between consecutive events. Phase progression remains visible via the continuous stripe.
- File: `src/pages/roadmap.tsx`.

## 2026-05-12 — Roadmap tab + mobile UI fixes

- New `src/pages/roadmap.tsx`: visual roadmap with phase bands proportional to duration and milestone dots on a vertical spine. Detox phases (P2–P4) shown in solid dark green; pregnancy milestones in rose; Day 180 review in amber.
- Tab bar is now horizontally scrollable on narrow viewports — necessary now that six tabs exist (Plan / Roadmap / Timeline / Log / Dashboard / Settings).
- App shell: `overflow-x-hidden` on the root, `pb-24` on main to clear the iOS bottom address bar, `viewport-fit=cover` for notched devices.
- Dashboard score table is now horizontally scrollable when the viewport is too narrow.
- Status chips on Plan and Timeline use `whitespace-nowrap`; sibling text containers got `min-w-0 flex-1` so long labels wrap rather than push siblings off-screen.

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
