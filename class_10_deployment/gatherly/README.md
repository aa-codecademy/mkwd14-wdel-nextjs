# Gatherly — class 10 snapshot: deployment

The course application in class 10. The code is a **copy of the class 09 app** (parallel routes, intercepting routes, sign-in, tickets, the public API), kept **unchanged on purpose** so you can run the pre-deployment checks yourself and find what breaks. The only difference is in `.gitignore`: it now also ignores `.env.local`, `.env.*.local` and `.vercel`, because `vercel env pull` and `vercel link` create files that must never be committed.

> 🚀 **The whole guide is in the [class 10 README](../README.md):** the pre-deployment checklist, the list of blockers in this snapshot (with the fix for each), Postgres on Vercel (Neon), the step-by-step deploy, environment variables, troubleshooting and exercises.

> ⚠️ **This snapshot does not build as it is.** `npm run check` and `npm run build` fail on a few known problems (an unused legacy type file, a duplicated home page, an unused import, formatting, and a page that needs the database at build time). They are listed in [Part 2.2 of the class README](../README.md#22-this-snapshots-blockers-fix-these-first). Fix them first, then deploy.

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
npm run build            # the same command Vercel runs
npm run start            # serve the production build and click around
```

## 📜 Scripts

| Command               | What it does                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `npm run dev`         | Dev server with hot reload (Turbopack)                               |
| `npm run build`       | Production build: type-checks and shows static (`○`) and dynamic (`ƒ`) routes |
| `npm run start`       | Serves the production build (run `build` first)                      |
| `npm run typecheck`   | Generates Next.js route types, then runs the TypeScript compiler     |
| `npm run lint`        | ESLint (`lint:fix` also fixes what it can)                           |
| `npm run format`      | Prettier formats every file (`format:check` only reports)            |
| `npm run check`       | Type check + lint + format check                                     |
| `npm run db:generate` | Writes a new SQL migration in `drizzle/` from changes in `db/schema.ts` |
| `npm run db:migrate`  | Applies the migrations that haven't run yet                          |
| `npm run db:seed`     | Inserts fake data. **Deletes existing rows first**                   |
| `npm run db:studio`   | Opens Drizzle Studio                                                 |

## 🔑 Environment variables

| Variable               | Local (`.env`)               | On Vercel                                             |
| ---------------------- | ---------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`         | your local PostgreSQL        | injected by the Neon integration (pooled)             |
| `BETTER_AUTH_SECRET`   | any long random string       | a **new** random string                               |
| `BETTER_AUTH_URL`      | `http://localhost:3000`      | your production URL (`https://...`)                   |
| `GITHUB_CLIENT_ID`     | the local OAuth app          | the **production** OAuth app                          |
| `GITHUB_CLIENT_SECRET` | the local OAuth app          | the **production** OAuth app                          |

## 🔗 Links

- [Class 10 README](../README.md): the deployment guide
- [Class 09 README](../../class_09_adv_routing/README.md): what this app does
- [Class 07 README](../../class_07_auth/README.md): GitHub credentials and sign-in
- [Class 03 README](../../class_03_db/README.md): PostgreSQL and Drizzle
