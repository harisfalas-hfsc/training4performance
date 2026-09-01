# Full QA sweep — visitor, new user, coach, admin

A complete end-to-end walkthrough of T4P driven by a real browser against the running app, in four personas. Nothing is left behind: every record created during testing is deleted at the end, and the test account is removed. No changes to your own data, and no leftover GPS reports beyond the demo.

## 1. Visitor (signed out)

- Load every public page: home, about, how it works, pricing, FAQ, manual, download, disclaimer, privacy, terms, Haris Falas page, auth.
- Check layout on desktop and mobile widths, H1 style consistency, centring/width, broken images, console errors, dead links.
- Confirm the manual renders in the marketing layout with no platform nav.
- Enter the demo: confirm the demo banner, that the T4P demo team and its five players are visible, and that a first-time visitor can understand what they are looking at.
- Inside the demo, exercise trainings, calendar, GPS views, tests, wellness, analytics and the tactics board; confirm the blocked actions (new teams, new players, GPS edits, exports) are refused with a clear message rather than failing silently.
- Probe access control: try opening protected routes (dashboard, squad, gps, admin, account, portal) while signed out and confirm each redirects to sign-in rather than leaking data.

## 2. New account (signed up, no subscription)

- Create a throwaway account through the normal sign-up flow.
- Verify the view-only banner appears and that browsing works everywhere.
- Attempt writes across the app (create team, add player, upload GPS, create training, log RPE, log wellness) and confirm each is blocked consistently with the subscription message — and that nothing is silently written to the database anyway.
- Confirm exports and reads that should stay available really are.
- Check the account page, notifications, support ticket flow and pricing/checkout entry point (without paying).

## 3. Subscribed coach (full write access)

Run on the test account with access granted temporarily, then revoked and cleaned up.

- Create a team manually; then delete it and create a team via GPS-report upload, to test both paths.
- Add players, fill player passports (height, weight, body composition), enter fitness-test results, view the passport charts.
- Create trainings with blocks, schedule them on the calendar, edit them, mark them completed, attach a tactics board to a session, save and duplicate blocks.
- Use the drills and exercise library; create and edit a block.
- Upload a GPS report, assign it to a session and to blocks, check auto-session handling, verify load model / ACWR / monotony output on the logbook and insights.
- Enter manual RPE, check load calculations follow the configured load model.
- Issue player wellness access, submit a wellness entry through the player portal, confirm the coach side receives it.
- Analytics: single player, multi-player comparison, team view, drill leaderboard, tags, KPI/date filters, chart rendering, PDF export.
- Reports: wellness, GPS, training, comparison; check PDF download works.
- Alerts and notification centre: confirm thresholds fire and the bell updates.
- Tactics board standalone/focus mode, auto-save, export.
- Delete everything created, then delete the test account.

## 4. Administrator

- Sign in as your admin account and check the admin panel read-only: customers, usage snapshots, revenue, subscriptions, support inbox, library management, impersonation entry point.
- Confirm admin-only routes are unreachable for non-admin accounts.
- No admin-side data is modified.

## Output

A written report grouped by persona, listing for each issue: what happened, what should happen, why it happens (with the file or query responsible), severity, and the proposed fix. No code changes in this pass — fixes are proposed, and you decide which to apply.

## Technical notes

- Driven with Playwright against the local dev server, plus direct database reads to verify that blocked writes really did not persist.
- The test account is created through normal sign-up; subscription access for phase 3 is granted directly in the database and removed afterwards.
- Cleanup is verified by re-querying the database at the end for any rows belonging to the test user.
