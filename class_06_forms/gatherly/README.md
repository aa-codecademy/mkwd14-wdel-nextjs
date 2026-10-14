# Gatherly — end of class 04

The course application as it stands after class 4: the pages now read **real data from PostgreSQL** (filled by a seed script), there's an **event details page** (`/events/[slug]`) and **search** on `/events` that keeps its state in the URL (`?q=...`).

> 📘 **What's new and why?** The concepts, step-by-step run instructions, exercises and links are in the **[class 04 README](../README.md)**. PostgreSQL setup is in the **[class 03 README](../../class_03_db/README.md)**.

| Route                                                 | File                              | Data source                         |
| ----------------------------------------------------- | --------------------------------- | ----------------------------------- |
| [/](http://localhost:3000)                            | `app/page.tsx`                    | none                                |
| [/events](http://localhost:3000/events)               | `app/events/page.tsx`             | database (`searchEvents`), `?q=`    |
| `/events/[slug]`                                      | `app/events/[slug]/page.tsx`      | database (`getEventBySlug`)         |

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
│   ├── layout.tsx              ← root layout: <html>, <body>, fonts, metadata, Header + Footer
│   ├── page.tsx                ← "/" (landing page)
│   ├── globals.css             ← Tailwind, brand tokens (@theme) and shadcn's theme variables
│   └── events/
│       ├── layout.tsx          ← NEW: breadcrumb layout for everything under /events
│       ├── page.tsx            ← "/events": reads ?q=, shows search + results
│       └── [slug]/
│           ├── page.tsx        ← NEW: event details (dynamic route)
│           └── not-found.tsx   ← NEW: 404 for an unknown event
├── components/
│   ├── search-box.tsx          ← NEW (Client): search input that writes ?q= into the URL
│   ├── event-results.tsx       ← NEW (Server): fetches the events and renders the grid
│   ├── event-cover.tsx         ← NEW: cover image with a placeholder when there is none
│   ├── event-grid.tsx, event-card.tsx, favourite-button.tsx, header.tsx, footer.tsx
│   └── ui/                     ← shadcn/ui: button, card, badge, input (NEW)
├── db/
│   ├── schema.ts               ← the tables, relations and inferred types
│   ├── index.ts                ← the `db` client (server-only)
│   ├── queries/events.ts       ← NEW: getPublishedEvents, searchEvents, getEventBySlug
│   └── seed.ts                 ← NEW: the seed script (faker)
├── lib/
│   ├── event-filters.ts        ← NEW: validates the search params with Zod
│   ├── format.ts               ← dates and prices as text
│   └── utils.ts                ← `cn()` for class names
├── drizzle/                    ← generated SQL migrations (don't edit)
├── drizzle.config.ts           ← drizzle-kit settings
├── mocks/, types/              ← LEGACY: unused since class 04 (and they break `typecheck`, see the class README)
├── next.config.ts              ← allowed remote image hosts
└── package.json                ← new packages: zod, use-debounce, @faker-js/faker
```

## 🔗 Links

- [Class 04 README](../README.md) — dynamic routes, search params, Zod, seeding, exercises
- [Class 03 README](../../class_03_db/README.md) — PostgreSQL and Drizzle setup
- [Next.js: dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) · [Drizzle docs](https://orm.drizzle.team/docs/overview)
