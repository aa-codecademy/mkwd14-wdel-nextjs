# Gatherly — class 06 snapshot

The course application at the start of class 6: the public site and an **organizer dashboard** live in separate **route groups**, `/events` has **filters, sorting and pagination** that **stream in with a skeleton**, and the dashboard lists the organizer's events. Forms and sign-in are still to come: the dashboard has placeholders where they plug in.

> 📘 **What's new and why?** The concepts, step-by-step run instructions, known issues, exercises and links are in the **[class 06 README](../README.md)**. The seed script, queries layer and dynamic route are explained in the **[class 04 README](../../class_04_routing/README.md)**, and PostgreSQL setup in the **[class 03 README](../../class_03_db/README.md)**.

| Route                                                 | File                                              | Data source                         |
| ----------------------------------------------------- | ------------------------------------------------- | ----------------------------------- |
| `/` ⚠️ see the note below                             | `app/page.tsx` (and an empty `app/(marketing)/page.tsx`) | none                         |
| [/about](http://localhost:3000/about)                 | `app/(marketing)/about/page.tsx`                  | none                                |
| [/events](http://localhost:3000/events)               | `app/(marketing)/events/page.tsx`                 | database (`searchEvents`), URL filters, streamed with Suspense |
| `/events/[slug]`                                      | `app/(marketing)/events/[slug]/page.tsx`          | database (`getEventBySlug`)         |
| [/dashboard](http://localhost:3000/dashboard)         | `app/(dashboard)/dashboard/page.tsx`              | database (`getOrganizerEvents`, all events for now) |

> ⚠️ This snapshot doesn't build yet: a wrong `pg` import in `db/index.ts` and `db/seed.ts`, and two files for the home page. Both are listed with their fixes in the *Known issues* of the [class 06 README](../README.md).

## 🚀 Quick start

You need a running PostgreSQL server with a `gatherly` database ([class 03, Step 1](../../class_03_db/README.md#-step-1--get-a-postgresql-server-choose-one-option)). Then:

```bash
cp .env.example .env     # then check DATABASE_URL (Windows PowerShell: Copy-Item .env.example .env)
npm install
npm run db:migrate       # creates the tables
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
├── app/
│   ├── layout.tsx              ← root layout: only <html>, <body>, fonts, metadata
│   ├── page.tsx                ← the landing page (should move into (marketing), see the note above)
│   ├── globals.css             ← Tailwind, brand tokens (@theme) and shadcn's theme variables
│   ├── (marketing)/            ← route group: the public site (not part of the URL)
│   │   ├── layout.tsx          ← header + footer
│   │   ├── about/page.tsx      ← "/about"
│   │   └── events/
│   │       ├── layout.tsx      ← breadcrumb for everything under /events
│   │       ├── page.tsx        ← "/events": filters, search, pagination
│   │       ├── _components/    ← private folder: search-box, category-links, filter-form, pagination, event-results
│   │       └── [slug]/
│   │           ├── page.tsx        ← event details (dynamic route)
│   │           └── not-found.tsx   ← 404 for an unknown event
│   └── (dashboard)/            ← route group: the organizer area
│       ├── layout.tsx          ← sidebar
│       └── dashboard/
│           ├── page.tsx        ← "/dashboard": the organizer's events (Publish/Unpublish form is a placeholder)
│           └── events/         ← empty for now: "New event" will live here
├── components/
│   ├── event-cover.tsx         ← cover image with a placeholder when there is none
│   ├── event-grid-skeleton.tsx ← NEW: loading placeholder shown by <Suspense>
│   ├── event-grid.tsx, event-card.tsx, favourite-button.tsx, header.tsx, footer.tsx
│   └── ui/                     ← shadcn/ui: button, card, badge, input, skeleton (NEW)
├── db/
│   ├── schema.ts               ← the tables, relations and inferred types
│   ├── index.ts                ← the `db` client (server-only)
│   ├── queries/events.ts       ← searchEvents (filters + pagination), getEventBySlug, getFilterOptions
│   ├── queries/dashboard.ts    ← NEW: getOrganizerEvents (not limited to one organizer yet)
│   └── seed.ts                 ← the seed script (faker)
├── lib/
│   ├── event-filters.ts        ← validates the URL params with Zod (+ `eventsHref` builds URLs)
│   ├── format.ts               ← dates and prices as text
│   └── utils.ts                ← `cn()` for class names
├── drizzle/                    ← generated SQL migrations (don't edit)
├── drizzle.config.ts           ← drizzle-kit settings
├── mocks/, types/              ← LEGACY: unused since class 04 (and they break `typecheck`, see the class README)
├── next.config.ts              ← allowed remote image hosts
└── package.json                ← new packages: zod, use-debounce, @faker-js/faker
```

## 🔗 Links

- [Class 06 README](../README.md) — route groups, filters, pagination, streaming, the dashboard, known issues, exercises
- [Class 04 README](../../class_04_routing/README.md) — dynamic routes, search params, Zod, seeding
- [Class 03 README](../../class_03_db/README.md) — PostgreSQL and Drizzle setup
- [Next.js: dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) · [Drizzle docs](https://orm.drizzle.team/docs/overview)
