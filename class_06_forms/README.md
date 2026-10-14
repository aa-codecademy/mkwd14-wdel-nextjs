# Class 06 — Route Groups, Filters, Streaming & the Organizer Dashboard

In class 4 the `/events` page got real data, a details page and a search box. This folder builds on that and turns Gatherly into a **bigger app with two different "shells"**:

- the **public site** (header + footer) and the **organizer dashboard** (sidebar), living side by side with clean URLs thanks to **route groups**,
- a proper **events browser**: category pills, city / date / sort filters and **pagination**, all driven by the URL,
- **streaming** the results with `<Suspense>` and a **skeleton** while they load,
- and the first screen of the **dashboard**, with the organizer's events and **form placeholders** for what comes next.

> 🧭 **Where we are:** the *browsing* side is complete. The dashboard is a **scaffold**: the Publish / Unpublish button sits inside a `<form>` that doesn't do anything yet, "New event" points to a page that doesn't exist, and nobody is signed in. Those are the places where forms plug in next (the folder is called `class_06_forms`).

## 📁 What's in this folder

| Folder                    | What it is                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | The course app at this point. Every new file has comments written for students, so read the code next to this README |

## 🚀 Run it

You need the PostgreSQL server from class 3 running ([class 03 README](../class_03_db/README.md), Steps 1–2).

```bash
cd class_06_forms/gatherly
npm install
cp .env.example .env         # skip if you already have .env (Windows PowerShell: Copy-Item .env.example .env)
npm run db:migrate
npm run db:seed              # run once; it ADDS rows each time (see the class 04 README for how to reset)
npm run dev
```

