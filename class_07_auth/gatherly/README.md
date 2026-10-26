# Gatherly — class 07 snapshot: authentication and authorization

The course application in class 7: people can **sign in with GitHub** (Better Auth), the server remembers them with a **session**, the header shows who is signed in, and `/dashboard` is guarded by **role**. The old `users` table was replaced by Better Auth's `user` table. Signed-in attendees can also **reserve tickets** (a transaction with a row lock, and an optimistic button), the app has **error pages**, and each event offers an **"Add to calendar"** download. Some checks are still missing (the create-event form, a query, a page): they're listed in the class README.

> 📘 **What's new and why?** The full explanation (sessions, OAuth, roles, how Better Auth was set up step by step, **how to get the GitHub credentials for `.env`**), run instructions, known issues and exercises are in the **[class 07 README](../README.md)**. Forms and Server Actions are in the **[class 06 README](../../class_06_forms/README.md)**, and PostgreSQL setup in the **[class 03 README](../../class_03_db/README.md)**.

| Route                                                 | File                                              | Who may open it                     |
| ----------------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| `/` ⚠️ see the note below                             | `app/page.tsx` (and an empty `app/(marketing)/page.tsx`) | everyone                     |
| [/events](http://localhost:3000/events), `/events/[slug]`, [/about](http://localhost:3000/about) | `app/(marketing)/...` | everyone                          |
| [/sign-in](http://localhost:3000/sign-in), [/sign-up](http://localhost:3000/sign-up) | `app/(marketing)/sign-in/`, `sign-up/` | everyone (the GitHub button needs the env values) |
| `/organizers-only`                                    | `app/(marketing)/organizers-only/page.tsx`        | the "not allowed" page for attendees |
| [/dashboard](http://localhost:3000/dashboard)         | `app/(dashboard)/dashboard/page.tsx`              | **organizers and admins** (`requireOrganizer`) |
| [/dashboard/events/new](http://localhost:3000/dashboard/events/new) | `app/(dashboard)/dashboard/events/new/page.tsx` | meant for organizers, ⚠️ **not guarded yet** |
| `/api/auth/*`                                         | `app/api/auth/[...all]/route.ts`                  | Better Auth's own endpoints (sign-in, sign-out, GitHub callback) |
| `/events/[slug]` (tickets part)                       | `.../events/[slug]/_components/`, `app/actions/tickets.ts` | anyone sees availability; **signing in is needed to reserve** |
| `/api/events/[slug]/calendar.ics`                     | `app/api/events/[slug]/calendar.ics/route.ts`     | everyone (a calendar file download)  |

> ⚠️ A few things are unfinished in this snapshot: the create-event form still uses the old demo organizer, the dashboard query ignores the owner, and two files claim the home page. Each one is listed with its fix in the *Known issues* of the [class 07 README](../README.md).

## 🚀 Quick start

You need a running PostgreSQL server with a `gatherly` database ([class 03, Step 1](../../class_03_db/README.md#-step-1--get-a-postgresql-server-choose-one-option)). Then:

```bash
cp .env.example .env     # then fill in DATABASE_URL, BETTER_AUTH_SECRET and the GitHub values (see the class README)
npm install
npm run db:migrate       # class 7: creates the auth tables and REPLACES the old `users` table
npm run db:seed          # fills them with fake data (run it once)
npm run dev
```

Open [http://localhost:3000/events](http://localhost:3000/events).

## 📜 Scripts

| Command                | What it does                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload (Turbopack)                                                |
| `npm run build`        | Production build — also type-checks and shows static/dynamic routes                   |
| `npm run start`        | Serves the production build (run `build` first)                                       |
| `npm run typecheck`    | Generates Next.js route types, then runs the TypeScript compiler                      |
| `npm run lint`         | ESLint — finds bugs and bad patterns (`lint:fix` also fixes what it can)              |
| `npm run format`       | Prettier — formats every file (`format:check` only reports)                           |
| `npm run check`        | Type check + lint + format check. Run before every push                               |
| `npm run db:generate`  | Writes a new SQL migration in `drizzle/` from changes in `db/schema.ts`               |
| `npm run db:migrate`   | Applies the migrations that haven't run yet                                           |
| `npm run db:seed`      | **New:** inserts fake users, categories, venues and events (`tsx db/seed.ts`). It *adds* rows each time, see the class README for how to reset |
| `npm run db:studio`    | Opens Drizzle Studio, a browser UI for your data                                      |

## 🗂 Project structure

```
gatherly/
├── proxy.ts                    ← NEW: runs before /dashboard/*: no session cookie → redirect to /sign-in (only a first filter!)
├── app/
│   ├── layout.tsx              ← root layout: only <html>, <body>, fonts, metadata
│   ├── page.tsx                ← the landing page (should move into (marketing), see the class README)
│   ├── api/auth/[...all]/route.ts  ← NEW: Better Auth's HTTP endpoints (sign-in, sign-out, GitHub callback)
│   ├── (marketing)/            ← route group: the public site (not part of the URL)
│   │   ├── layout.tsx          ← header + footer
│   │   ├── sign-in/, sign-up/  ← NEW: the sign-in and sign-up pages (server pages around <AuthForm>)
│   │   ├── organizers-only/    ← NEW: the "403" page for signed-in attendees
│   │   ├── _components/        ← NEW: auth.form.tsx (GitHub button), safe-next.ts (open-redirect guard)
│   │   ├── about/, events/     ← events: filters, search, pagination, details (see class 4 and 6)
│   │   ├── events/error.tsx    ← NEW: the error page for /events and everything below it
│   │   ├── events/[slug]/_components/  ← NEW: tickets-list, reserve-button (optimistic), your-tickets, skeleton
│   │   └── ...
│   └── (dashboard)/            ← route group: the organizer area
│       ├── layout.tsx          ← sidebar
│       └── dashboard/          ← "/dashboard" (guarded by requireOrganizer) and events/new (the form)
├── app/actions/events.ts       ← Server Action `createEvent` (still the demo organizer ⚠️)
├── app/actions/tickets.ts      ← NEW: Server Action `reserveTicket` (transaction + row lock against overselling)
├── app/global-error.tsx        ← NEW: the last-resort error page (replaces the root layout)
├── components/
│   ├── account-menu.tsx        ← NEW (client): Sign in, or name + Dashboard + Sign out (useSession)
│   ├── header.tsx              ← renders <AccountMenu />
│   ├── submit-button.tsx, event-*.tsx, favourite-button.tsx, footer.tsx
│   └── ui/                     ← shadcn/ui components
├── db/
│   ├── auth.ts                 ← NEW: the Better Auth server config (GitHub, passwords, roles). Server-only
│   ├── auth-schema.ts          ← NEW: the auth tables (user, session, account, verification)
│   ├── schema.ts               ← our tables; `events.organizerId` and `orders.userId` now point at the auth `user`
│   ├── index.ts                ← the `db` client (server-only)
│   ├── queries/                ← events.ts, dashboard.ts (⚠️ ignores the owner), tickets.ts (NEW: availability)
│   ├── demo-users.ts           ← OBSOLETE (the old "pretend login"; delete it once actions use the session)
│   └── seed.ts                 ← resets and fills the database (inserts `user` rows, no passwords)
├── lib/
│   ├── auth-client.ts          ← NEW: the browser-side auth client (signIn, signOut, useSession)
│   ├── session.ts              ← NEW: getCurrentUser, requireUser, requireOrganizer: the server-side guards
│   ├── roles.ts                ← NEW: parseRole, canManageEvents
│   ├── ics.ts                  ← NEW: builds the iCalendar (.ics) text
│   ├── event-filters.ts, format.ts, utils.ts
├── types/role.ts               ← NEW: 'attendee' | 'organizer' | 'admin'
├── drizzle/                    ← migrations. 0004 adds the auth tables and replaces `users`
├── mocks/, types/gatherly-event.ts  ← LEGACY: unused, and they break `typecheck`
└── package.json                ← new packages: better-auth, @better-auth/drizzle-adapter
```

## 🔗 Links

- [Class 07 README](../README.md) — sessions, OAuth, roles, Better Auth step by step, the GitHub credentials, known issues, exercises
- [Class 06 README](../../class_06_forms/README.md) — forms and Server Actions
- [Class 03 README](../../class_03_db/README.md) — PostgreSQL and Drizzle setup
- [Next.js: dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) · [Drizzle docs](https://orm.drizzle.team/docs/overview)
