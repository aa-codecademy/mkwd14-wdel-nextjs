# Gatherly — class 10 snapshot: the finished app, ready to deploy

The final version of the course application: everything from class 9 (sign-in, tickets, the public API, parallel and intercepting routes) plus **check-in** for organizers, **scanner API tokens**, **My tickets** with a mock payment and a printable page, and **publishing events**. This is the project you deploy to **Vercel** with **Postgres on Vercel (Neon)**.

> 🚀 **The whole guide is in the [class 10 README](../README.md):** what's new in the app, the pre-deployment checklist, known issues, Postgres on Vercel, the step-by-step deploy, environment variables, troubleshooting and exercises.

> ⚠️ **`npm run build` runs the database migrations first** (`npm run db:migrate && next build`). A build, locally or on Vercel, needs a **reachable database** in `DATABASE_URL`.

| Route | Who may open it |
| ----- | --------------- |
| `/`, `/events`, `/events/[slug]`, `/about` | everyone |
| `/events/[slug]/tickets` (modal or full page) | everyone sees it; **sign in to reserve** |
| `/sign-in`, `/sign-up` | everyone (the GitHub button needs the env values) |
| `/my-tickets`, `/my-tickets/[orderId]/pay`, `/my-tickets/print` | signed-in users (their own tickets and orders only) |
| `/dashboard` (stats, orders, attendees panels, scanner tokens) | **organizers and admins** |
| `/dashboard/check-in` | **organizers and admins** |
| `/dashboard/events/new` | meant for organizers (see the known issues in the class README) |
| `GET /api/events`, `/api/events/[slug]`, `/api/events/[slug]/calendar.ics` | everyone (public, read-only) |
| `/api/auth/*` | Better Auth's own endpoints |

## 🚀 Quick start (local)

You need a running PostgreSQL server with a `gatherly` database ([class 03, Step 1](../../class_03_db/README.md#-step-1--get-a-postgresql-server-choose-one-option)). Then:

```bash
cp .env.example .env     # fill in DATABASE_URL, BETTER_AUTH_SECRET and the GitHub values
npm install
npm run db:migrate
npm run db:seed          # fake data. ⚠️ it wipes the tables first
npm run dev
```

Open [http://localhost:3000/events](http://localhost:3000/events).

## ✅ Before every deploy

```bash
npm run check            # typecheck + lint + format:check
npm run build            # migrates the database, then builds: the same command Vercel runs
npm run start            # serve the production build and click around
```

## 📜 Scripts

| Command               | What it does                                                                     |
| --------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`         | Dev server with hot reload (Turbopack)                                           |
| `npm run build`       | **`db:migrate` then `next build`**: shows static (`○`) and dynamic (`ƒ`) routes  |
| `npm run start`       | Serves the production build (run `build` first)                                  |
| `npm run typecheck`   | Generates Next.js route types, then runs the TypeScript compiler                 |
| `npm run lint`        | ESLint (`lint:fix` also fixes what it can)                                       |
| `npm run format`      | Prettier formats every file (`format:check` only reports)                        |
| `npm run check`       | Type check + lint + format check                                                 |
| `npm run db:generate` | Writes a new SQL migration in `drizzle/` from changes in `db/schema.ts`          |
| `npm run db:migrate`  | Applies the migrations that haven't run yet                                      |
| `npm run db:seed`     | Inserts fake data. **Deletes existing rows first**                               |
| `npm run db:studio`   | Opens Drizzle Studio                                                             |

## 🔑 Environment variables

| Variable               | Local (`.env`)            | On Vercel                                    |
| ---------------------- | ------------------------- | -------------------------------------------- |
| `DATABASE_URL`         | your local PostgreSQL     | injected by the Neon integration (pooled)    |
| `BETTER_AUTH_SECRET`   | any long random string    | a **new** random string                      |
| `BETTER_AUTH_URL`      | `http://localhost:3000`   | your production URL (`https://...`)          |
| `GITHUB_CLIENT_ID`     | the local OAuth app       | the **production** OAuth app                 |
| `GITHUB_CLIENT_SECRET` | the local OAuth app       | the **production** OAuth app                 |

## 🗂 What's new compared with class 9

| Folder / file | What it is |
| ------------- | ---------- |
| `app/(dashboard)/dashboard/check-in/`, `app/actions/check-in.ts`, `lib/check-in.ts` | The check-in page, its Server Action and the rules (404, 403, 422, 409) |
| `app/(dashboard)/dashboard/(overview)/_components/create-scanner-token.tsx`, `app/actions/api-tokens.ts`, `lib/api-tokens.ts` | Scanner tokens: stored as a hash, shown once |
| `app/(marketing)/my-tickets/`, `app/actions/orders.ts` | My tickets, the mock pay step and the printable page |
| `db/schema.ts`, `drizzle/0005_*`, `drizzle/0006_*` | New tables `api_tokens` and `check_ins`; `canceled` renamed to `cancelled` |

## 🔗 Links

- [Class 10 README](../README.md): the deployment guide
- [Class 09 README](../../class_09_adv_routing/README.md): parallel and intercepting routes, the dashboard
- [Class 07 README](../../class_07_auth/README.md): GitHub credentials and sign-in
- [Class 03 README](../../class_03_db/README.md): PostgreSQL and Drizzle
