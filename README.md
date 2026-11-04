# V-Strom ServiceBook · Ridebook

A personal maintenance and trip-planning dashboard for Pratik’s Suzuki V-Strom SX 250, prepared for GitHub → Vercel deployment.

## Features

- Actual odometer observations with dates, correction notes and a freshness policy.
- Editable service history and confirmed next-service distance/date targets.
- Tyre pressures, tread observations, chain slack and manual inspection results.
- Mumbai–Solapur trip templates, including one-way or round-trip estimates.
- Prioritized pre-ride checks with daily expiry; unresolved faults stay flagged.
- Service-date and distance warnings, including planned trips that cross a service target.
- Recurring maintenance tasks, monthly review records, JSON export and import.
- Owner-only application access, account-scoped database records and conflict protection for concurrent edits.

No actual mileage, completed maintenance or future trip dates are invented. Trip projections never update the actual odometer.

## Stack

Next.js App Router, React, TypeScript, Supabase Auth and Postgres. This repository is independent of ChatGPT Sites: it does not require Cloudflare D1, Vinext, Sites credentials or ChatGPT sign-in.

## Deploy on Vercel

### 1. Prepare the existing Supabase project

Project URL: `https://wrwyfrocqnnvrjhpymhv.supabase.co`

1. In the project's SQL Editor, run [`supabase/migrations/001_ridebooks.sql`](supabase/migrations/001_ridebooks.sql) once. The script creates the `ridebooks` table, row-level security policies and a revision-check trigger. It does not create users or seed maintenance records. If a table with this name already exists, inspect it first instead of deleting it or repeatedly running the script.
2. In Supabase Authentication, create an email/password user for yourself. Confirm that account's email using the supported dashboard or email-confirmation flow. You enter the password directly in Supabase, not in this repository.
3. Disable new user sign-ups in Supabase Auth. The application intentionally has no public registration page.
4. Copy the project **publishable** key from the project's API-key settings. Do not use a secret or `service_role` key.

The script grants no anonymous access. Signed-in users can only select, insert or update their own row. Application routes also require the exact owner email configured below.

### 2. Import this repository into Vercel

Connect the GitHub repository `PratikSutar39/VStrom_ServiceBook` to your Vercel account and create a project.

Use these project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root |
| Node.js | 24.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the Next.js default |

Add these environment variables in the Vercel project settings for each environment you deploy:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wrwyfrocqnnvrjhpymhv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your project's publishable key |
| `RIDEBOOK_OWNER_EMAIL` | The exact email of your Supabase owner account |

The publishable key is designed for application use; database policies still enforce access. Keep local environment files and all secret/admin keys out of Git. This app does not need a Supabase service-role key or database password.

Deploy after adding the variables. If variables are changed later, redeploy so the new build receives them. Missing configuration shows a setup page and blocks access to records rather than pretending saves work.

### 3. Configure authentication redirects

Once Vercel gives you a deployment URL:

1. Set the Supabase Auth **Site URL** to that production origin.
2. Add `https://YOUR-DEPLOYMENT.vercel.app/auth/callback` to the Auth redirect allowlist, replacing the hostname with the actual deployment host. Add your custom domain's callback if you use one.
3. For local development, allow `http://localhost:3000/auth/callback` separately.

Password-reset requests send the user back through this callback. Request and open the reset email in the same browser, because the PKCE verifier is stored in that browser's cookie. Email delivery depends on your Supabase email configuration; configure SMTP if the project's built-in sender restrictions prevent delivery to your account.

### 4. Verify your deployment

Sign in with the owner account, record an actual odometer reading, and reload to verify the value persists. Confirm service targets from the service book or workshop, and record physical inspections before planning a ride.

The application must reject other accounts and signed-out API requests. Confirm that Supabase's RLS policies remain enabled before using real records.

## Move records from the original site

The GitHub migration moves code, not the original site's database.

1. On the original Ridebook, open **Settings & data → Export all records**.
2. Sign in to the Vercel deployment.
3. Open **Settings & data → Import a ridebook export**.
4. Review the counts and explicitly confirm replacement. Export any existing destination records first if you want to keep a backup.

The import keeps original observation dates. Stale readings and expired checks remain flagged; importing does not make them current.

## Run locally

Requires Node.js 24.x.

```sh
npm ci
cp .env.example .env.local
```

Fill in `.env.local` using your own settings. Apply the SQL migration in the intended Supabase project before running the app. Use a separate development Supabase project if you want to test with disposable data.

```sh
npm run dev
```

Then open `http://localhost:3000`.

## Validation

```sh
npm run typecheck
npm test
npm run build
```

The test suite covers maintenance uncertainty, stale readings, service thresholds, trip projections, owner access, safe redirects and request origins. It also executes the SQL migration in an isolated PGlite Postgres instance, tests row-level isolation and anonymous denial, and checks revision conflicts. It uses no live accounts or production records.

A successful build can run without deployment credentials. End-to-end sign-in, password email delivery and persistence require the configured Supabase project and owner account.

## Reminders

In-app reminders recalculate when the dashboard opens. This deployment does not send background email, SMS or push reminders. The existing monthly ChatGPT reminder is separate and still points at the original Sites URL. Update that reminder to the final Vercel URL after deployment; changing the in-app review day does not update the ChatGPT task.

## Reference information

Suzuki India service windows for 170–279 cc motorcycles were checked on 4 November 2026:

- [Suzuki India service schedule](https://www.suzukimotorcycle.co.in/service)
- [Suzuki owner manuals](https://www.suzukimotorcycle.co.in/User-Manual)
- [Suzuki V-Strom SX product page and reference image](https://www.suzukimotorcycle.co.in/product-details/v-strom-sx)

The published schedule is a reference, not a record of completed work. Confirm requirements for the exact model year and load from the bike label, manual or workshop. Tyre-pressure targets and chain-slack limits are deliberately not guessed. The Mumbai–Solapur template uses the user's approximate 421 km one-way route estimate and requires manual confirmation.

Implementation references:

- [Vercel GitHub deployment](https://vercel.com/docs/git/vercel-for-github)
- [Supabase SSR sessions](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
