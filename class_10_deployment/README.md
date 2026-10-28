# Class 10 — Deploying Gatherly to Vercel (with Postgres)

Until now Gatherly lived on **your laptop**: `localhost:3000`, a PostgreSQL you installed, and nobody else could see it. In this class we put it on the **internet**, at a real URL anyone can open, with a **real hosted database** behind it.

We'll use **[Vercel](https://vercel.com/)** (the company that makes Next.js) to host the app, and **Postgres from the Vercel Marketplace** (the provider is **Neon**) to store the data.

> 🧭 **Where we are:** the `gatherly/` folder is a **copy of the class 9 app**, with one small safety fix in `.gitignore` (explained in [Part 2](#part-2--before-you-deploy-the-checklist)). It does **not** deploy as it is: `npm run build` fails on a few known problems. Finding them, fixing them, and **proving the build passes locally before you ever click Deploy** is the most important skill of this class.

**On this page:**
[Part 1: The big picture](#part-1--the-big-picture) · [Part 2: The checklist](#part-2--before-you-deploy-the-checklist) · [Part 3: Postgres on Vercel](#part-3--postgres-on-vercel) · [Part 4: Deploy, step by step](#part-4--deploy-to-vercel-step-by-step) · [Part 5: Environment variables](#part-5--environment-variables-reference) · [Part 6: After deploying](#part-6--after-the-first-deploy) · [Part 7: The CLI](#part-7--the-vercel-cli-optional) · [Part 8: Troubleshooting](#part-8--troubleshooting) · [Exercises](#-try-it-yourself) · [Links](#-useful-links)

## 📁 What's in this folder

| Folder                    | What it is                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | A copy of the class 9 app. This is the project you'll deploy (or use as the model for your own project)    |

---

# Part 1 — The big picture

## 1.1 Local vs production

Everything that "just worked" on your laptop was quietly depending on your machine. In production, **none of that exists**:

| | **On your laptop** (development) | **On Vercel** (production) |
| --- | --- | --- |
| How the app runs | `npm run dev`: a dev server that recompiles on every save | `npm run build` **once**, then the built app serves requests |
| Where | Your computer, while the terminal is open | Vercel's servers, always on |
| The address | `http://localhost:3000` | `https://your-project.vercel.app` (HTTPS, automatic) |
| The database | PostgreSQL on `localhost` | A **hosted** Postgres on the internet |
| Environment variables | Your `.env` file | **Project settings** on Vercel (the `.env` file is never uploaded) |
| Errors | A red overlay in the browser | A log you have to go and read |
| Who can reach it | Only you | Everyone |

That last row changes how you think: **production code is attacked and used by strangers.** Everything from classes 6 to 9 (validation, authorization, ownership) matters now.

## 1.2 What Vercel does when you push

```
 you:  git push  ──►  GitHub  ──►  Vercel
                                    1. clones your repo
                                    2. npm install
                                    3. npm run build           ← this is where checks can fail
                                    4. publishes the result:
                                         • static pages + files  → served from a global CDN (fast, everywhere)
                                         • dynamic pages, API routes, Server Actions → run as Vercel Functions,
                                           started on demand and scaled automatically
                                         • proxy.ts              → runs before requests
                                    5. gives you a URL
```

Two consequences you'll meet today:

1. **The build is the gatekeeper.** If `npm run build` fails on Vercel, nothing is deployed and the old version stays live. So it must pass on your laptop first (Part 2).
2. **Your functions are stateless.** They have no persistent disk, and many copies can run at once. That's why the database must be a **separate service** with its own address.

## 1.3 Environments: Production and Preview

Vercel has more than one kind of deployment:

| Environment      | Created when...                                                  | URL                                         |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| **Production**   | you push to the **production branch** (usually `main`)           | `your-project.vercel.app` (and your domain) |
| **Preview**      | you push to **any other branch** or open a pull request          | a unique URL per deployment                 |
| **Development**  | not a deployment: it's the set of variables you pull to your laptop | `localhost`                              |

Every environment can have **different environment variables**. This is how production uses the production database while a preview doesn't.

## 1.4 "Vercel Postgres" is now Neon

You may read old tutorials about **Vercel Postgres**. It **no longer exists for new projects**: Vercel moved it to the **Marketplace**, where you pick a Postgres provider and Vercel connects it to your project (and injects the connection variables for you). The provider we use is **[Neon](https://neon.com/)**: serverless Postgres with a free plan, billed (if you ever pay) through Vercel. From your code's point of view it is just **PostgreSQL**: the same `pg` + Drizzle you've used since class 3.

---

# Part 2 — Before you deploy: the checklist

Work through this **in order**, on your laptop. Every item is something that has broken a real deployment.

## 2.1 The quality gates: your laptop must say yes first

Run these from the app folder (`class_10_deployment/gatherly`, or your own project root):

| # | Command | What it proves | If it fails |
| - | ------- | -------------- | ----------- |
| 1 | `git status` | Everything you want to deploy is **committed** (Vercel builds from Git, not from your folder) | Commit or stash |
| 2 | `rm -rf node_modules && npm ci` | A **clean install** from `package-lock.json` works, like on Vercel's fresh machine (Windows PowerShell: `Remove-Item -Recurse -Force node_modules; npm ci`) | Fix the lockfile: `npm install`, commit `package-lock.json` |
| 3 | `npm run typecheck` | The code type-checks | Fix the type errors |
| 4 | `npm run lint` | No ESLint errors | Fix them (warnings are allowed) |
| 5 | `npm run format:check` | Prettier agrees with the code style | `npm run format`, review, commit |
| 6 | `npm run build` | **The same command Vercel runs.** The single most important check | Read the error. See 2.2 |
| 7 | `npm run start` | The production build **actually serves pages** (needs your local database) | Open `http://localhost:3000` and click around |

Steps 3 to 5 are what `npm run check` does in one go. **Step 6 is the one that matters most**: if it passes locally with the right variables, it will pass on Vercel (same Node, same commands, same lockfile).

> 💡 **Read the route table at the end of `npm run build`.** It tells you what Next.js decided for each route:
> `○` **Static** = prerendered once at build time. `ƒ` **Dynamic** = rendered on every request.
> A page that **reads the database but shows as `○` Static** is a red flag: its data is frozen at build time (see 2.2, problem 4).

## 2.2 This snapshot's blockers (fix these first)

I ran steps 3 to 6 on the copy in `gatherly/`. **It fails.** Each problem below is real, and each fix was verified (after fixes 1 to 5, `npm run check` and `npm run build` both pass):

| # | What the checks say | Why it happens | The fix |
| - | ------------------- | -------------- | ------- |
| 1 | `typecheck`/`build`: `types/gatherly-event.ts: '"../db/schema"' has no exported member named 'Event'` | An old, **unused** file imports types that were removed in class 7 | **Delete** `types/gatherly-event.ts` (nothing imports it) |
| 2 | `typecheck`/`build`: `app/(marketing)/page.tsx is not a module` | The home page exists **twice**: the real one in `app/page.tsx`, and an **empty** file in `app/(marketing)/page.tsx`. One URL can't have two pages, and an empty file isn't a page | Move the content of `app/page.tsx` into `app/(marketing)/page.tsx` and **delete** `app/page.tsx` (so `/` also gets the header and footer) |
| 3 | `lint`: `'error' is defined but never used` in `lib/api.ts` | A leftover auto-import: `import { error } from 'console'` | **Delete that line** |
| 4 | `build`: `Failed query: select ... from "categories"` on `/dashboard/events/new` | This page reads the database but uses **no request data** (no cookies), so Next.js **prerenders it at build time**, and the build now needs a reachable, migrated database. Worse, the form's venue and category list would be **frozen at build time** | Guard the page with `await requireOrganizer('/dashboard/events/new')` at the top. That reads the session cookie, which makes the page **dynamic**, and it's the missing authorization check from class 7 anyway |
| 5 | `format:check`: *Code style issues found in 24 files* | Several files (including the generated shadcn ones) don't match Prettier | Run `npm run format`, **look at the diff**, commit it |
| 6 | `npm run db:seed` fails: `Can't resolve '@/node_modules/@types/pg'` (`db/seed.ts`) | An editor auto-import picked a path inside `node_modules/@types` | Use `import { Pool } from 'pg';`. (Not needed for the build, but you need the seed for demo data in production) |

Fix 4 in code (add one import and one line):

```tsx
// app/(dashboard)/dashboard/events/new/page.tsx
import { requireOrganizer } from '../../../../../lib/session';

export default async function NewEventFormPage() {
  await requireOrganizer('/dashboard/events/new');   // ← makes the page dynamic AND protects it
  const { venues, categories } = await getEventFormOptions();
  // ...
}
```

> 🧠 **The general lesson of problem 4:** *any page that touches the database and does not read cookies, headers or search params is prerendered at build time.* That is great for a blog (fast, cached) and a bug for anything that must be fresh or personal. Watch the `○ / ƒ` table.

## 2.3 The environment variables must exist at build time

Try this: run `npm run build` with **no** environment variables at all. It fails twice over:

| Missing | The error | Why |
| ------- | --------- | --- |
| `DATABASE_URL` | `DATABASE_URL is not set` (from `db/index.ts`) | The file **throws when it's imported**, and the build imports your route files to collect page data |
| `BETTER_AUTH_SECRET` | `You are using the default secret` (Better Auth) | Better Auth refuses to run in production with its built-in default secret |

So on Vercel, **both variables must be set before the first build**, even though the build doesn't connect to the database. To prove your build works *without* a real database, pass throwaway values:

```bash
DATABASE_URL="postgres://user:pass@localhost:5432/none" \
BETTER_AUTH_SECRET="any-long-random-string-for-the-build-check-only" \
npm run build
```

(Windows PowerShell: set `$env:DATABASE_URL="..."` and `$env:BETTER_AUTH_SECRET="..."` first, then `npm run build`.)

You'll also see a **warning** from Better Auth: *Base URL is not set*. In production that matters, and we fix it with `BETTER_AUTH_URL` in Part 5.

## 2.4 Secrets and configuration

| ☐ | Check | How |
| - | ----- | --- |
| ☐ | **No secret is in Git.** Only `.env.example` is tracked | `git ls-files \| grep -E "(^\|/)\.env"` must print **only** `.env.example` |
| ☐ | **`.env.local` and `.env.*.local` are ignored.** `vercel env pull` writes a local env file, and the original `.gitignore` only ignored `.env` | Already fixed in this folder's `.gitignore`. Check your own project |
| ☐ | **`.env.example` lists every variable** the app reads (with **empty** values) | Compare it with the table in [Part 5](#part-5--environment-variables-reference) |
| ☐ | **No hard-coded secrets or URLs** in the code | Search for `localhost`, `password`, `secret`, `sk_`, `ghp_` |
| ☐ | **A NEW `BETTER_AUTH_SECRET` for production.** Never reuse the local one | Generate it: `npx auth@latest secret` or `openssl rand -base64 32` |
| ☐ | **A separate GitHub OAuth app for production** (its own client id, secret and callback URL) | [Part 4, step 7](#step-7--github-sign-in-for-production) |
| ☐ | If a secret was **ever** committed, treat it as **burned**: create a new one. Deleting the file later doesn't un-leak it | |

## 2.5 App settings that behave differently in production

| ☐ | Check | Why |
| - | ----- | --- |
| ☐ | `BETTER_AUTH_URL` is planned (your production URL) | Without it Better Auth guesses the origin from each request, and sign-in redirects can break |
| ☐ | **Every image host is in `next.config.ts` → `images.remotePatterns`** | Next.js refuses to optimise images from unlisted hosts (a broken image with a 400). Ours lists `images.unsplash.com`, `picsum.photos` and `loremflickr.com` |
| ☐ | **File names match their imports exactly**, including capital letters | macOS and Windows ignore case; **Vercel's Linux doesn't**. `./EventCard` vs `./event-card` builds on your laptop and fails there |
| ☐ | **No leftover `console.log`** (and no sensitive data in logs) | Production logs are shared and searchable |
| ☐ | **`logger: true` in `db/index.ts`** prints **every SQL query** (with values) to the logs. Turn it off for production, or make it conditional on `NODE_ENV` | Noisy, and it can expose personal data |
| ☐ | Node version: `package.json` says `"engines": { "node": ">=20.9" }` ✅. Vercel also has a **Node.js Version** setting in the project | Match what you developed with |
| ☐ | Fonts and images come from `next/font` and `next/image` | Both are optimised automatically on Vercel |

## 2.6 The database

| ☐ | Check | Why |
| - | ----- | --- |
| ☐ | The **`drizzle/` folder is committed**, and no migration was ever edited by hand | The production database is built from these files |
| ☐ | You know how you'll **run migrations on production** | Vercel does **not** run `db:migrate` for you. Part 3 shows how |
| ☐ | You understand that **`npm run db:seed` deletes everything first** | Fine on an **empty** production database for demo data. **Never** on one with real users |

## 2.7 Git and the repository

| ☐ | Check | Why |
| - | ----- | --- |
| ☐ | The code is pushed to **GitHub** (or GitLab / Bitbucket) on the branch you'll use as production (`main`) | Vercel deploys from Git |
| ☐ | `package-lock.json` is committed | Reproducible installs |
| ☐ | You know **where the app lives in the repo** | In this course repo it's in a **subfolder** (`class_10_deployment/gatherly`), so Vercel needs the **Root Directory** setting. If your app is at the root of its own repo, you don't |

## 2.8 The printable version

```
□ git status is clean, everything committed
□ rm -rf node_modules && npm ci
□ npm run check            (typecheck + lint + format:check)   ✅
□ npm run build            (with DATABASE_URL and BETTER_AUTH_SECRET set)   ✅
□ npm run start            and click through the main pages
□ read the ○ / ƒ route table: nothing that reads the database is static by accident
□ git ls-files | grep .env   →  only .env.example
□ .env.example lists every variable; new BETTER_AUTH_SECRET generated
□ remotePatterns, file-name casing, console.log, logger: checked
□ drizzle/ committed; you know how you'll run migrations on production
□ pushed to GitHub; you know the Root Directory
```

---

# Part 3 — Postgres on Vercel

## 3.1 What you're creating

A **Neon Postgres database** that Vercel provisions and bills, and **injects into your project as environment variables**. In Vercel's vocabulary a "Database" is a Neon "Project". You'll create it in the **Storage** tab, then **connect it to your Vercel project**.

## 3.2 The variables you get

When you connect the database, Vercel adds these to your project:

| Variable                | What it is                                                                              | Use it for |
| ----------------------- | --------------------------------------------------------------------------------------- | ---------- |
| `DATABASE_URL`          | The **pooled** connection string (goes through **PgBouncer**, a connection pooler)     | **The running app** |
| `DATABASE_URL_UNPOOLED` | The **direct** connection string                                                        | **Migrations and the seed** (Drizzle Kit) |
| `PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGDATABASE`, `PGPASSWORD` | The same connection, split into parts       | Custom setups (we don't need them) |
| `POSTGRES_*`            | Legacy names, for compatibility with old Vercel Postgres templates                      | Ignore |

**Why two connection strings?** Serverless functions start and stop all the time, and many run at once. Each opens its own database connection, and PostgreSQL only allows a limited number. A **pooler** sits in between and shares a small number of real connections among many clients, so the app doesn't run out. That's the pooled `DATABASE_URL`. A **migration**, though, runs structural changes (`CREATE TABLE`...) in a transaction and is better done over a **direct** connection. (The general recommendation for migration tools. Neon's page doesn't spell out which to use, so if a migration ever behaves strangely, try the other URL.)

Our code needs no change: `db/index.ts` creates a `pg` `Pool` from `DATABASE_URL`, and the string already contains `sslmode=require`, which turns on encryption (hosted databases **require** TLS).

## 3.3 Creating it, in order

These steps happen **after** you've created the Vercel project in Part 4 (step 4), because the database is connected **to** a project. The overview:

1. In Vercel, open **Storage** (in your team's dashboard, or in the **Storage** tab of your project).
2. Create a database from the **Marketplace** and choose **Neon (Postgres)**. If asked, choose **Create New Neon Account** (you don't need a separate Neon login; billing goes through Vercel).
3. **Region:** pick one **close to your users and to your Functions**. For Macedonia, an EU region such as **Frankfurt**. (Functions default to a US region. In **Project Settings → Functions** you can set the **Function Region** to match the database. A function in Washington talking to a database in Frankfurt on every query is slow.)
4. **Plan:** the free plan is plenty for this course. Check what it includes on the plan screen.
5. **Name** the database (for example `gatherly-db`), accept the terms.
6. Open **Storage → your database → Connect Project**, choose your project and the **environments**, then **Connect**.
7. Vercel adds the variables. Check **Project → Settings → Environment Variables**.

> 💡 The exact button names change from time to time. If a label differs, look for "Create Database", "Marketplace" and "Connect Project".

**Which environments?** Connect **Production** (and **Development**, if you want `vercel env pull`). For **Preview**, you have a choice:
- **Don't connect it** (simplest): preview deployments build but have no database.
- **Enable Preview branching:** every preview gets its **own copy-on-write database branch**, so you can test schema changes without touching production. It needs migrations to run for each preview, which is more setup. Skip it for now.
- **Don't** connect Preview to the **production** database "to make it work". A preview from a half-finished branch would read and write real data.

## 3.4 Running migrations on production

Vercel runs `npm run build`. It does **not** run `npm run db:migrate`. A brand-new database has **no tables**, so you apply the migrations yourself, once, **from your laptop**, using the **unpooled** URL:

**1. Get the unpooled connection string.** Vercel → **Storage → your database** shows the connection details. Copy the **unpooled / direct** one (`DATABASE_URL_UNPOOLED`).

**2. Run the migrations against it:**

```bash
# macOS / Linux: put a space BEFORE the command so it isn't saved in your shell history (in bash/zsh with HISTCONTROL)
DATABASE_URL="postgres://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require" npm run db:migrate
```

```powershell
# Windows PowerShell
$env:DATABASE_URL = "postgres://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
npm run db:migrate
Remove-Item Env:DATABASE_URL        # don't leave it in your session
```

Why does this work? Our `drizzle.config.ts` reads `DATABASE_URL`, and a variable set in your shell **wins over** `.env` (class 3). So one command can point at production **without editing any file**.

> ⚠️ **Be careful: this is the production database.** Double-check the host in the URL before running anything. Never paste the URL into a chat, a screenshot or a commit.

**3. Check it worked.** Open **Open in Neon → SQL Editor** and run `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`. You should see `user`, `session`, `account`, `events`, `venues`, `orders`, `tickets`... Or with `psql`: `psql "<the-url>" -c "\dt"`.

**4. (Optional) Demo data.** On a brand-new, empty database you can fill it with the sample events:

```bash
DATABASE_URL="<the unpooled url>" npm run db:seed
```

⚠️ The seed **wipes every table first**. Use it **once**, on an empty database. (It needs fix 6 from Part 2.) The seeded organizers can't sign in. To use the dashboard on production you promote **your own** GitHub account, as in the class 7 and 9 READMEs, by running the SQL in Neon's SQL Editor:

```sql
UPDATE "user" SET role = 'organizer' WHERE email = 'you@example.com';
```

## 3.5 Changing the schema later

Production now has **real data**, so the workflow gets stricter:

```
1. edit db/schema.ts
2. npm run db:generate          → a new SQL file in drizzle/
3. READ the SQL: does it drop anything? (a renamed column is a DROP + ADD: data loss!)
4. test it on a COPY (your local database)
5. commit and push
6. run the migration on production (3.4), then the new code goes live
```

Prefer **additive** changes (new tables, new nullable columns). They work with **both** the old and the new code, so the order of "migrate" and "deploy" doesn't matter. Destructive changes need a plan (add the new thing, move the data, switch the code, then remove the old thing).

---

# Part 4 — Deploy to Vercel, step by step

## Step 1 — Get your code onto GitHub

```bash
git add -A
git commit -m "Prepare for deployment"
git push origin main
```

Make sure the checklist (Part 2) is **green** first. A deploy of broken code is a failed deploy.

## Step 2 — Create a Vercel account

1. Go to [vercel.com/signup](https://vercel.com/signup).
2. Choose the **Hobby** plan (free, for personal, non-commercial projects).
3. **Continue with GitHub.** This connects the two accounts, so Vercel can read your repositories. When GitHub asks, you can grant access to **only the repository** you want to deploy.

## Step 3 — Import the project

1. In the Vercel dashboard click **Add New… → Project**.
2. Under **Import Git Repository** find your repo and click **Import**.
3. On the **Configure Project** screen:

| Setting | What to do |
| ------- | ---------- |
| **Project Name** | Becomes your URL (`name.vercel.app`). Pick something short |
| **Framework Preset** | It should say **Next.js**, detected automatically. Leave it |
| **Root Directory** | If the app is **not** at the top of the repo (like `class_10_deployment/gatherly` in the course repo), click **Edit** and choose that folder. If it's at the root of your own repo, leave it blank |
| **Build and Output Settings** | Leave the defaults: for Next.js Vercel uses the `build` script from `package.json` (`next build`) |
| **Environment Variables** | **Add them now, before the first deploy** (see below) |

**Environment variables for the first deploy** (remember 2.3: the build needs both):

| Name | Value |
| ---- | ----- |
| `BETTER_AUTH_SECRET` | A **new** random string (`npx auth@latest secret`) |
| `DATABASE_URL` | A **temporary placeholder**, such as `postgres://placeholder:placeholder@localhost:5432/placeholder`. It only exists so the first build can pass (`db/index.ts` throws at import time without it). **We replace it in step 5** |

> The alternative is to let the first deploy **fail** with "DATABASE_URL is not set", connect the database, and redeploy. It works too, and it's a good way to practise reading a build log. But a placeholder gives you a green first build.

4. Click **Deploy**.

## Step 4 — Watch the build

Vercel opens the **build logs**. You'll see: cloning, installing, `next build`, the same **route table** you saw locally, and then **Deploying**. If it fails, **read the red error**. It is almost always the same error you'd see locally (that's the point of Part 2), or a missing environment variable.

When it succeeds you get a URL: `https://your-project.vercel.app`. Open it: the pages that don't need the database (the home page, About) should work. Pages that read the database will error, because the database is still the placeholder.

## Step 5 — Create the database and connect it

Do **Part 3, sections 3.3 and 3.4** now:

1. **Delete the temporary `DATABASE_URL`**: **Project → Settings → Environment Variables → `DATABASE_URL` → Delete**. (If you leave it, the database integration may refuse to add its own variable with the same name.)
2. Create the **Neon** database and **connect it** to the project (Production at least).
3. Check that `DATABASE_URL` and `DATABASE_URL_UNPOOLED` now appear, marked as coming from the integration.
4. **Run the migrations** from your laptop (3.4), and optionally the seed.

## Step 6 — Production environment variables

In **Project → Settings → Environment Variables** add (for **Production**):

| Name | Value |
| ---- | ----- |
| `BETTER_AUTH_URL` | `https://your-project.vercel.app` (your real production URL, **no trailing slash**) |

(`BETTER_AUTH_SECRET` is already there. The GitHub values come next.)

> ⚠️ **Environment variable changes only apply to NEW deployments.** After adding or changing one you must **redeploy**: **Deployments → the latest one → ⋯ → Redeploy**.

## Step 7 — GitHub sign-in for production

The OAuth app you made in class 7 points at `localhost`. Production needs **its own** app, because a GitHub OAuth app has **one** callback URL. Follow the [class 07 README, Part 2](../class_07_auth/README.md#part-2--getting-the-github-credentials-step-by-step), with these values:

| Field | Value |
| ----- | ----- |
| Application name | `Gatherly` |
| Homepage URL | `https://your-project.vercel.app` |
| **Authorization callback URL** | `https://your-project.vercel.app/api/auth/callback/github` |

Then add the new **Client ID** and **Client secret** in Vercel as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (mark the secret as **Secret**), and **redeploy**.

Note: preview deployments have **different URLs**, so GitHub sign-in (one callback URL) works only on production.

## Step 8 — Redeploy and smoke-test the live site

After the variables are in, **redeploy** (Deployments → ⋯ → Redeploy). Then, on the **live URL**, go through this:

| ☐ | Test | Expect |
| - | ---- | ------ |
| ☐ | Open `/` and `/events` | Events load, images show |
| ☐ | Filters, search and pagination | They work and the URL changes |
| ☐ | Open an event, then `/events/<slug>/tickets` | The details page, and the full tickets page |
| ☐ | Click **Get tickets** on `/events` | The modal opens (class 9) |
| ☐ | Click **Continue with GitHub** | GitHub asks, you come back signed in, the header shows your name |
| ☐ | `/dashboard` as an attendee | "The dashboard is for organizers" |
| ☐ | Promote yourself (SQL in Neon), reload `/dashboard` | The panels load |
| ☐ | Reserve a ticket | "Reserved" and the number goes down |
| ☐ | `/api/events` | JSON |
| ☐ | A made-up URL | The not-found page |
| ☐ | **Project → Logs** | No unexpected errors |

## Step 9 — From now on, deploying is `git push`

Every push to `main` creates a **Production** deployment automatically. Every other branch or pull request creates a **Preview** deployment with its own URL, so you can test and share a change before merging.

| You want to... | Do |
| -------------- | --- |
| See why something broke | **Project → Logs** (runtime logs) and the **build log** of a deployment |
| Go back to the last good version | **Deployments → pick an older good one → ⋯ → Promote to Production / Instant Rollback** |
| Redeploy without changing code (new env var) | **Deployments → ⋯ → Redeploy** |
| Try a change safely | Push a branch, open the Preview URL |

## Step 10 — A custom domain (optional)

**Project → Settings → Domains → Add**, then follow the DNS instructions at your domain registrar. Vercel issues the HTTPS certificate for you. Afterwards **update three things** that contain the old URL: `BETTER_AUTH_URL`, the GitHub OAuth app's Homepage and **callback URL**, and then **redeploy**.

---

# Part 5 — Environment variables reference

| Variable | Where it comes from | Environments | Notes |
| -------- | ------------------- | ------------ | ----- |
| `DATABASE_URL` | Injected by the **Neon integration** (pooled) | Production (+ Development) | What the running app uses |
| `DATABASE_URL_UNPOOLED` | Injected by the integration (direct) | Production (+ Development) | **You** use it for migrations and the seed |
| `BETTER_AUTH_SECRET` | **You**: `npx auth@latest secret` | Production (+ Preview) | **New** for production. Never the local one |
| `BETTER_AUTH_URL` | **You**: your production URL | Production | `https://...`, no trailing slash. Changes with a custom domain |
| `GITHUB_CLIENT_ID` | The **production** GitHub OAuth app | Production | Public-ish, but keep it with the rest |
| `GITHUB_CLIENT_SECRET` | The same app | Production | **Secret**. Shown once on GitHub |

How Vercel handles them:

- **Config vs Secret.** When you add a variable you choose a type. **Secret** values are **write-only** after you save (you can replace them but not read them back). Use Secret for anything sensitive.
- **Scopes.** Each variable can apply to **Production**, **Preview** and **Development**. Use different values per environment.
- **New deployments only.** A change never affects a deployment that already exists. Redeploy.
- **Only `NEXT_PUBLIC_*` variables reach the browser.** Everything else is server-only. **Never** put a secret in a `NEXT_PUBLIC_` variable: it gets embedded in the JavaScript everyone downloads.
- **Size.** About 64 KB in total per deployment. More than enough.
- **Pulling them locally:** `vercel env pull` (Part 7) downloads the **Development** variables into a local env file. That file contains real secrets: it must stay out of Git (our `.gitignore` covers `.env` and `.env.local`).

---

# Part 6 — After the first deploy

## 6.1 Watching it

| Where | What you see |
| ----- | ------------ |
| **Project → Logs** | Runtime logs: every request, every `console.error`, and server errors with their **digest** (the `Error ID` your error page shows) |
| **Deployments** | Every build, its log, its status, its URL |
| **Analytics / Speed Insights** (optional) | Visitors and Core Web Vitals. Enable them in the project |
| **Neon console** (Storage → Open in Neon) | Queries, storage, connections, branches, restore |

When a user reports "Error ID 3833995198", search the logs for it. That's what the digest is for.

## 6.2 Keeping it healthy

- **Cold starts.** On the free plan the database **scales to zero** after a period of inactivity, so the first request after a quiet period can take a second longer. That's normal.
- **Rotate secrets** if they might have leaked (OAuth secret, `BETTER_AUTH_SECRET`). Changing `BETTER_AUTH_SECRET` signs everyone out.
- **Backups.** Neon offers point-in-time restore on its plans (check what yours includes). Know where it is **before** you need it.
- **Costs.** The Hobby plan and Neon's free plan are free within their limits. Check the limits on the pricing pages, and keep an eye on usage.

## 6.3 Security, one more time

Production is the real test of classes 6 to 9: validate every input, check the session **and the owner** in every action and query, don't leak internals in errors, and keep secrets out of Git and out of `NEXT_PUBLIC_` variables.

---

# Part 7 — The Vercel CLI (optional)

Everything above can also be done from the terminal:

```bash
npm install --global vercel      # install the CLI
vercel login                     # sign in
vercel link                      # link this folder to a Vercel project (creates the ignored .vercel/ folder)
vercel                           # deploy a PREVIEW of the current folder
vercel --prod                    # deploy to PRODUCTION
vercel env pull                  # download the project's variables into a local env file
vercel env add NAME              # add a variable
vercel logs <deployment-url>     # read logs
```

Run `vercel <command> --help` for the options. The dashboard and Git-based deploys are what you'll use day to day.

---

# Part 8 — Troubleshooting

## Build problems (the deployment never goes live)

| What you see in the build log | Likely cause → fix |
| ----------------------------- | ------------------ |
| `Type error: ...` / `Failed to type check` | The same error as `npm run build` locally. Fix it there first (Part 2.2) |
| `DATABASE_URL is not set` | The variable doesn't exist for the **Production** environment. Add it (a placeholder is fine for the build), redeploy |
| `You are using the default secret ... BETTER_AUTH_SECRET` | Add `BETTER_AUTH_SECRET` and redeploy |
| `Failed query: select ... relation "..." does not exist` (during build) | A page reads the database **at build time** and the tables don't exist yet. Make the page dynamic (Part 2.2, problem 4) or migrate first |
| `Module not found: Can't resolve './EventCard'` | **File-name casing.** Linux is case-sensitive. Match the import to the exact file name |
| `No Next.js version detected` / `Couldn't find any pages or app directory` | Wrong **Root Directory**. Point it at the folder that contains `package.json` |
| `npm ERR!` / `ERESOLVE` during install | Lockfile or dependency conflict. Reproduce with `npm ci` locally |
| A lint error that doesn't happen locally | Different dependency versions: commit your `package-lock.json` and use `npm ci` |

## Runtime problems (the site is live but something is broken)

| Symptom | Likely cause → fix |
| ------- | ------------------ |
| 500 on pages with data. Logs: `relation "events" does not exist` | The production database has **no tables**. Run the migrations (3.4) |
| 500. Logs: `password authentication failed` / `connection refused` | The `DATABASE_URL` is the placeholder, wrong, or not set for Production. Check **Settings → Environment Variables**, then redeploy |
| `too many clients` / `remaining connection slots` | Use the **pooled** `DATABASE_URL` in the app (not the unpooled one) |
| GitHub: `redirect_uri_mismatch` | The OAuth app's callback URL isn't exactly `https://<your-domain>/api/auth/callback/github` |
| Sign-in works but you're signed out on the next page, or odd redirects | `BETTER_AUTH_URL` missing or wrong (an `http://` URL, a different domain, a trailing slash). Fix it and redeploy |
| "Continue with GitHub" button missing | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` not set for Production, or you didn't redeploy |
| Images are broken (400) | The host isn't in `images.remotePatterns` in `next.config.ts` |
| You changed an env var and nothing happened | Env changes apply to **new** deployments only. Redeploy |
| Data on a page never updates | The page was **prerendered at build time** (`○` Static). Make it dynamic, or revalidate |
| Preview deployment has no data or can't sign in | Expected: Preview isn't connected to the database, and GitHub allows one callback URL |
| The first request after a while is slow | Cold start (the function and the free database wake up). Normal |
| It worked locally, fails on Vercel | A difference: env vars, file-name casing, Node version, or the database. Diff the two with the checklist |

---

## 🏋️ Try it yourself

1. **Reproduce the blockers.** Run `npm run check` and `npm run build` on this folder **before** fixing anything. Match every error to a row of the table in 2.2.
2. **Fix them one by one**, re-running the command after each. After which fix does `typecheck` pass? After which does `lint` pass? After which does `build` pass?
3. **Prove the build needs the variables.** Run `npm run build` with no environment variables, then with only `DATABASE_URL`, then with both. Which error appears each time, and in which file?
4. **Read the route table.** Before fix 4, which route showed as `○` Static although it reads the database? What changed after the fix?
5. **Deploy it.** Follow Part 4 with your own repository. Note the build time and the final URL.
6. **Break production on purpose, safely.** Delete `BETTER_AUTH_URL` in Vercel and redeploy. What changes on the sign-in flow? Put it back.
7. **Find a log line.** Cause an error on the live site (open `/events/no-such-event`, or temporarily break a query on a branch). Find it in **Project → Logs**.
8. **Preview vs production.** Push a branch with a visible change (a different heading). Where does it show up, and where doesn't it?
9. **Roll back.** Deploy a change that breaks the home page, then use **Instant Rollback** to restore the previous deployment. How long did it take?
10. **A schema change on production.** Add a nullable column to a table, generate the migration, read the SQL, apply it to production (3.4/3.5), then deploy the code that uses it. Why is the order safe for an additive change?

---

## 🔗 Useful links

**Vercel**

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) and [deploying a project](https://vercel.com/docs/deployments)
- [Configuring a build](https://vercel.com/docs/builds/configure-a-build) (Framework Preset, **Root Directory**, Node.js version)
- [Environment variables](https://vercel.com/docs/environment-variables) and [`vercel env`](https://vercel.com/docs/cli/env)
- [Environments (Production, Preview)](https://vercel.com/docs/deployments/environments) and [Git integration](https://vercel.com/docs/git)
- [Postgres on Vercel](https://vercel.com/docs/postgres) and the [Neon integration](https://vercel.com/marketplace/neon)
- [Domains](https://vercel.com/docs/domains) and [rollbacks](https://vercel.com/docs/deployments/instant-rollback)
- [Vercel CLI](https://vercel.com/docs/cli)

**Neon**

- [Neon + Vercel native integration](https://neon.com/docs/guides/vercel-native-integration)
- [Connection pooling (pooled vs direct)](https://neon.com/docs/connect/connection-pooling)

**Next.js**

- [Deploying](https://nextjs.org/docs/app/getting-started/deploying) and the [production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Environment variables](https://nextjs.org/docs/app/guides/environment-variables)

**Better Auth and GitHub**

- [Better Auth: options and base URL](https://www.better-auth.com/docs/reference/options)
- [Creating a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

**Previous classes**

- [Class 09 README](../class_09_adv_routing/README.md): the app you're deploying
- [Class 07 README](../class_07_auth/README.md): GitHub credentials, sessions and authorization
- [Class 03 README](../class_03_db/README.md): PostgreSQL, Drizzle and migrations
