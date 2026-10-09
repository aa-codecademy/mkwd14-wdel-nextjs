# Gatherly — end of class 03

The course application as it stands after class 3: the class 2 app (shadcn/ui cards, shared layout) plus a **PostgreSQL database** described with **Drizzle ORM** — a schema (`db/schema.ts`), three SQL migrations (`drizzle/`), a database client (`db/index.ts`) and npm scripts to manage it.

> 📘 **Setting up PostgreSQL and Drizzle?** The full step-by-step guide (install on Mac/Windows **or** Docker, connection string, migrations, troubleshooting) is in the **[class 03 README](../README.md)**.

| Route                                   | File                  | Data source            |
| --------------------------------------- | --------------------- | ---------------------- |
| [/](http://localhost:3000)              | `app/page.tsx`        | none                   |
| [/events](http://localhost:3000/events) | `app/events/page.tsx` | `mocks/mock-events.ts` |

The pages still use the mock data. Wiring them to the database is the next step.

## 🚀 Quick start

You need a running PostgreSQL server with a `gatherly` database first ([class README, Step 1](../README.md#-step-1--get-a-postgresql-server-choose-one-option)). Then:

```bash
cp .env.example .env     # then check DATABASE_URL (Windows PowerShell: Copy-Item .env.example .env)
npm install
npm run db:migrate       # creates the tables
npm run db:seed          # inserts mock users, categories, venues and events
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
| `npm run db:migrate`   | Applies the migrations that haven't run yet to the database in `DATABASE_URL`         |
| `npm run db:studio`    | Opens Drizzle Studio, a browser UI for your data                                      |
| `npm run db:seed`      | Inserts Faker-generated users, categories, venues, events and event-category links |

## 🗂 Project structure

```
gatherly/
├── app/                  ← the App Router: folders = URLs
│   ├── layout.tsx        ← root layout: <html>, <body>, Geist font, metadata, Header + Footer
│   ├── page.tsx          ← the "/" route (landing page)
│   ├── events/page.tsx   ← the "/events" route
│   └── globals.css       ← Tailwind, brand tokens (@theme) and shadcn's theme variables
├── db/                   ← NEW in class 03
│   ├── schema.ts         ← the tables, relations and inferred types
│   └── index.ts          ← the `db` client (server-only)
├── drizzle/              ← NEW: generated SQL migrations + meta/ (commit, don't hand-edit)
├── drizzle.config.ts     ← NEW: drizzle-kit settings
├── .env.example          ← NEW: template for DATABASE_URL (copy to .env, never commit .env)
├── components/           ← shared UI: header, footer, event grid/card, favourite button
│   └── ui/               ← shadcn/ui components (button, card, badge)
├── lib/                  ← utils.ts (`cn()` for class names), format.ts (dates, prices)
├── types/                ← GatherlyEvent is now built from the DB types; the other files are legacy
├── mocks/                ← sample data, shaped like database rows. Still used by the pages
├── components.json       ← shadcn/ui config
├── next.config.ts        ← Next.js options (allowed remote image hosts)
├── tsconfig.json         ← TypeScript options; "@/*" import alias; extra strict checks
├── eslint.config.mjs     ← ESLint rules (ignores the generated drizzle/ folder)
├── .prettierrc.json      ← Prettier options + Tailwind class sorting
├── .vscode/ .claude/ .cursor/ .github/ ← editor settings and AI assistant rules
└── package.json          ← dependencies and scripts
```

---

## 🔗 Links

- [Class 03 README](../README.md) — PostgreSQL setup (Mac, Windows, Docker), Drizzle explained, troubleshooting, exercises
- [Drizzle ORM docs](https://orm.drizzle.team/docs/overview) · [PostgreSQL docs](https://www.postgresql.org/docs/current/)
- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)
