# Class 04 — Real Data, Dynamic Routes & Search

Until now Gatherly's pages showed **mock data** from a TypeScript file. In this class the pages read from the **PostgreSQL database** we set up in class 3:

- we **fill the database** with fake data (a seed script),
- we **query it** with Drizzle in one organised place,
- we add an **event details page** (`/events/some-event`) using a **dynamic route**,
- we add **search** (`/events?q=next`) where the **URL is the state**,
- and we **validate** what comes from the URL with Zod.

## 📁 What's in this folder

| Folder                    | What it is                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | The course app at the end of class 4. Every new file has comments written for students, so read the code next to this README |

## 🚀 Run it

You need the PostgreSQL server from class 3 running. If you don't have it yet, follow the **[class 03 README](../class_03_db/README.md)** first (Step 1 and Step 2).

```bash
cd class_04_routing/gatherly
npm install                  # new packages: zod, use-debounce, @faker-js/faker
cp .env.example .env         # skip if you already have .env (Windows PowerShell: Copy-Item .env.example .env)
npm run db:migrate           # creates the tables (safe to run again)
npm run db:seed              # fills them with fake data
npm run dev
```

Then try these URLs (replace the slug with a real one, see [below](#find-a-real-slug)):

| URL                                                     | What you should see                                              |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| [/events](http://localhost:3000/events)                 | The published events, soonest first, with a search box           |
| [/events?q=a](http://localhost:3000/events?q=a)         | Only events whose title contains "a" (any letter case)           |
| [/events?q=](http://localhost:3000/events?q=)           | The same as no search (empty input is ignored)                   |
| [/events?q=a&q=b](http://localhost:3000/events?q=a&q=b) | Uses only the first value ("a"). It never crashes                |
| `/events/<a-real-slug>`                                 | The event details page                                           |
| [/events/does-not-exist](http://localhost:3000/events/does-not-exist) | The event 404 page                                 |

---

## 🧩 What's new

| Concept                      | Where to read the code                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Seeding a database           | `db/seed.ts`                                                                        |
| A queries layer              | `db/queries/events.ts`                                                              |
| Dynamic route `[slug]`       | `app/events/[slug]/page.tsx`                                                        |
| Route-specific 404           | `app/events/[slug]/not-found.tsx`                                                   |
| Nested layout                | `app/events/layout.tsx`                                                             |
| Search params on the server  | `app/events/page.tsx`                                                               |
| Search params on the client  | `components/search-box.tsx`                                                         |
| Validating the URL with Zod  | `lib/event-filters.ts`                                                              |
| Optional image handling      | `components/event-cover.tsx`                                                        |
| Relations of the join table  | `db/schema.ts` (`eventCategoriesRelations`)                                         |

### 1. Seeding the database

An empty database means empty pages. A **seed script** inserts sample data so everyone develops against the same kind of data. Ours uses [`@faker-js/faker`](https://fakerjs.dev/) to generate 15 users, 8 categories, 10 venues and 30 events.

```bash
npm run db:seed
```

Things worth understanding (the file has comments for each):

- **Order matters** because of foreign keys: users, categories and venues first, then events (they point at users and venues), then the `event_categories` links.
- It runs inside a **transaction**: all inserts succeed, or none do. No half-filled tables if something fails.
- `.returning()` gives back the ids PostgreSQL generated, so we can use them in the next insert.
- The data is **random**, and so are the statuses (`draft` / `published` / `cancelled`). Only about **a third of the events are published**, and the site only shows published ones. If a page looks emptier than you expected, that's why.
- It is a **standalone script** (run by `tsx`), not part of Next.js. It builds its own connection because `db/index.ts` is marked `server-only`, which would throw outside Next.js.

#### Reset the data

Running the seed twice **adds** another set. To start from scratch, empty the tables, then seed again:

```sql
TRUNCATE TABLE event_categories, events, venues, categories, users;
```

Run it in `psql` (`psql "<your DATABASE_URL>"`), or with Docker:

```bash
docker exec -it gatherly-db psql -U postgres -d gatherly -c "TRUNCATE TABLE event_categories, events, venues, categories, users;"
```

#### Find a real slug

The seeded slugs are random words, so look one up:

```bash
psql "<your DATABASE_URL>" -c "SELECT slug, title FROM events WHERE status = 'published' LIMIT 5;"
```

or open `npm run db:studio` and look at the `events` table. Then visit `http://localhost:3000/events/<slug>`.

### 2. A queries layer: `db/queries/events.ts`

Pages don't talk to Drizzle directly. They call small functions:

```ts
const events = await searchEvents({ q: 'next' });     // for the list
const event  = await getEventBySlug('some-slug');     // for the details page
```

Why? The rules live in **one place** ("only `published` events are public"), pages stay readable, and swapping or tuning a query never touches the UI.

What you'll meet in that file:

| Piece                                  | Meaning                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `db.query.events.findMany({ ... })`    | Drizzle's **relational query API**: returns many rows. `findFirst` returns one (or `undefined`)   |
| `with: { venue: true, ... }`           | **Load related rows together** with each event. Uses the relations from `db/schema.ts`            |
| `eq`, `and`, `ilike`, `asc`            | Helpers that become SQL: `=`, `AND`, `ILIKE` (case-insensitive "contains"), `ORDER BY ... ASC`    |
| `limit: 50`                            | A safety cap, so a huge table can't load all at once                                              |
| `organizer: { columns: { id, name, handle } }` | Load **only** the columns the public page needs. The organizer's email never leaves the server |
| `EventWithDetails`                     | A TypeScript type **inferred from the query**. Change the query and the type follows              |

Watch your terminal while using the site: `logger: true` in `db/index.ts` prints the **SQL** Drizzle sends. Try searching and look at the `WHERE` clause.

> 🔒 The search text goes to PostgreSQL as a **parameter**, never concatenated into the SQL string, so it can't be used for SQL injection. That's the main reason to use a query builder or ORM instead of building SQL strings by hand.

### 3. A dynamic route: `/events/[slug]`

You met `[id]` in class 1. Now it's a real page:

```
app/events/
├── layout.tsx            ← breadcrumb, wraps everything below
├── page.tsx              ← /events
└── [slug]/
    ├── page.tsx          ← /events/nextjs-conf-skopje-2027
    └── not-found.tsx     ← shown when this page calls notFound()
```

The flow for `/events/some-slug`:

1. `const { slug } = await params;`: `params` is a **Promise**, always `await` it.
2. `getEventBySlug(slug)` asks the database.
3. Nothing found → `notFound()` → the nearest `not-found.tsx` is rendered, with an HTTP **404** status.
4. Otherwise render the page.

**Why a slug and not the id?** The id is a random uuid. A [slug](https://developer.mozilla.org/en-US/docs/Glossary/Slug) like `nextjs-conf-skopje-2027` is readable, friendly in links and better for SEO. It's a `unique` column, so one slug = one event.

Note that a draft or cancelled event answers **404** too: the query filters `status = 'published'`, so unpublished events are not reachable by guessing the URL.

### 4. A nested layout

`app/events/layout.tsx` wraps **both** `/events` and `/events/[slug]` with a breadcrumb:

```
RootLayout (header + footer)
  └─ EventsLayout (breadcrumb)          ← stays mounted when you move between the two pages
       └─ page.tsx or [slug]/page.tsx
```

The home page (`/`) isn't inside `app/events/`, so it doesn't get the breadcrumb.

### 5. Search, with the URL as the state

```
 user types ──► SearchBox (Client) ──► URL becomes /events?q=next
                                            │
                       Next.js re-renders the SERVER page with searchParams = { q: 'next' }
                                            │
          parseEventFilters() ──► EventResults (Server) ──► database ──► grid
```

**Why put the search in the URL instead of `useState`?** The URL can be shared and bookmarked, the Back button works, a refresh keeps the results, and the **server** can read it, so only the matching rows are fetched.

There are two sides, and it helps to see them next to each other:

| | **On the server** (`app/events/page.tsx`) | **In the browser** (`components/search-box.tsx`) |
| --- | --- | --- |
| How you read the params | the `searchParams` **prop** (a Promise) | the `useSearchParams()` hook |
| How you change the URL | not possible: the server only reads | `useRouter()` → `router.replace(...)` |
| Needs `'use client'`? | no | yes |

Details worth remembering:

- **Debounce** (`use-debounce`): wait until the user pauses typing (500 ms) before changing the URL. Without it, typing "next" runs 4 database queries instead of 1.
- **`router.replace`, not `push`:** typing shouldn't add a history entry per search, or the Back button would step through every term.
- **`defaultValue`, not `value`:** the input is *uncontrolled*. The browser owns the text while typing, and we only set the starting value, so a shared link shows the search in the box.
- **`URLSearchParams`:** the built-in class for building and encoding query strings (`rock & roll` → `rock+%26+roll`).
- The component copies the **existing params** before changing `q`, so other filters we add later are kept.

### 6. Never trust the URL: validate with Zod

Anything in the URL is **user input**. It can be missing, empty, repeated (`?q=a&q=b`) or garbage. `lib/event-filters.ts` turns it into a clean typed object:

```ts
const filters = parseEventFilters(await searchParams);   // { q?: string }
```

- `z.preprocess(first, ...)`: if the value is an array, take the first item.
- `.trim().min(1).optional()`: a non-empty text, or nothing.
- `.catch(undefined)`: if anything is wrong, treat it as "no filter" instead of crashing.
- `z.infer<typeof schema>`: the TypeScript type is **derived from the schema**, so they never drift apart.

Rule for **pages:** be forgiving (bad input → no filter). Later, for **APIs and forms**, we'll be strict and answer with an error.

### 7. Smaller things in this class

- **Nullable cover image:** `coverImageUrl` can be `null` in the database. `EventCover` shows a coloured placeholder instead of crashing.
- **`preload`** on the main image of the details page loads it first. (It replaces the old `priority` prop in Next.js 16.)
- **More image hosts:** the seeded images come from other hosts, so `next.config.ts` now allows `picsum.photos` and `loremflickr.com` in `images.remotePatterns`.
- **A shadcn `Input`:** added with `npx shadcn@latest add input` (see [class 02, section 6](../class_02_essentials/README.md#6-shadcnui--installing-and-using-it-step-by-step)).
- **`server-only`:** `db/queries/events.ts` can't be imported by a Client Component. The build fails instead of leaking the database code to the browser.

### New packages

| Package               | Why                                                                |
| --------------------- | ------------------------------------------------------------------ |
| `zod`                 | Validate and parse data (here: the search params)                  |
| `use-debounce`        | Delay a function until the user stops typing                       |
| `@faker-js/faker` (dev) | Generate fake data for the seed script                           |

---

## ⚠️ Known issues in this snapshot

Heads-up, so you're not surprised when you run `npm run check`:

| Problem                                                              | Why / how to fix                                                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run typecheck` fails in `mocks/mock-events.ts` and `types/gatherly-event.ts` | `db/schema.ts` renamed the type `Event` to `GatherlyEvent`, and these two files still import the old name. **Nothing uses them anymore**, so delete the `mocks/` folder and `types/gatherly-event.ts` (or fix the import) |
| `npm run lint` error: `'inter' is assigned a value but never used`   | A leftover font in `app/layout.tsx` (we use Geist). Delete the unused `Inter` lines                     |
| `npm run lint` warnings: `console.log` in `components/event-results.tsx` | Debug logs. Remove them before committing                                                          |

Note that `next build` also type-checks, so the first problem stops a production build until it's fixed.

---

## 🏋️ Try it yourself

1. Run `npm run db:seed`, then look at the `events` table in Drizzle Studio. How many are `published`? Does that match what `/events` shows?
2. Open `/events/<slug>` of a **draft** event. Why do you get a 404?
3. Search for `%` or `_` in the box. What happens, and why is it still not a security problem?
4. Add a **"No events found"** message: in `EventGrid`, show text when `events.length === 0`.
5. Add a **loading state**: wrap `<EventResults />` in `<Suspense fallback={...}>` in `app/events/page.tsx` and see what the user sees while the query runs (add a short `sleep` in the query to notice it).
6. Add a **category filter** `?category=meetup`: extend `filterSchema`, then use it in `searchEvents` (hint: you'll need to filter through the `event_categories` table).
7. Fix the **known issues** above until `npm run check` passes.
8. Show the **event title in the breadcrumb** on the details page. (Hint: the layout receives `params` too, but it can't know the title without querying.)

---

## 🔗 Useful links

**Next.js**

- [Dynamic routes](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) and [`page.js` props (`params`, `searchParams`)](https://nextjs.org/docs/app/api-reference/file-conventions/page)
- [`layout.js`](https://nextjs.org/docs/app/api-reference/file-conventions/layout) and [`not-found.js`](https://nextjs.org/docs/app/api-reference/file-conventions/not-found), [`notFound()`](https://nextjs.org/docs/app/api-reference/functions/not-found)
- [`useSearchParams`](https://nextjs.org/docs/app/api-reference/functions/use-search-params), [`useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router), [`usePathname`](https://nextjs.org/docs/app/api-reference/functions/use-pathname)
- [Learn Next.js: adding search and pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) — the same pattern, step by step
- [`<Image>`: `fill`, `preload`, `remotePatterns`](https://nextjs.org/docs/app/api-reference/components/image)

**Drizzle**

- [Relational queries (`findMany`, `with`)](https://orm.drizzle.team/docs/rqb) and [filter operators](https://orm.drizzle.team/docs/operators)
- [Insert and `returning`](https://orm.drizzle.team/docs/insert) and [transactions](https://orm.drizzle.team/docs/transactions)

**Libraries**

- [Zod](https://zod.dev/) — schema validation
- [`use-debounce`](https://github.com/xnimorz/use-debounce)
- [Faker](https://fakerjs.dev/guide/) — fake data

**Web basics**

- [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) (MDN) and [what is a slug?](https://developer.mozilla.org/en-US/docs/Glossary/Slug)
- [React: controlled and uncontrolled inputs](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components)
- [SQL injection](https://owasp.org/www-community/attacks/SQL_Injection) (OWASP) — why we use parameters

**Previous classes**

- [Class 03 README](../class_03_db/README.md) — PostgreSQL and Drizzle setup, troubleshooting
- [Class 02 README](../class_02_essentials/README.md) — Server vs Client Components, `<Suspense>`, shadcn/ui
