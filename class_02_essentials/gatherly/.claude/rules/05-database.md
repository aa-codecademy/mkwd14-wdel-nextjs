---
paths:
  - "lib/db/**"
  - "drizzle.config.ts"
  - "drizzle/**"
---

<!-- Generated from tools/agent-rules in the course repo. Edit the source, not this file. -->

# Database rules — Drizzle ORM 0.45 + PostgreSQL

The project uses **`drizzle-orm` 0.45.x** with **`pg`** (node-postgres). The
docs at `orm.drizzle.team` now show the **1.0 release candidate**, whose API is
different. Do not copy 1.0 syntax, and never install `drizzle-orm@rc`.

## Relations and queries

- Define relations with `relations()` from `drizzle-orm` — **not** `defineRelations()`.
- Many-to-many must go through the junction table:

  ```ts
  db.query.events.findMany({
    with: { eventCategories: { columns: {}, with: { category: true } } },
  });
  ```

- The relational query API **cannot filter or sort the top-level table by a related table's column** (`where: { venue: { city } }` does not exist in 0.45). **Never put another table's column in a relational `where`**: `db.query.events.findMany({ where: eq(venues.city, x) })` does not error — Drizzle writes it as `"events"."city"`, silently filtering the wrong table. Use a subquery (`inArray(events.id, db.select(...).from(...))`), the SQL-like builder with an explicit `innerJoin`, or the denormalised columns `events.city` and `events.minPriceCents`.
- `.returning()` returns an **array**: `const [event] = await db.insert(events).values(v).returning();` — then handle `event` being `undefined`.
- Put reusable reads in `lib/db/queries/*.ts`. Database modules start with `import "server-only";`.
- Code that runs **outside Next** — `drizzle.config.ts`, `lib/db/seed.ts` — loads `.env` with `loadEnvConfig` from `@next/env`, and must not import `@/lib/db` (it is `server-only` and throws there). The seed builds its own client from `./schema`.
- Return types come from the query: `type EventWithDetails = Awaited<ReturnType<typeof getPublishedEvents>>[number]`. Don't hand-write a type that duplicates a query result.

## Schema conventions

- The schema lives in `lib/db/schema.ts`. Better Auth's tables are **generated** into `lib/db/auth-schema.ts` — never hand-edit that file.
- Better Auth's `user.id` is **`text`**, not `uuid`. Every foreign key pointing at `user` must also be `text`.
- Roles are `text` with a TypeScript union (`"attendee" | "organizer" | "admin"`) — **not** a `pgEnum`.
- Money is stored as integer cents (`priceCents`, `totalCents`), never as a float.
- Table names are plural `snake_case` (`ticket_types`); TypeScript names are `camelCase` (`ticketTypes`).

## Migrations

- Change the schema, then `npm run db:generate` and `npm run db:migrate`. Commit the generated files in `drizzle/`.
- Never edit generated migration files, and do not use `drizzle-kit push` as the migration strategy.
