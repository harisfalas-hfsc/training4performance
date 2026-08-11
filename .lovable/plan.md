# Smarty Assistant — the AI brain of T4P

An always-available assistant that reads the signed-in coach's own data (squad, sessions, GPS, tests, wellness, alerts), answers questions in plain language, produces reports and graphs, and can make safe changes to the workspace (add/remove GPS KPIs, add strength exercises, add drills) which then flow into every calculation.

## 1. Floating button (everywhere inside the platform)

- Circular button with the T4P logo, fixed on screen, present on every authenticated page.
- Soft glow/pulse animation that fires every 3 seconds (respects reduced-motion settings).
- Hover/long-press tooltip: "Smarty Assistant".
- Draggable: the coach can move it up/down (and it snaps to the left or right edge); position is remembered per user.
- Click opens the assistant panel — a side sheet on desktop, full-screen sheet on mobile. Never covers the header.

## 2. The assistant panel

- Chat thread with streaming answers, saved per user so history survives reloads.
- Suggested starter prompts: "Compare Player A and Player B", "Total team distance this week", "Who is at risk this week?", "Graph the last 5 sessions".
- Answers can include:
  - text analysis (observations + considerations, coach keeps the decision),
  - tables,
  - live charts rendered with the existing chart components,
  - a one-click "Export as PDF / PNG / Excel" using the existing branded report engine.
- Every answer shows which data it used (dates, players, metrics) so it is auditable.

## 3. What it can read

Squad and player profiles, availability, training sessions and blocks, GPS days including any custom KPIs the coach imported, fitness tests (CMJ, SJ, sprint splits, SMS, custom tests), wellness, medical events, computed load (composite ACWR, monotony, strain, weekly totals) and current alerts. Data stays scoped to the signed-in account — the assistant can never see another coach's workspace.

## 4. What it can change (with confirmation)

The assistant proposes an action, shows a preview of exactly what will change, and the coach presses Apply:
- add / rename / remove a GPS KPI in the import template (and it becomes available in analytics, alerts and load calculations),
- add or edit strength exercises, sets/reps/kg/rest in a session,
- add or edit training blocks/drills in a session,
- create or reschedule a session in the calendar,
- adjust an alert threshold.

Nothing is written without confirmation, and view-only (unpaid) accounts get the existing read-only behaviour: the assistant still answers questions but Apply is blocked with the upgrade prompt.

## 5. Learning from the coach

- A per-user memory store: preferred KPIs, terminology, position groups, favourite report format, thresholds and past corrections.
- The coach can view, edit and delete anything the assistant remembered, from the assistant panel.
- Memory is injected into every conversation so answers get more tailored over time.

## 6. Credits

- Each assistant request consumes credits (heavier requests such as multi-player reports cost more).
- Credit balance shown in the assistant header and on the account page; the T4P owner grants/tops up credits per customer from the admin panel, and sees usage per customer.
- When credits run out the assistant explains it and points to the owner/top-up, instead of failing silently.

## 7. Where it is explained

- Discover drawer: a "Smarty Assistant" entry directly below "How it works", linking to a new public page describing it.
- About page: a section on why the assistant exists (a coach-facing analyst that never sleeps).
- How it works: a new step in the flow showing the assistant sitting across every stage — design, import, analyse, report.

## Technical notes

- Model calls go through the Lovable AI Gateway from a server function; the key never reaches the browser. Streaming responses.
- The assistant uses tool-calling: read tools (query players/sessions/GPS/tests/load) and write tools (proposed mutations returned to the client for confirmation), so numbers come from real records, not from the model guessing.
- New tables: `assistant_threads` / `assistant_messages`, `assistant_memory`, `assistant_credits` + `assistant_usage`, all RLS-scoped to `auth.uid()` with grants, plus owner-only policies for the admin views.
- Floating button lives in the authenticated shell (`src/components/app-shell.tsx`) as a new `SmartyAssistant` component; position stored locally per user.
- The existing `/ai` page is kept and becomes the full-screen version of the same assistant, sharing one engine.
- Charts reuse `src/components/charts.tsx`; exports reuse `src/lib/report-export.ts` branding.
