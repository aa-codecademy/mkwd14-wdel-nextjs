# Gatherly — class 09 snapshot: advanced routing

The course application in class 9: everything from class 8 (sign-in, tickets, the public API) plus **parallel routes** (the organizer dashboard is assembled from independent `@stats`, `@orders` and `@attendees` panels, each with its own skeleton and error page) and an **intercepting route** (the "Get tickets" button opens a modal that has its own URL). The dashboard queries are now filtered by the owner, and `createEvent` saves a ticket type.

> 📘 **What's new and why?** The full explanation (parallel routes, `default.tsx`, intercepting routes, the modal, the new queries), run instructions, known issues and exercises are in the **[class 09 README](../README.md)**. The API is in the **[class 08 README](../../class_08_apis/README.md)**, sign-in and tickets in the **[class 07 README](../../class_07_auth/README.md)**. Forms and Server Actions are in the **[class 06 README](../../class_06_forms/README.md)**, and PostgreSQL setup in the **[class 03 README](../../class_03_db/README.md)**.

| Route                                                 | File                                              | Who may open it                     |
| ----------------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| `/` ⚠️ see the note below                             | `app/page.tsx` (and an empty `app/(marketing)/page.tsx`) | everyone                     |
| [/events](http://localhost:3000/events), `/events/[slug]`, [/about](http://localhost:3000/about) | `app/(marketing)/...` | everyone                          |
| [/sign-in](http://localhost:3000/sign-in), [/sign-up](http://localhost:3000/sign-up) | `app/(marketing)/sign-in/`, `sign-up/` | everyone (the GitHub button needs the env values) |
| `/organizers-only`                                    | `app/(marketing)/organizers-only/page.tsx`        | the "not allowed" page for attendees |
| [/dashboard](http://localhost:3000/dashboard)         | `app/(dashboard)/dashboard/(overview)/` (layout + page + `@stats`, `@orders`, `@attendees` slots) | **organizers and admins** (`requireOrganizer`, repeated in every slot) |
| [/dashboard/events/new](http://localhost:3000/dashboard/events/new) | `app/(dashboard)/dashboard/events/new/page.tsx` | meant for organizers, ⚠️ **not guarded yet** |
| `/api/auth/*`                                         | `app/api/auth/[...all]/route.ts`                  | Better Auth's own endpoints (sign-in, sign-out, GitHub callback) |
| `/events/[slug]/tickets` **(modal or page)**          | `app/(marketing)/@modal/(.)events/[slug]/tickets/page.tsx` (modal) and `events/[slug]/tickets/page.tsx` (full page) | everyone sees it; **signing in is needed to reserve** |
| `/events/[slug]` (tickets part)                       | `.../events/[slug]/_components/`, `app/actions/tickets.ts` | anyone sees availability; **signing in is needed to reserve** |
| `/api/events/[slug]/calendar.ics`                     | `app/api/events/[slug]/calendar.ics/route.ts`     | everyone (a calendar file download)  |
| `GET /api/events`                                     | `app/api/events/route.ts`                         | **NEW:** everyone (public, read-only JSON: search, filters, pagination) |
| `GET /api/events/[slug]`                              | `app/api/events/[slug]/route.ts`                  | **NEW:** everyone (one event, as JSON)  |

> ⚠️ Small gaps remain: `createEvent` checks that someone is signed in but not their role, the new-event page has no guard, the Publish button is a placeholder, and two files claim the home page. See the *Known issues* of the [class 09 README](../README.md).

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
├── proxy.ts                    ← runs before /dashboard/*: no session cookie → redirect to /sign-in (only a first filter!)
├── app/
│   ├── layout.tsx              ← root layout: only <html>, <body>, fonts, metadata
│   ├── page.tsx                ← the landing page (should move into (marketing), see the class README)
│   ├── global-error.tsx        ← the last-resort error page (replaces the root layout)
│   ├── actions/                ← events.ts (`createEvent`: session + ticket type), tickets.ts (`reserveTicket`)
│   ├── api/                    ← auth/[...all] (Better Auth), events/ (the public JSON API, class 8, ⚠️ bugs)
│   ├── (marketing)/            ← route group: the public site (not part of the URL)
│   │   ├── layout.tsx          ← header + footer, renders {children} AND {modal}
│   │   ├── @modal/             ← NEW: parallel route slot for the tickets modal
│   │   │   ├── default.tsx                       ← no modal
│   │   │   ├── [...catchAll]/page.tsx            ← closes the modal on any other URL
│   │   │   └── (.)events/[slug]/tickets/page.tsx ← the INTERCEPTING route: the modal
│   │   ├── events/             ← list (filters, pagination), details, error.tsx, _components/
│   │   │   └── [slug]/tickets/page.tsx           ← NEW: the full-page version of "Get tickets"
│   │   ├── sign-in/, sign-up/, organizers-only/, about/, _components/
│   │   └── ...
│   └── (dashboard)/            ← route group: the organizer area
│       ├── layout.tsx          ← sidebar
│       └── dashboard/
│           ├── (overview)/     ← NEW: route group that scopes the panels to "/dashboard" only
│           │   ├── layout.tsx  ← NEW: receives the slots as props and arranges them
│           │   ├── page.tsx    ← the list of the organizer's events
│           │   ├── default.tsx ← NEW: fallback for `children`
│           │   └── @stats/, @orders/, @attendees/  ← NEW: PARALLEL ROUTES (page, loading, error, default each)
│           └── events/new/     ← the create-event form (not wrapped by the panels)
├── components/
│   ├── route-modal.tsx         ← NEW (client): a dialog whose open state is the URL (closes with router.back())
│   ├── account-menu.tsx        ← (client) Sign in, or name + Dashboard + Sign out (useSession)
│   ├── event-card.tsx          ← now has a "Get tickets" link (intercepted into the modal)
│   ├── header.tsx, footer.tsx, submit-button.tsx, event-*.tsx, favourite-button.tsx
│   └── ui/                     ← shadcn/ui components (dialog is new)
├── db/
│   ├── auth.ts, auth-schema.ts ← Better Auth config and its tables
│   ├── schema.ts, index.ts, seed.ts
│   └── queries/                ← events.ts, tickets.ts, dashboard.ts (NEW: owner-filtered stats, orders, attendees)
├── lib/                        ← session.ts (guards), roles.ts, auth-client.ts, api.ts, to-public-event.ts, ics.ts, ...
├── types/gatherly-event.ts     ← LEGACY: unused, and it breaks `typecheck` (delete it)
├── drizzle/                    ← migrations
└── package.json
```


## 🔗 Links

- [Class 09 README](../README.md) — parallel routes, intercepting routes, the modal, known issues, exercises
- [Class 08 README](../../class_08_apis/README.md) — Route Handlers and the public API
- [Class 07 README](../../class_07_auth/README.md) — sessions, OAuth, roles, Better Auth, tickets, error pages
- [Class 06 README](../../class_06_forms/README.md) — forms and Server Actions
- [Class 03 README](../../class_03_db/README.md) — PostgreSQL and Drizzle setup
- [Next.js: dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) · [Drizzle docs](https://orm.drizzle.team/docs/overview)
