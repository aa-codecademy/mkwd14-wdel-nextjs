# Class 07 — Authentication & Authorization with Better Auth

Until now, Gatherly didn't know **who** was using it. In class 6 a fixed "demo organizer" created every event. In this class the app learns to **recognise people**: they sign in (with **GitHub**, and with email and password on the server side), the server remembers them with a **session**, and the app decides **what each person may do** with **roles**.

We use **[Better Auth](https://www.better-auth.com/)**, a library that handles sign-up, sign-in, sessions and OAuth, so we don't write security-critical code ourselves.

> 🧭 **Where we are:** Better Auth is installed and connected to our database, "Continue with GitHub" works, the header shows the signed-in user, `/dashboard` is guarded by role, and the old `users` table has been replaced. Some of it is **unfinished**: the create-event form still acts as the demo organizer, the email/password form has no screen yet, and a few pages and queries still skip the checks. Each gap is listed in [Known issues](#known-issues-in-this-snapshot) and is a good exercise.

**On this page:**
[Run it](#-run-it) · [Part 1: The ideas](#part-1--the-ideas-before-any-code) · [Part 2: GitHub credentials](#part-2--getting-the-github-credentials-step-by-step) · [Part 3: Implementing Better Auth](#part-3--implementing-better-auth-step-by-step) · [Part 4: Authorization in practice](#part-4--authorization-in-practice) · [Part 5: What changed in the data](#part-5--what-changed-in-the-data) · [Known issues](#known-issues-in-this-snapshot) · [Exercises](#-try-it-yourself) · [Links](#-useful-links)

## 📁 What's in this folder

| Folder                    | What it is                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | The course app at this point. Every new file has comments written for students, so read the code next to this README |

---

## 🚀 Run it

You need the PostgreSQL server from class 3 running ([class 03 README](../class_03_db/README.md), Steps 1–2).

```bash
cd class_07_auth/gatherly
npm install                  # new packages: better-auth and @better-auth/drizzle-adapter
cp .env.example .env         # skip if you already have .env (Windows PowerShell: Copy-Item .env.example .env)
```

Then open `.env` and fill in **three new values** (`DATABASE_URL` stays as before):

| Variable               | What to put there                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | A long random string. Generate it: `npx auth@latest secret` (or `openssl rand -base64 32`)          |
| `GITHUB_CLIENT_ID`     | From your GitHub OAuth app. See [Part 2](#part-2--getting-the-github-credentials-step-by-step)      |
| `GITHUB_CLIENT_SECRET` | The same place. Shown **only once**                                                                 |

The GitHub values are optional: without them the app runs, but the "Continue with GitHub" button doesn't appear.

```bash
npm run db:migrate           # NEW: migration 0004 creates the 4 auth tables and REPLACES the old `users` table
npm run db:seed              # resets the database and fills it with demo data
npm run dev
```

> ⚠️ **Migration 0004 deletes the old `users` table** (`DROP TABLE "users" CASCADE`) and everything that depended on it, then points `events` and `orders` at the new `user` table. On a database with data from earlier classes, run `npm run db:seed` afterwards: it wipes and refills everything.

### Make yourself an organizer

When you sign in with GitHub, Better Auth creates **your** user with the role **`attendee`**. The dashboard is for organizers, so at first you'll land on the "The dashboard is for organizers" page. That's the authorization working! To become an organizer, change your role in the database. Sign in once, then run (with **your** GitHub email):

```sql
UPDATE "user" SET role = 'organizer' WHERE email = 'you@example.com';
```

`"user"` needs the double quotes: `user` is a reserved word in PostgreSQL. Run it in `psql "<your DATABASE_URL>"`, or with Docker:

```bash
docker exec -it gatherly-db psql -U postgres -d gatherly -c "UPDATE \"user\" SET role = 'organizer' WHERE email = 'you@example.com';"
```

Reload `/dashboard`. The role is read from the database on each request, so no need to sign in again.

> The seeded users (`avenga`, `js-mk`, `soundwave`, `demo-attendee`) are **data**: they own the demo events and orders, but they have no password or GitHub link, so nobody can sign in as them.

Try these:

| URL                                                              | What you should see                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [/events](http://localhost:3000/events)                          | The header shows **Sign in**                                                     |
| [/dashboard](http://localhost:3000/dashboard) (signed out)       | You're sent to `/sign-in?next=/dashboard`                                        |
| [/sign-in](http://localhost:3000/sign-in)                        | The page with **Continue with GitHub**                                           |
| After signing in as an attendee                                  | Back on the site, the header shows your name and **Sign out**; `/dashboard` → "The dashboard is for organizers" |
| After you promote yourself                                       | The header gets a **Dashboard** link, and `/dashboard` opens                     |

---

# Part 1 — The ideas, before any code

## 1.1 Authentication vs authorization

These two words sound alike and mean different things. You'll use both every day:

| | **Authentication** ("authn") | **Authorization** ("authz") |
| --- | --- | --- |
| The question | **Who are you?** | **What are you allowed to do?** |
| Happens | When you sign in | On **every** request that needs a permission |
| Examples | A password, "Continue with GitHub", a passkey | "Only organizers open the dashboard", "only the owner edits this event" |
| In Gatherly | Better Auth: sessions, GitHub login | Roles (`lib/roles.ts`) and the guards (`lib/session.ts`) |
| When it fails | **401** Unauthorized: "I don't know who you are" → sign-in page | **403** Forbidden: "I know who you are, but no" → a "not allowed" page |

The failure case matters: a visitor who isn't signed in should be **sent to sign in**. An attendee who *is* signed in should be **told they aren't allowed**. Sending them to the sign-in page would be confusing, because they already signed in. That's why we have `/sign-in` **and** `/organizers-only`.

## 1.2 How a website remembers you: sessions and cookies

HTTP has no memory. Every request is a stranger. After you sign in, the server must recognise you on the next click, **without** asking for your password again. The usual solution is a **session**:

```
1. You sign in.                   ──►  server checks the proof (password, or GitHub)
2. The server creates a SESSION   ──►  a row in the `session` table:  { token: "k3j9…", userId, expiresAt }
3. It sends the token as a COOKIE ◄──  Set-Cookie: better-auth.session_token=k3j9…; HttpOnly
4. Every later request            ──►  the browser attaches the cookie automatically
5. The server looks the token up  ──►  finds the session row, then the user: "this is Ana"
6. Sign out                       ──►  the row is deleted and the cookie cleared: the token is dead
```

Key facts to remember:

- The **cookie holds only a random token**, not your name or role. All the real information is in the database. A stolen token **is** that user, so it's protected: `HttpOnly` means JavaScript on the page **cannot read it**, so a script injected into the page can't steal it.
- Because sessions are **rows in our database**, we can **revoke** them (delete the row to sign someone out everywhere), and they **expire** (by default after about a week).
- The browser sends the cookie automatically, so Server Components, Server Actions and the proxy can all read it from the request headers.
- On the server we ask Better Auth "who is this request from?" with `auth.api.getSession({ headers })`. On the client we use the `useSession()` hook.

## 1.3 Passwords

If someone signs up with an email and a password, rule number one is: **never store the password**. The database stores a **hash**, a one-way scramble: from the hash you can't get the password back, but you can check a typed password by hashing it the same way and comparing. Better Auth does this for us (with a deliberately slow hash, so guessing is expensive). The hash lives in `account.password`. You never write this code yourself, which is the whole point of using a library for authentication.

## 1.4 OAuth: "Continue with GitHub"

OAuth lets users sign in **with an account they already have**, so we never handle their password. GitHub vouches for them. The dance has six steps (the same one behind every "Continue with Google / GitHub / ..." button):

```
 You          Gatherly (our server)                         GitHub
  │  click "Continue with GitHub"
  │ ───────────────►│ 1. the auth client asks our server to start
  │ ◄───────────────│ 2. our server answers with GitHub's authorization URL
  │ ───────────────────────────────────────────────────────►│ 3. the browser goes to github.com
  │                                                          │    you log in (if needed) and click "Authorize"
  │ ◄────────────────────────────────────────────────────────│ 4. GitHub sends the browser BACK to our callback URL
  │ ───────────────►│    /api/auth/callback/github?code=one-time-code
  │                 │ 5. our server swaps the code for your profile, using the client SECRET
  │                 │    creates or finds your `user` + `account`, creates a `session`, sets the cookie
  │ ◄───────────────│ 6. you land on the page you wanted (`callbackURL`)
```

Three things identify **our app** to GitHub, and you create all of them when you register an "OAuth app" ([Part 2](#part-2--getting-the-github-credentials-step-by-step)):

| Thing                | What it is                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| **Client ID**        | Public. "This is the app called Gatherly"                                                               |
| **Client secret**    | **Private**, like a password. It proves that a request really comes from our server                     |
| **Callback URL**     | The one address GitHub is allowed to send users back to: `http://localhost:3000/api/auth/callback/github` |

The callback URL is a security feature: if it didn't have to match exactly, an attacker could make GitHub send the one-time code to *their* site.

## 1.5 Roles: who may do what

A **role** is a label on a user that stands for a set of permissions. Gatherly has three, stored in `user.role`:

| Role        | May...                                                         |
| ----------- | -------------------------------------------------------------- |
| `attendee`  | Browse events and buy tickets. **Everyone starts here**        |
| `organizer` | Everything an attendee can, **plus** create and manage events  |
| `admin`     | Everything, **plus** manage users                              |

Two principles:

- **Least privilege:** give each person the **minimum** they need. That's why a new account is an `attendee`, and why `parseRole()` turns anything unknown into `attendee` (when in doubt, fewer rights).
- **The client never chooses its own role.** The sign-up form can't send `role=admin`. Better Auth marks that field as not accepted from the client.

## 1.6 Where do you check? Four layers

Beginners ask: "I hid the Dashboard link from attendees, is the dashboard protected?" **No.** Anyone can type the URL. Protection comes in layers, and **each one assumes the one before it failed**:

| Layer                       | Example in Gatherly                                  | What it is worth                                                                                  |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. **The UI**               | The Dashboard link only shows for organizers         | **Courtesy.** Not security: a person can still type the address                                   |
| 2. **The proxy**            | `proxy.ts` redirects visitors with **no cookie** away from `/dashboard` | **A bouncer.** It only checks that a cookie *exists*, and anyone can forge a cookie. Fast, optimistic, never enough |
| 3. **The page**             | `requireOrganizer()` at the top of `/dashboard`      | **A lock.** It asks the **database**: is this session real, whose is it, is the role right?        |
| 4. **The action and the query** | A Server Action that calls `requireOrganizer()`; a query that filters `WHERE organizer_id = <me>` | **The vault.** The only layer that protects the data itself, even from requests that skip your pages |

Rule of thumb: **protect where the data or the change is, not only where the user clicks.** A Server Action is a public endpoint (class 6). A page check never covers the actions behind it.

---

# Part 2 — Getting the GitHub credentials, step by step

You need a **GitHub OAuth app**. It's free and takes two minutes. You create **one app per environment**: this one is for development on your laptop (`localhost`).

### Step 1: Open the developer settings

1. Sign in to [github.com](https://github.com).
2. Click your **profile picture** (top right) → **Settings**.
3. In the left sidebar, scroll **all the way down** and click **Developer settings**.
4. Click **OAuth Apps**, then **New OAuth App** (if it's your first, the button says **Register a new application**).

Shortcut: [github.com/settings/developers](https://github.com/settings/developers).

### Step 2: Fill in the form

| Field                          | Value                                                | Notes                                                                       |
| ------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| **Application name**           | `Gatherly (local)`                                   | Users see this name on the "Authorize" screen. Anything you like            |
| **Homepage URL**               | `http://localhost:3000`                              | Where your app lives. Must match the port you run on                        |
| **Application description**    | *(optional)*                                         | Leave it empty, or write "Course project"                                   |
| **Authorization callback URL** | `http://localhost:3000/api/auth/callback/github`     | ⚠️ **The one that matters.** Copy it exactly: same port, same path, no trailing slash |
| **Enable Device Flow**         | *(leave unchecked)*                                  | For apps with no browser, such as a CLI                                      |

Click **Register application**.

> 💡 Why that exact callback URL? Better Auth serves its GitHub callback at `/api/auth/callback/github` (that's the `app/api/auth/[...all]/route.ts` file). GitHub only ever redirects users to the URL you registered. If they differ by one character, GitHub refuses with a `redirect_uri_mismatch` error.

### Step 3: Copy the Client ID

On the next page you'll see **Client ID**, a short string like `Ov23li...`. Copy it. It's not secret.

### Step 4: Generate the Client secret

1. Click **Generate a new client secret**. (GitHub may ask for your password or a 2FA code.)
2. **Copy the secret immediately.** GitHub shows it **only once**. If you leave the page, you can't read it again, only generate a new one.

### Step 5: Put them in `.env`

In `class_07_auth/gatherly/.env`:

```bash
GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=paste-the-long-secret-here
BETTER_AUTH_SECRET=paste-a-generated-secret-here
```

Generate `BETTER_AUTH_SECRET` with `npx auth@latest secret` (or `openssl rand -base64 32`). It's a separate secret: it signs and encrypts Better Auth's data, and has nothing to do with GitHub.

### Step 6: Restart and test

1. **Restart `npm run dev`.** Environment variables are read **when the server starts**, so the new values are invisible until you do.
2. Open [/sign-in](http://localhost:3000/sign-in): the **Continue with GitHub** button should be there.
3. Click it → GitHub asks you to authorize → you land back on Gatherly, and the header shows your name.
4. Look in the database: a row in `user`, one in `account` (`provider_id = 'github'`), one in `session`.

### 🔒 Keep the secret secret

- `.env` is in `.gitignore` for a reason: **never commit it**. The template `.env.example` has the variable names and **empty** values, and that's what gets committed.
- If the secret leaks (pushed to GitHub, pasted in a chat), go back to the OAuth app and click **Generate a new client secret**, then **delete the old one**. Treat a leaked secret as burned.
- **Production needs its own OAuth app**, with your real address: Homepage `https://your-domain.com`, callback `https://your-domain.com/api/auth/callback/github`. Put its id and secret in your hosting provider's environment variables, never in the repository.

### Troubleshooting

| Problem                                                          | Likely cause → fix                                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| No "Continue with GitHub" button                                 | One of `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` is empty or missing, or you didn't restart the dev server |
| GitHub shows `redirect_uri_mismatch`                             | The registered callback URL isn't exactly `http://localhost:3000/api/auth/callback/github`. Check the port (3000 vs 3001) and typos |
| `Application not found` / "Not Found" on GitHub                  | The client id is wrong or has a typo (extra space, missing character)                                       |
| `Bad credentials` / error right after authorizing                | The client **secret** is wrong, or you regenerated it and kept the old value                                |
| I lost the client secret                                         | You can't read it again. Click **Generate a new client secret** and update `.env`                           |
| The app runs on another port (e.g. 3001)                         | Edit the OAuth app's Homepage and callback URLs to use that port, or stop whatever uses 3000                |
| An error about the email (`email_not_found`)                     | Your GitHub account has no email Better Auth can read. Add an email in GitHub → Settings → Emails, and uncheck "Keep my email addresses private" or make sure a primary email exists |

---

# Part 3 — Implementing Better Auth, step by step

This is what we did in class, in order. Each step names the file, so you can open it and compare. (To add authentication to **your own** project, follow the same steps.)

## Step 1. Install

```bash
npm install better-auth @better-auth/drizzle-adapter
```

- `better-auth`: the library.
- `@better-auth/drizzle-adapter`: lets it read and write through **our Drizzle `db`**. (Better Auth's docs import it from `better-auth/adapters/drizzle`; in version 1.7 it's also its own package. Either way, copy the import you find in your `package.json` version.)

## Step 2. Environment variables

`BETTER_AUTH_SECRET` (a long random string) and, optionally, the two GitHub values from [Part 2](#part-2--getting-the-github-credentials-step-by-step). The docs also mention `BETTER_AUTH_URL` (your app's base URL, e.g. `http://localhost:3000`): optional locally, but set it in production.

## Step 3. The auth server: `db/auth.ts`

The one file where Better Auth is **configured**. Read it top to bottom, it's short:

```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),         // 1. where the data lives
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },  // 2. passwords
  socialProviders: github,                                           // 3. "Continue with GitHub"
  user: { additionalFields: { handle: { type: 'string', required: false, unique: true, input: false } } },  // 4. an extra column
  plugins: [admin({ defaultRole: 'attendee', adminRoles: ['admin'] }), nextCookies()],     // 5. roles + Server Action cookies
});
```

| Option                | What it does                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `database`            | Stores users and sessions in **PostgreSQL**, through Drizzle, using the tables in `db/auth-schema.ts`                |
| `emailAndPassword`    | Turns on password sign-up. `autoSignIn`: signed in right after sign-up. The password is **hashed**                   |
| `socialProviders`     | Turns on GitHub. It's built conditionally: **no env values → no GitHub**, and the app still starts                   |
| `additionalFields`    | Adds our own column to `user`. `input: false`: the **client can't set it**, only our server                          |
| `admin(...)` plugin   | Adds a `role` to every user (default `attendee`), and `banned` / `banReason` / `banExpires`                          |
| `nextCookies()` plugin | Lets **Server Actions** set the session cookie. Docs: it must be the **last** plugin                                |

The file starts with `import 'server-only'`: it holds secrets, so a Client Component importing it **fails the build**. At the bottom, `typeof auth.$Infer.Session` gives us a `Session` type that matches this exact configuration (so `session.user.role` is typed).

## Step 4. The database tables

Better Auth needs four tables: `user`, `session`, `account`, `verification`. The CLI can write them for you in Drizzle's format:

```bash
npx auth@latest generate
```

That produced `db/auth-schema.ts`. Then the normal Drizzle workflow from class 3:

```bash
npm run db:generate     # writes drizzle/0004_*.sql: READ IT
npm run db:migrate      # applies it
```

What `0004_petite_penance.sql` does. Open it and find each line:

| In the migration                                                                 | What it means                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `CREATE TABLE "user"`, `"session"`, `"account"`, `"verification"`                | The four Better Auth tables                                                           |
| `DROP TABLE "users" CASCADE`                                                     | Our **old** `users` table is deleted. Better Auth's `user` replaces it ⚠️ data loss    |
| `ALTER COLUMN "organizer_id" SET DATA TYPE text` (and `"user_id"` on orders)     | Better Auth's ids are **strings**, our old ones were uuids, so the columns pointing at users change type |
| `ADD CONSTRAINT "events_organizer_id_user_id_fk" ...`                            | `events.organizer_id` now points at `user.id`. Same for `orders.user_id`              |

**Why one user table?** An organizer is a user. Keeping two tables ("Better Auth's users" and "our users") means keeping them in sync forever. One table, with our own columns added (`handle`, `role`), is simpler. The change in `db/schema.ts` is small: `import { user } from './auth-schema'`, and the foreign keys point there.

## Step 5. The route handler: `app/api/auth/[...all]/route.ts`

```ts
export const { GET, POST } = toNextJsHandler(auth);
```

Two lines that expose Better Auth over HTTP, under `/api/auth/*`: sign-in, sign-out, get-session, and the `callback/github` URL from Part 2. `[...all]` is a **catch-all** segment, and `route.ts` is the special file for API endpoints (the counterpart of `page.tsx`). Keep this path: it's Better Auth's default, and the GitHub callback depends on it.

## Step 6. The auth client: `lib/auth-client.ts`

```ts
export const authClient = createAuthClient({
  plugins: [adminClient(), inferAdditionalFields<typeof auth>()],
});
export const { signIn, signUp, signOut, useSession } = authClient;
```

The browser-side twin of `auth`. It has **no secrets**: it just sends requests to `/api/auth/*`, and the browser attaches the cookie. The plugins give it the same types the server has (the `role`, the extra `handle`). Note `import type { auth }`: **only the type** crosses over, no server code.

| You write                                         | What it does                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `signIn.social({ provider: 'github', callbackURL })` | Starts the GitHub flow                                            |
| `signIn.email({ email, password })`               | Signs in with a password                                             |
| `signUp.email({ name, email, password })`         | Creates an account                                                   |
| `signOut()`                                       | Ends the session                                                     |
| `useSession()`                                    | A hook: `{ data: session, isPending }`. Re-renders when it changes   |

## Step 7. Reading the user on the server: `lib/session.ts`

```ts
await auth.api.getSession({ headers: await headers() })
```

We hand Better Auth the request's headers. It reads the cookie, finds the session row, checks it hasn't expired, and returns `{ session, user }` or `null`. Three helpers build on it:

| Helper                     | Returns / does                                               | Failure                                    |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| `getCurrentUser()`         | The user, or `null`. **Never redirects**                     | `null`                                     |
| `requireUser(returnTo)`    | A signed-in user                                             | Redirect to `/sign-in?next=<returnTo>`     |
| `requireOrganizer(returnTo)` | A signed-in **organizer or admin**                         | Not signed in → sign-in. Wrong role → `/organizers-only` |

Use one **at the top** of every page, action or query that needs a user:

```ts
const organizer = await requireOrganizer('/dashboard');   // stops here if not allowed
```

Because `redirect()` throws, nothing below that line runs, and TypeScript knows `organizer` is a real user afterwards.

## Step 8. The proxy: `proxy.ts`

Code that runs **before** a request reaches a page (in Next.js 16 `proxy.ts` replaces `middleware.ts`, and the function is called `proxy`). Ours sends anyone **without a session cookie** away from `/dashboard/*` to the sign-in page, remembering where they were going in `?next=`:

```ts
export const config = { matcher: ['/dashboard/:path*'] };   // run only for these paths
```

> ⚠️ `getSessionCookie` only checks that a cookie **exists**, not that it's valid. Anyone can create a cookie by hand in the browser (exercise 3). So the proxy is a fast first filter for honest visitors, and the **real** check is `requireOrganizer()` inside the page. Better Auth's docs give the same warning. Also keep the proxy **cheap**: no database calls in it.

## Step 9. The sign-in UI

| File                                        | Job                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `app/(marketing)/sign-in/page.tsx`, `sign-up/page.tsx` | Server pages: read `?next=` and whether GitHub is configured, then render the form     |
| `app/(marketing)/_components/auth.form.tsx` | Client Component: the title and the **Continue with GitHub** button (`signIn.social`)              |
| `app/(marketing)/_components/safe-next.ts`  | Makes the `?next=` value **safe** (see below)                                                      |
| `components/account-menu.tsx`               | Client Component in the header: "Sign in", or name + Dashboard (organizers) + "Sign out"           |
| `app/(marketing)/organizers-only/page.tsx`  | The "403" page for signed-in attendees                                                             |

Two details worth understanding:

**Why does the server page read the env vars and pass a `boolean`?** A Client Component must never see `process.env.GITHUB_CLIENT_SECRET`. The server page checks that both values exist and passes only `githubEnabled: true | false` down.

**Why `safeNext`?** After signing in, we send people back to the page they wanted (`/sign-in?next=/dashboard`). But `next` is **user input**: someone could send a victim `/sign-in?next=https://evil.example`, and if we obeyed, the victim would sign in on *our* site and land on *theirs*. That's an **open redirect**. `safeNext` only accepts a **path on our site** (one leading `/`, not `//`). (One hole remains: browsers read a backslash like a slash, so `/\evil.example` slips through. A stricter version rejects `\`. See exercise 8.)

**Why `router.refresh()` after `signOut()`?** The page on screen was rendered by the server for the *old* user. `refresh()` re-runs the Server Components, so a protected page doesn't stay visible after you sign out.

## Step 10. Roles

| File             | Job                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `types/role.ts`  | `type Role = 'attendee' \| 'organizer' \| 'admin'`                                           |
| `lib/roles.ts`   | `parseRole()`: any string → a valid `Role` (unknown → `attendee`). `canManageEvents(role)`   |

`user.role` is plain **text** in the database, so it could hold a typo. `parseRole` is the safety net, and `canManageEvents` is the **one place** that says who may manage events. Change the rule there and it changes everywhere. The `admin` plugin only knows `admin` and `user` itself; **`organizer` is our own role**, a string that our code understands.

## Step 11. Protect things

| What                                  | Status in this snapshot                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/dashboard` page                     | ✅ `requireOrganizer('/dashboard')` + the proxy                                                    |
| `/dashboard/events/new` **page**      | ❌ only the proxy (a cookie check). A signed-in attendee can open it                               |
| `createEvent` **Server Action**       | ❌ still the demo organizer from class 6 (and it no longer compiles: the `users` table is gone)    |
| The dashboard **query**               | ❌ `getOrganizerEvents(organizer.id)` receives the id and **ignores** it: everyone sees everything |

Closing these gaps is the best practice for this class. See [Part 4](#part-4--authorization-in-practice) and the exercises.

## Step 12. Test it

| Do this                                                              | You should see                                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Open `/dashboard` signed out                                         | Redirect to `/sign-in?next=%2Fdashboard`                                      |
| Click **Continue with GitHub**, authorize                            | Back on the site; the header shows your name                                  |
| Check the database                                                   | New rows in `user`, `account` (`github`) and `session`                        |
| Open `/dashboard` as an attendee                                     | "The dashboard is for organizers"                                             |
| Promote yourself (SQL above), reload `/dashboard`                    | The dashboard opens; the header has a **Dashboard** link                      |
| Click **Sign out**                                                   | The header says **Sign in**; `/dashboard` redirects you again                 |
| DevTools → Application → Cookies                                     | A `better-auth.session_token` cookie while signed in, marked **HttpOnly**     |
| Open `/sign-in?next=https://example.com`, sign in                    | You land on the home page, **not** on example.com                             |

## Follow one request: visiting `/dashboard`

```
browser ── GET /dashboard (+ the session cookie) ──►
   1. proxy.ts            cookie exists?   no  → redirect to /sign-in?next=/dashboard
                                           yes ↓
   2. the dashboard page  requireOrganizer('/dashboard')
        └ getCurrentUser   auth.api.getSession({ headers }) → looks the token up in the `session` table
              no session            → redirect to /sign-in
              session, wrong role   → redirect to /organizers-only
              session, organizer    ↓
   3. getOrganizerEvents  reads the events (should filter by organizer: see Known issues)
   4. the page renders    and is sent to the browser
```

---

# Part 4 — Authorization in practice

## 4.1 The guard pattern

At the top of anything that needs a permission:

```ts
const organizer = await requireOrganizer('/dashboard/events/new');
```

For a **page**, the redirect sends the user somewhere helpful. For a **Server Action**, remember that it's a public endpoint: a script calling it directly gets the redirect too, which is fine, it's refused. What matters is that the **check is the first thing that runs**.

## 4.2 Ownership: "is this MINE?"

Being an organizer doesn't mean you can touch **every** event, only **your own**. Checking the **role** is not enough. You also check **ownership**. Forgetting this is the most common serious security bug in web apps, so common it has a name: **broken access control** (OWASP's #1). Two classic forms:

- **Seeing other people's data.** `getOrganizerEvents` returns every event instead of the signed-in organizer's. (That's the gap in this snapshot.)
- **Changing other people's data (IDOR).** A "publish" button sends `eventId`. If the action does `UPDATE events SET status = 'published' WHERE id = <eventId>`, **any** organizer can publish **anyone's** event by changing the id in the request.

The fix is always the same: **put the owner in the `WHERE`**:

```ts
// reading
db.query.events.findMany({ where: eq(events.organizerId, organizer.id), ... })

// changing: only a row that is BOTH this id AND mine
await db.update(events)
  .set({ status: 'published' })
  .where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
  .returning({ id: events.id });   // empty result = "not yours (or doesn't exist)"
```

The owner id comes from **the session** (`organizer.id`), never from the form or the URL.

## 4.3 Where each check lives

| Layer           | File(s)                                          | Done?                                            |
| --------------- | ------------------------------------------------ | ------------------------------------------------ |
| UI              | `components/account-menu.tsx`                    | ✅ (courtesy only)                                |
| Proxy           | `proxy.ts`                                       | ✅ cookie check                                   |
| Page            | `dashboard/page.tsx`                             | ✅ · `dashboard/events/new/page.tsx` ❌            |
| Action          | `app/actions/events.ts`                          | ❌ demo organizer                                 |
| Query           | `db/queries/dashboard.ts`                        | ❌ ignores the owner                              |

## 4.4 Common mistakes

| Mistake                                                         | Why it hurts                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| "I hid the button" is the protection                            | The URL still works. Check on the server                                              |
| Trusting a cookie's **existence** (the proxy alone)             | Cookies can be forged. Validate the session with `getSession`                         |
| Checking the role but not the **owner**                         | Any organizer reads or edits any organizer's data                                     |
| Taking `userId` / `organizerId` / `role` from a **form field**  | The user can edit it. Take it from the session                                        |
| Guarding the page but not the **action** behind it              | The action is its own public endpoint                                                 |
| Redirecting to a `?next=` **without checking it**               | Open redirect: your site becomes a phishing tool                                      |
| Telling the world *why* a login failed ("no such email")        | Helps attackers find real accounts. Say "invalid email or password"                   |
| Committing `.env`                                               | The secrets are public forever, even if you delete the file later                     |

---

# Part 5 — What changed in the data

```
BEFORE (classes 3–6)                         NOW (class 7)

users (uuid id)                              user (text id)       ◄── Better Auth's table
  ▲                                            ▲   ▲   ▲
  │ events.organizer_id (uuid)                 │   │   └ session.user_id        (cascade)
  │ orders.user_id (uuid)                      │   └──── account.user_id        (cascade)
                                               │ events.organizer_id (text)
                                               │ orders.user_id (text)
                                             verification (standalone)
```

- **`users` is gone**; `user` replaces it, with `role`, `handle` and the ban fields added.
- **`session`** (one row per signed-in browser) and **`account`** (how each user signs in) are new.
- **Deleting a user** deletes their sessions and accounts (`cascade`), but **not** their events or orders (those have no `cascade`: you can't delete a user who has events or orders, which protects history).
- **The seed** (`db/seed.ts`) wipes everything and inserts `user` rows directly: 3 fixed organizers, a demo attendee, and random attendees. It creates **no `account` rows**, so no seeded user can sign in. They exist to own events and orders.
- **`organizerId` and `userId` are `text`** now, because that's what Better Auth's ids are.

---

## Known issues in this snapshot

You'll meet these when you run `npm run check` or try the app. Each is on purpose a good exercise:

| Problem                                                                          | Why / how to fix                                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run typecheck`: `db/demo-users.ts` has no exported member `users`           | The old `users` table is gone. The file is **obsolete**: delete it once the actions use the session (next row) |
| **`createEvent` still uses `getDemoOrganizer()`** (the form fails with "Demo user ... not found") | Replace it with `const organizer = await requireOrganizer('/dashboard/events/new')`, and use `organizer.id` as `organizerId` |
| `/dashboard/events/new` **page** has no guard                                    | Add `await requireOrganizer('/dashboard/events/new')` at the top. A signed-in attendee can open it now |
| **`getOrganizerEvents` ignores the owner**: every organizer sees everyone's events | Restore the commented-out `where: eq(events.organizerId, organizerId)`, and remove the unused-variable lint errors |
| `/sign-in` shows "Create an account" and the function is named `SingInPage`      | The page passes `mode="sign-up"`. Change it to `"sign-in"` and fix the typo                       |
| No email/password form, although `emailAndPassword` is on                        | `AuthForm` only has the GitHub button. Build the fields with `signIn.email` and `signUp.email` (exercise 6) |
| The dashboard says "Signed in as JohnDoe"                                        | Hard-coded. Print `organizer.name`                                                                |
| `safeNext` lets `/\evil.example` through                                         | Also reject any value containing a backslash                                                      |
| `getCurrentUser()` queries the database on every call                            | In one request it may be called several times. Wrap it in React's `cache()` to share the result   |
| Two files claim the home page: `app/page.tsx` and an empty `app/(marketing)/page.tsx` | One URL can't have two pages. Move the hero into `(marketing)/page.tsx` and delete `app/page.tsx` |
| `npm run typecheck` fails in `mocks/` and `types/gatherly-event.ts`              | Unused leftovers importing types that no longer exist (`Event`, `User`). Delete them              |
| Lint: `'quantity' ... never used`, `'eq'` and `'organizerId'` never used         | The first belongs to the unfinished ticket types, the other two to the owner `where` above        |

---

## 🏋️ Try it yourself

1. **Create your own GitHub OAuth app** ([Part 2](#part-2--getting-the-github-credentials-step-by-step)), sign in, and look at the new rows in `user`, `account` and `session`. What is in `account.provider_id`? What is in `session.token`?
2. **Promote and demote yourself.** Become an organizer with the SQL, open `/dashboard`, then set the role back to `attendee`. Where do you land, and which file sends you there?
3. **Forge a cookie.** Sign out. In DevTools → Application → Cookies, create a cookie named `better-auth.session_token` with the value `abc`, and open `/dashboard`. Does the proxy let you in? Does the page? Which line stopped you, and what does this teach you about the proxy?
4. **Guard the form.** Add `requireOrganizer(...)` to the top of `dashboard/events/new/page.tsx` **and** replace `getDemoOrganizer()` in `createEvent`. Use `organizer.id` as the event's owner. Then delete `db/demo-users.ts`.
5. **Fix the leak.** Restore the `where` in `getOrganizerEvents`. Test it: in `psql`, change one event's `organizer_id` to another user's id, and check it disappears from your dashboard.
6. **Build the email/password form.** Add fields to `AuthForm`: sign-up (name, email, password) and sign-in (email, password). Use `signUp.email` and `signIn.email`. Show errors in plain language, show a pending state, and **don't** reveal whether an email exists.
7. **Fix the sign-in page** (`mode`, the typo), and show `organizer.name` on the dashboard.
8. **Close the open-redirect hole.** Test `/sign-in?next=/\evil.example`. Make `safeNext` reject it.
9. **Write the Publish / Unpublish action.** A Server Action `setEventStatus(eventId, formData)`. Use the ownership pattern from 4.2: the owner is in the `WHERE`. What happens if a different organizer sends your event id?
10. **Inspect the cookie.** In DevTools find the session cookie. Is it `HttpOnly`? Try `document.cookie` in the console. Why can't you see the token? What would an attacker with a script on your page get?
11. **Think.** Why does `parseRole()` return `attendee` for unknown values instead of throwing an error? Why is `role` not a field the sign-up form can send?

---

## 🔗 Useful links

**Better Auth**

- [Installation](https://www.better-auth.com/docs/installation) and [Next.js integration](https://www.better-auth.com/docs/integrations/next) (route handler, `nextCookies`, `proxy.ts`)
- [GitHub provider](https://www.better-auth.com/docs/authentication/github) and [Email & password](https://www.better-auth.com/docs/authentication/email-password)
- [Drizzle adapter](https://www.better-auth.com/docs/adapters/drizzle), [Database schema](https://www.better-auth.com/docs/concepts/database) and [Session management](https://www.better-auth.com/docs/concepts/session-management)
- [Admin plugin](https://www.better-auth.com/docs/plugins/admin) (roles, banning, impersonation)

**GitHub**

- [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) and [your developer settings](https://github.com/settings/developers)

**Next.js**

- [Authentication guide](https://nextjs.org/docs/app/guides/authentication), [`proxy.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) and [Data security](https://nextjs.org/docs/app/guides/data-security)
- [Route Handlers (`route.ts`)](https://nextjs.org/docs/app/api-reference/file-conventions/route) and [`cookies()`](https://nextjs.org/docs/app/api-reference/functions/cookies)

**Concepts and security**

- [OAuth 2.0 simplified](https://www.oauth.com/) and [HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) (MDN)
- MDN: [401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) and [403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)
- OWASP: [Broken access control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/), [Authentication cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [Session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [Unvalidated redirects](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

**Previous classes**

- [Class 06 README](../class_06_forms/README.md): forms and Server Actions (the checklist for every action)
- [Class 03 README](../class_03_db/README.md): PostgreSQL, Drizzle and migrations
