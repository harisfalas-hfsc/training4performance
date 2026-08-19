# Taking T4P off Lovable — full ownership & exit guide

Everything in T4P is already yours and portable. Nothing is locked to Lovable except two convenience layers (the managed database project and the Google sign-in broker), and both have a clean replacement path. Below is exactly what to take, in what order, and what has to be re-created.

## 1. The code

- Connect the project to GitHub (Lovable → GitHub button). Every file is pushed to your own repository: all routes, components, admin panel, Stripe code, webhook, cron endpoints, Electron desktop build, PWA config.
- Alternative: Lovable → Download as ZIP.
- The stack is 100% standard: TanStack Start + Vite + React + Tailwind. `npm i && npm run dev` runs locally with no Lovable service involved.

## 2. The database (schema + data)

- The full schema history is already in the repo: `supabase/migrations/` (29 SQL files) — tables, RLS policies, grants, functions, triggers.
- Data: take a full dump with `pg_dump` from the current database (roles, auth users, all public tables), then restore into a new database.
- Target options: your own Supabase project (easiest — the code needs zero changes), or any managed Postgres if you also replace the auth layer.

## 3. Auth

- Auth is Supabase Auth (email/password + Google). Moving to your own Supabase project keeps it identical: users, hashes and confirmations come across in the `auth` schema dump.
- Google sign-in is the one Lovable-specific piece: `src/integrations/lovable/index.ts` uses the Lovable OAuth broker. Replace those calls with `supabase.auth.signInWithOAuth('google', ...)` and register your own Google OAuth client. Email/password needs no change.

## 4. Stripe

- Stripe is your own account already. The API keys, products, prices, webhook endpoint and customers all live in your Stripe dashboard — nothing to migrate.
- Only action: after deploying to the new host, add the new domain's `/api/public/payments/webhook` URL as a Stripe webhook endpoint and copy the new signing secret into your env.

## 5. Secrets

Server-side secrets are values you set, not values Lovable owns. On the new host, set these env vars:

| Variable | Where it comes from |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | new Supabase project settings |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | same project (client-side) |
| `STRIPE_LIVE_API_KEY`, `STRIPE_SANDBOX_API_KEY` | your Stripe dashboard |
| `PAYMENTS_LIVE_WEBHOOK_SECRET`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET` | new Stripe webhook endpoints |
| `VITE_PAYMENTS_CLIENT_TOKEN` | Stripe publishable key |
| `LOVABLE_API_KEY` | only used by the AI assistant — replace with your own OpenAI/Anthropic/Google key and swap the gateway base URL |

Note: the service-role key and DB password are not readable from inside Lovable Cloud; on your own Supabase project you get both from your dashboard.

## 6. Hosting

- Build target is a Cloudflare Worker-style edge bundle, so Cloudflare Workers/Pages is the closest one-to-one host. Netlify, Vercel or a Node server also work with a Nitro preset change in `vite.config.ts`.
- Point `training4performance.com` DNS at the new host and re-issue the certificate there.
- Desktop installers and the PWA keep working unchanged — they just call the new domain.

## 7. Cron / scheduled work

- Scheduled calls hit public endpoints under `src/routes/api/public/*`. On the new host, drive them from Supabase `pg_cron`, GitHub Actions, or the host's scheduler — same URLs, new domain.

## 8. What has to be rewritten (small)

1. Google sign-in broker → native Supabase OAuth (~1 file).
2. AI assistant gateway → your own model provider key (~1 config).
3. Nitro/deploy preset if the new host isn't Cloudflare.

Everything else is a copy-paste move.

## Suggested order

1. Push to GitHub, clone locally, confirm `npm run dev` works.
2. Create your own Supabase project, run the migrations, restore the data dump.
3. Set env vars locally, verify auth + Stripe sandbox end to end.
4. Deploy to the new host, add the Stripe webhook, move DNS.
5. Only then disconnect Lovable Cloud (that step is irreversible and deletes the managed database, so do it last, after your dump is restored and verified).

## What I can do for you now

Say the word and I will implement the exit-readiness pieces inside the project: native Google OAuth instead of the broker, a documented `.env.example` listing every variable, a `MIGRATION.md` with the exact `pg_dump`/`psql` commands, and a deploy config for your chosen host.