> ⚠️ **Read [Known issues](#known-issues-in-this-snapshot) first.** In this snapshot a wrong import stops the app from building, and there are two files for the home page. Each one is a one-line fix, explained below.

| URL                                                                                | What you should see                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [/events](http://localhost:3000/events)                                            | Events with a search box, category pills, filters and pagination          |
| [/events?category=meetup](http://localhost:3000/events?category=meetup)            | Only one category (use a slug from your seeded data)                      |
| [/events?sort=price&page=2](http://localhost:3000/events?sort=price&page=2)        | Cheapest first, second page                                               |
| [/events?page=999](http://localhost:3000/events?page=999)                          | "There are only N pages of results", with a link to the last page         |
| [/events?q=zzzzzz](http://localhost:3000/events?q=zzzzzz)                          | "No events match these filters", with a link to clear them                |
| [/about](http://localhost:3000/about)                                              | A static page inside the public layout                                    |
| [/dashboard](http://localhost:3000/dashboard)                                      | The organizer's events, in a layout with a sidebar                        |

---

## 🧩 What's new

| Concept                              | Where to read the code                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| Route groups `(marketing)` / `(dashboard)` | `app/(marketing)/layout.tsx`, `app/(dashboard)/layout.tsx`, `app/layout.tsx`  |
| Private folders `_components`        | `app/(marketing)/events/_components/`                                               |
| Filters in the URL                   | `lib/event-filters.ts`, `_components/category-links.tsx`, `_components/filter-form.tsx` |
| Pagination                           | `db/queries/events.ts` (`searchEvents`), `_components/pagination.tsx`               |
| Empty states                         | `_components/event-results.tsx`                                                     |
| Building a query from filters        | `db/queries/events.ts` (`browseConditions`, `sortOrder`, `getFilterOptions`)        |
| Streaming with Suspense + skeleton   | `app/(marketing)/events/page.tsx`, `components/event-grid-skeleton.tsx`             |
| The dashboard                        | `app/(dashboard)/dashboard/page.tsx`, `db/queries/dashboard.ts`                     |

### 1. Route groups: several layouts, one set of URLs

A folder name in **parentheses** is a **route group**: it organises files and shares a layout, but it is **not part of the URL**.

```
app/
├── layout.tsx                      ← root: only <html>, <body>, fonts, metadata
├── (marketing)/                    ← the public site
│   ├── layout.tsx                  ← header + centred <main> + footer
│   ├── page.tsx                    ← "/"            (the home page)
│   ├── about/page.tsx              ← "/about"
│   └── events/
│       ├── layout.tsx              ← breadcrumb
│       ├── page.tsx                ← "/events"
│       ├── _components/            ← private folder: not a route
│       └── [slug]/page.tsx         ← "/events/some-event"
└── (dashboard)/                    ← the organizer area
    ├── layout.tsx                  ← sidebar, no site header
    └── dashboard/
        └── page.tsx                ← "/dashboard"
```

Why? Before, the header and footer lived in the root layout, so **every** page had them. A dashboard shouldn't. With groups, each part of the app gets its own frame and nothing leaks between them:

```
/events     RootLayout ─► MarketingLayout (header, footer) ─► EventsLayout (breadcrumb) ─► page
/dashboard  RootLayout ─► DashboardLayout (sidebar)                                      ─► page
```

Things to remember:

- The group name **never appears in the URL**. That's why the folder is `(dashboard)/dashboard/`: the outer one is the group, the inner one gives the URL `/dashboard`.
- **Two pages can't resolve to the same URL.** `app/page.tsx` and `app/(marketing)/page.tsx` would both be `/`, which Next.js doesn't allow. (That's one of the [known issues](#known-issues-in-this-snapshot).)
- The **root layout** is the only one that renders `<html>` and `<body>`. Groups add frames *inside* it.
- Layouts stay mounted while you move between pages of the same group. Moving to the *other* group changes the whole shell.

### 2. Private folders: `_components`

A folder that starts with an **underscore** is **never a route**. `app/(marketing)/events/_components/` keeps the pieces that only belong to the events page right next to it (instead of the global `components/` folder), and `/events/_components/...` is not reachable as a URL. (Files that aren't named `page.tsx` or `route.ts` are not routes anyway; the underscore makes the intent obvious and keeps the folder out of routing completely.)

### 3. Filters, all in the URL

Every control on the page changes the URL, and the server re-renders. There are **three different mechanisms**, each the simplest one that works:

| Control                 | Mechanism                                              | Client JavaScript? |
| ----------------------- | ------------------------------------------------------ | ------------------ |
| Search box (`?q=`)      | `useRouter().replace()` after a debounce               | yes (needs to react while typing) |
| Category pills          | plain `<Link href="/events?category=meetup">`          | no                 |
| City / date / sort      | a `<Form>` from `next/form` that submits with GET      | no                 |

**`next/form`'s `<Form>`** is a `<form>` that, when submitted with GET, turns into a client-side **navigation** to `/events?city=...&from=...&sort=...`: no full reload, layouts stay mounted, and it even works without JavaScript. The `name` of each field becomes the key in the query string.

A GET form **replaces the whole query string** with its own fields, so to keep the search text and the category the form re-sends them as **hidden inputs**. (`page` is left out on purpose: a new filter starts on page 1.)

**`eventsHref(filters, patch)`** (in `lib/event-filters.ts`) builds a `/events` URL from the current filters, changing only what's in `patch`. Every pill and pagination link uses it, so none of them hand-writes a query string, and they all keep the user's other filters. It leaves out defaults, so URLs stay clean (no `?sort=date`, no `?page=1`).

**The Zod schema grew too**, and it's still **forgiving**: anything invalid falls back to a default instead of crashing the page.

| Param      | Rule in the schema                                      | What `?x=garbage` becomes |
| ---------- | ------------------------------------------------------- | ------------------------- |
| `q`        | trimmed text, at least 1 character                      | no filter                 |
| `category`, `city` | any non-empty text                              | matches nothing, no crash |
| `from`     | `z.iso.date()`, a real date as `YYYY-MM-DD`             | no filter                 |
| `sort`     | `z.enum(['date', 'price', 'newest'])`                   | `'date'`                  |
| `page`     | `z.coerce.number().int().min(1)`, "3" → 3               | `1`                       |

`z.coerce` converts first (URL values are always strings), then checks. `.catch(value)` supplies the fallback.

### 4. Pagination

Showing 30 events at once doesn't scale, so we show **one page of 6** (`PAGE_SIZE`). In SQL that's **`LIMIT` + `OFFSET`**:

| Page | `limit` | `offset` = (page − 1) × 6 |
| ---- | ------- | ------------------------- |
| 1    | 6       | 0                         |
| 2    | 6       | 6                         |
| 3    | 6       | 12                        |

To show "Page 2 of 5" we also need the **total** number of matching events, not just this page: `db.$count(events, where)` runs `SELECT count(*) ... WHERE ...` with the **same** `where`, so the two always agree. `pageCount = Math.ceil(total / PAGE_SIZE)`, with a minimum of 1.

Both queries are independent, so they run **at the same time** with `Promise.all([...])`: the page waits for the slower one, not for the sum of both.

**Handle the empty cases.** `EventResults` decides between three outcomes:

1. results on this page → count, grid, pagination;
2. **page past the end** (`?page=99`, or searching while on page 3) → "There are only N pages", with a link to the last page. The check `events.length === 0 && total > 0` is what tells this apart from...
3. **nothing matches** → "No events match these filters", with a link to clear them.

> 💡 Heads-up: typing in the search box **keeps** the current `page`. A cleaner behaviour is to go back to page 1 on every new search (`next.delete('page')` in `search-box.tsx`). Try it as an exercise.

### 5. Building a query from filters

`browseConditions(filters)` in `db/queries/events.ts` starts with the rule that always applies (`status = 'published'`) and **adds one condition per filter the user set**, then joins them with `and(...)`:

```ts
const conditions = [eq(events.status, 'published')];
if (filters.q)    conditions.push(ilike(events.title, `%${filters.q}%`));
if (filters.city) conditions.push(eq(events.city, filters.city));
// ...
return and(...conditions);
```

New pieces to recognise:

- **`gte`** is `>=` (events starting on or after `?from=`).
- **A subquery for the category.** Events and categories are many-to-many (the `event_categories` join table), so we filter with `WHERE events.id IN (SELECT event_id FROM event_categories JOIN categories ... WHERE slug = 'meetup')`. In Drizzle: build the inner `db.select(...)` **without awaiting it** and pass it to `inArray(events.id, inCategory)`.
- **`sortOrder`**: a lookup object from the `?sort=` value to an `ORDER BY`. The second column is a **tie-breaker** (equal prices are ordered by date).
- **`selectDistinct`** in `getFilterOptions()`: `SELECT DISTINCT city` returns each city once. The filter controls are built from the **database**, so a new city or category appears without touching the UI code.

Run it and watch your terminal: `logger: true` prints the real SQL for each filter combination.

### 6. Streaming with `<Suspense>` and a skeleton

Recall class 02's `/streaming` example. The events page now does the same for real:

```tsx
<Suspense key={JSON.stringify(filters)} fallback={<EventGridSkeleton />}>
  <EventResults filters={filters} />
</Suspense>
```

`EventResults` awaits the database, so it *suspends*. Everything outside the boundary (heading, search box, filters) is sent to the browser immediately, the **skeleton** shows in the gap, and the real grid is streamed in when its query finishes.

- **A good skeleton has the same shape** as what it replaces (same grid, image, title line), so nothing jumps when the real cards arrive. `Skeleton` is a shadcn component (`npx shadcn@latest add skeleton`): a grey box with `animate-pulse`.
- **Why the `key`?** A boundary shows its fallback only the *first* time. Without the `key`, changing a filter would keep showing the **old** results until the new ones are ready, with no sign of loading. A `key` that changes with the filters tells React "new boundary", so the skeleton appears on every search, filter and page change.
- Note that `getFilterOptions()` is awaited **outside** the boundary, so the page shell still waits for that one (small, fast) query.

### 7. The dashboard (a scaffold)

`/dashboard` lists the organizer's events, newest first, with a status badge. Worth noticing:

- It's in the **(dashboard)** group, so it gets the **sidebar** layout, not the site header. The header just has a "For organizers" link to it.
- **`buttonVariants()`** gives a `<Link>` the look of a button. "New event" *navigates*, so it must be a link, not a `<button>`.
- Only **published** events link to their public page. A draft's `/events/<slug>` would be a 404.
- Its query (`db/queries/dashboard.ts`) is **not** limited to published events (an organizer must see drafts), and it selects only the columns the list shows.

What is still a **placeholder**:

| Placeholder                                      | What it will become                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| "Signed in as JohnDoe"                           | The real signed-in organizer                                                |
| `getOrganizerEvents('')` returns **everyone's** events | Only the signed-in organizer's own events (the `where` is commented out) |
| `<form action="">` around Publish / Unpublish    | A form action that updates the event's status                               |
| "New event" → `/dashboard/events/new` (404 today) | A form to create an event (an empty `events/` folder is waiting for it)    |

> 🔒 **Important rule for later:** a dashboard query must **always** be limited to the current user. Returning all rows "for now" is fine on a laptop and a serious data leak in production.

---

## Known issues in this snapshot

Run `npm run check` and `npm run build` and you'll meet these. Fix them, in this order:

| Problem                                                                 | Why / how to fix                                                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Module not found: Can't resolve '@/node_modules/@types/pg'` (the build fails; `db/index.ts`, `db/seed.ts`) | An editor auto-import picked a path inside `node_modules/@types`, which only has type definitions. Use `import { Pool } from 'pg';` in both files (class 04 has it right) |
| Two files for the home page: `app/page.tsx` **and** an **empty** `app/(marketing)/page.tsx` | One URL can't have two pages, and an empty file isn't a valid page. Move the hero from `app/page.tsx` into `app/(marketing)/page.tsx` and delete `app/page.tsx`, so `/` gets the header and footer too |
| `npm run typecheck` fails in `mocks/mock-events.ts` and `types/gatherly-event.ts` | They import the old type name `Event` (now `GatherlyEvent`) and **nothing uses them** anymore. Delete the `mocks/` folder and `types/gatherly-event.ts` |
| `npm run lint`: `'eq' is defined but never used`, `'organizerId' is defined but never used` (`db/queries/dashboard.ts`) | They belong to the commented-out `where`. They'll be used once sign-in exists. Until then prefix the argument with `_` and remove the `eq` import |
| Nit: `db/queries/dashboard.ts` has no `import 'server-only'` and imports `db` from `'..'` | Add `import 'server-only';` like `db/queries/events.ts`, so a Client Component can't import it |
| Inter isn't actually applied (`app/layout.tsx`)                         | `font-sans` reads `--font-sans`, but the layout defines `--font-inter`. Set `--font-sans: var(--font-inter)` in `globals.css` |

---

## 🏋️ Try it yourself

1. Apply the fixes above until `npm run check` and `npm run build` pass. After the pg import and the home page fixes, `/` should show the header and footer.
2. Open [/events?page=2](http://localhost:3000/events?page=2), then type a search. What happens to the page number? Make a new search go back to page 1.
3. Add a **"Free events only"** filter (`?free=1`): extend the Zod schema, add a condition in `browseConditions`, and add a checkbox to `FilterForm`. (Hint: an unchecked checkbox sends nothing at all.)
4. Open the Network tab and click a category pill, then submit the filter form. Which one reloads the whole page, and which one doesn't? Why?
5. Slow the query down (`await new Promise((r) => setTimeout(r, 2000))` in `searchEvents`) and watch the skeleton. Then remove the `key` from `<Suspense>` and change a filter. What changed?
6. Add a **"Dashboard" link** to the breadcrumb of the details page, or a **"Back to results"** link that keeps the filters. (Hint: you'll need a way to carry the filters from the list to the details page.)
7. Create `app/(dashboard)/dashboard/events/new/page.tsx` with a simple form (title, city, date) that doesn't submit yet. Why does the sidebar layout wrap it automatically?
8. Add `app/(dashboard)/loading.tsx` with a skeleton. When does it show?

---

## 🔗 Useful links

**Next.js**

- [Route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) and [project organization (private folders, colocation)](https://nextjs.org/docs/app/getting-started/project-structure)
- [`<Form>` (`next/form`)](https://nextjs.org/docs/app/api-reference/components/form)
- [Streaming](https://nextjs.org/docs/app/guides/streaming) and [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Learn Next.js: search and pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination)
- [`searchParams`](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional) on pages and [`useSearchParams`](https://nextjs.org/docs/app/api-reference/functions/use-search-params) in Client Components

**Drizzle**

- [Filter operators (`and`, `eq`, `gte`, `ilike`, `inArray`)](https://orm.drizzle.team/docs/operators)
- [Select: limit and offset, distinct, `$count`](https://orm.drizzle.team/docs/select)
- [Relational queries](https://orm.drizzle.team/docs/rqb)

**Zod**

- [Defining schemas: `z.enum`, `z.coerce`, `z.iso.date()`](https://zod.dev/api) and `.catch()`

**Web basics**

- [`<form>` and the GET vs POST methods](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data) (MDN)
- [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label) and [`aria-busy`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy) (MDN)
- [Cumulative Layout Shift](https://web.dev/articles/cls): why skeletons should match the final layout

**Previous classes**

- [Class 04 README](../class_04_routing/README.md): the seed script, queries layer, dynamic route and search
- [Class 03 README](../class_03_db/README.md): PostgreSQL and Drizzle setup
- [Class 02 README](../class_02_essentials/README.md): Server vs Client Components, Suspense, shadcn/ui
