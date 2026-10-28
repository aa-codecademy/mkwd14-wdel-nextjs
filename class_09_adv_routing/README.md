# Class 09 — Advanced Routing: Parallel Routes, Intercepting Routes & Modals

So far every URL showed **one** page. In this class the App Router shows its two most powerful (and most confusing) features:

- **Parallel routes** (`@slot` folders): one URL renders **several independent panels at the same time**, each with its own loading skeleton and error page. We use them to build the organizer **dashboard**: stats, orders and attendees, loading side by side.
- **Intercepting routes** (`(.)folder`): one URL can show **two different things**, depending on how you got there. We use them for a **"Get tickets" modal** that opens on top of the page you were on, but is also a real page when you open the same URL directly.

> 🧭 **Where we are:** both features work. Along the way the dashboard got its first **real data** (owner-filtered queries with SQL aggregates), the create-event action now saves a **ticket type**, and the ownership leak from class 7 is **closed**. A few small gaps remain (the role check on `createEvent`, the Publish button): see [Known issues](#known-issues-in-this-snapshot).

**On this page:**
[Run it](#-run-it) · [Part 1: Parallel routes](#part-1--parallel-routes-the-dashboard-panels) · [Part 2: Intercepting routes](#part-2--intercepting-routes-and-the-tickets-modal) · [Part 3: Everything else in this class](#part-3--everything-else-that-changed) · [Known issues](#known-issues-in-this-snapshot) · [Exercises](#-try-it-yourself) · [Links](#-useful-links)

## 📁 What's in this folder

| Folder                    | What it is                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | The course app at this point. Every new file has comments written for students, so read the code next to this README |

---

## 🚀 Run it

Same setup as class 7 (PostgreSQL running, `.env` with `DATABASE_URL`, `BETTER_AUTH_SECRET` and the GitHub values, see the [class 07 README](../class_07_auth/README.md)):

```bash
cd class_09_adv_routing/gatherly
npm install
cp .env.example .env         # skip if you already have .env (Windows PowerShell: Copy-Item .env.example .env)
npm run db:migrate
npm run db:seed              # see the first row of Known issues: the seed has a wrong import to fix first
npm run dev
```

### Why is my dashboard empty?

The dashboard now only shows data for **the signed-in organizer's own events**. You signed in with GitHub, so **you** own nothing: the seeded events belong to the seeded organizers (`avenga`, `js-mk`, `soundwave`), who can't sign in. Two steps to see real panels:

1. Sign in with GitHub, then make yourself an organizer (class 7): `UPDATE "user" SET role = 'organizer' WHERE email = 'you@example.com';`
2. Hand yourself the events of one seeded organizer (`psql "<your DATABASE_URL>"`):

```sql
UPDATE events
SET organizer_id = (SELECT id FROM "user" WHERE email = 'you@example.com')
WHERE organizer_id = (SELECT id FROM "user" WHERE handle = 'avenga');
```

Now `/dashboard` shows Avenga's events, orders and attendees as **yours**. (This is also a nice demonstration that the filtering is by the owner's id.)

Then try:

| URL                                                                  | What you should see                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [/dashboard](http://localhost:3000/dashboard)                        | Number tiles, recent orders, recent attendees, and your events: **loading separately** |
| [/events](http://localhost:3000/events) → click **Get tickets**      | A **modal** over the events list, and the URL becomes `/events/<slug>/tickets`        |
| Refresh that page                                                    | The same content as a **full page**, with a "← Back to the event" link               |
| In the modal: press **Escape**, or the X, or the browser's **Back**  | The modal closes and you're back on `/events`                                        |

---

# Part 1 — Parallel routes: the dashboard panels

## 1.1 The problem

The dashboard needs four things on one screen: **stats**, **recent orders**, **recent attendees** and **your events**. The obvious solution is one page that loads all four. It has three problems:

1. It's **as slow as the slowest query**. The stats can't appear until the orders are ready.
2. If **one query fails**, the whole dashboard fails.
3. One huge file that mixes four unrelated things.

**Parallel routes** solve all three. Each panel becomes its own **slot**, with its own page, its own loading state and its own error page, and the layout just decides where to put them.

## 1.2 What a slot is

A folder whose name starts with **`@`** is a **slot**. It is **not** part of the URL: it only gives a name to one region of the page.

```
app/(dashboard)/dashboard/(overview)/
├── layout.tsx        ← receives every slot as a PROP and arranges them
├── page.tsx          ← the normal page: the list of events (this is `children`)
├── default.tsx       ← fallback for `children` (see 1.5)
├── @stats/           ← the `stats` prop
│   ├── page.tsx      ← what the slot renders
│   ├── loading.tsx   ← its own skeleton
│   ├── error.tsx     ← its own error page
│   └── default.tsx   ← its fallback
├── @orders/          ← the `orders` prop    (same four files)
└── @attendees/       ← the `attendees` prop (same four files)
```

The URL for all of it is just **`/dashboard`**. `@stats` doesn't appear anywhere in the address.

## 1.3 The layout puts the slots together

```tsx
export default function OverviewLayout({ children, stats, orders, attendees }: Props) {
  return (
    <div className="space-y-6">
      <section>{stats}</section>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">{orders}</section>
        <aside>{attendees}</aside>
      </div>
      {children}
    </div>
  );
}
```

The rule: **every `@name` folder arrives as a prop called `name`**, next to the usual `children`. If a prop name doesn't match a folder, that slot never renders. The layout is only about **position**. The panels know nothing about each other.

## 1.4 What each slot gives you

Because each slot is its own little route, you get the special files **per panel**:

| File          | What it does for ONE panel                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `page.tsx`    | Fetches its own data (an `async` Server Component) and renders the panel                                          |
| `loading.tsx` | A **skeleton** shown while this panel's `page.tsx` is fetching. Next.js wraps the page in `<Suspense>` for you    |
| `error.tsx`   | If this panel's query throws, **only this panel** shows "Couldn't load this panel. Try again", and the rest keeps working |

So the three panels load **in parallel** and **stream in** as each is ready. Try it: add `await new Promise((r) => setTimeout(r, 2000))` to `@orders/page.tsx`. The stats and attendees appear first, and the orders panel shows its skeleton for 2 seconds.

## 1.5 `default.tsx`: the fallback

This is the part everyone finds confusing, so let's go slowly.

- On a **client-side navigation** (clicking a link), Next.js **remembers what every slot was showing**.
- On a **hard navigation** (refresh, a typed address, a shared link) it only knows **the URL**. If a slot has no page that matches that URL, it can't recover its state, and needs something to render.

`default.tsx` is that something. Ours return `null` (an empty panel). Next.js **requires** one for each named slot, and for `children` too (without it you get an error, or a 404 for `children`). The rule is simple: **every `@slot` gets a `default.tsx`.**

## 1.6 The `(overview)` folder: scoping with a route group

Why isn't the layout right in `dashboard/`? Because then **every page below `/dashboard`**, including `/dashboard/events/new` (the form), would get the stats, orders and attendees panels around it. We don't want that.

`(overview)` is a **route group** (parentheses, not in the URL, class 4). It scopes this layout, and its slots, to **just the `/dashboard` page**:

```
app/(dashboard)/
├── layout.tsx                    ← the sidebar (for everything in the dashboard group)
└── dashboard/
    ├── (overview)/               ← route group: scopes the panels
    │   ├── layout.tsx            ← the panels' layout
    │   ├── page.tsx              → /dashboard
    │   └── @stats, @orders, @attendees
    └── events/new/page.tsx       → /dashboard/events/new   (NOT wrapped by the panels)
```

For `/dashboard` the nesting is: `RootLayout` → the sidebar layout → the overview layout (panels) → the events list.

## 1.7 Every slot guards itself

Look at the top of `@stats/page.tsx`, `@orders/page.tsx` and `@attendees/page.tsx`:

```ts
const organizer = await requireOrganizer('/dashboard');
const orders = await getRecentOrders(organizer.id);
```

The guard is **repeated** in every slot, on purpose. Slots are separate routes: a check in one place doesn't cover the others (the same lesson as "a page check never covers the action behind it", class 7). `requireOrganizer` is cheap, and **forgetting it is not**.

## 1.8 Common mistakes

| Mistake                                                       | What happens                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A slot folder with **no `default.tsx`**                       | An error (or a 404) on refresh                                                       |
| The layout doesn't render a slot (**prop name mismatch**)     | The slot is silently never shown                                                     |
| A slot with **no `error.tsx`**                                | One failing query takes down the **whole** dashboard instead of one panel            |
| The slot layout **not scoped** with a route group             | The panels spill onto sibling routes such as the "new event" form                    |
| Checking the user in one slot only                            | The other slots serve their data to anyone who can reach them                        |

---

# Part 2 — Intercepting routes and the tickets modal

## 2.1 The problem

On `/events` every card has a **Get tickets** button. Where should it go?

- A **new page** (`/events/xyz/tickets`) works, but you **lose your place**: the list, the filters, the scroll position.
- A **modal** keeps you on the list, but a normal modal has **no URL**: you can't share it, a refresh closes it, and Back leaves the page.

We want **both**: a modal that **has its own URL**. That's what intercepting routes are for.

## 2.2 The idea

The same URL, `/events/xyz/tickets`, renders **different things** depending on how you got there:

| How you arrive                                                      | Kind of navigation | What you see                                                    |
| ------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------- |
| Click **Get tickets** inside the app                                | **soft**           | The events list stays, with the tickets in a **modal** on top   |
| Refresh, open the address in a new tab, or follow a shared link     | **hard**           | The **full page** `events/[slug]/tickets/page.tsx`              |

Both show the **same content**. Only the presentation differs.

## 2.3 The files

Three pieces cooperate, plus the real page:

```
app/(marketing)/
├── layout.tsx                                    ← renders {children} AND {modal}
├── @modal/                                       ← a parallel route slot named "modal"
│   ├── default.tsx                               ← 1. "no modal" (null)
│   ├── [...catchAll]/page.tsx                    ← 2. closes the modal on any other URL (null)
│   └── (.)events/[slug]/tickets/page.tsx         ← 3. THE INTERCEPTOR: the modal
└── events/[slug]/tickets/page.tsx                ← the real, full-page version
```

This is where **parallel routes and intercepting routes combine**: the modal lives in an `@modal` **slot** (so it renders next to the page, not instead of it), and the **interception** decides when that slot shows something.

### The interceptor: `(.)events/[slug]/tickets`

The folder name has a marker in parentheses at the front:

| Marker      | Intercepts a route...                    |
| ----------- | ---------------------------------------- |
| `(.)`       | on the **same level**                    |
| `(..)`      | **one level** above                      |
| `(..)(..)`  | **two levels** above                     |
| `(...)`     | from the **root** of `app/`              |

> ⚠️ The levels count **URL segments, not folders**. Route groups like `(marketing)` and slots like `@modal` **don't count**, because they aren't in the URL. That's why `(.)events` inside `app/(marketing)/@modal/` matches `/events/...`, even though on disk it's several folders deep.

### The three files of a modal slot

Every modal built this way needs these three. Forgetting one is the classic bug:

| File                          | Job                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@modal/default.tsx`          | `null`: **no modal** when nothing matches, and on a refresh                                              |
| `@modal/(.)events/.../page.tsx` | **The modal itself**: shown when the intercepted URL is reached by a soft navigation                   |
| `@modal/[...catchAll]/page.tsx` | `null`: **closes the modal** when you navigate to any other URL                                        |

The catch-all is easy to miss, so here is why it exists. On a soft navigation a slot **keeps what it was showing** if the new URL has no match for it. Without the catch-all, you'd open the modal, click a link to `/about`, and **the modal would stay open on top of `/about`**. The catch-all matches every other URL and renders `null`, which clears the slot.

## 2.4 One click, step by step

```
1. You're on /events. The URL is /events. The @modal slot shows default.tsx (nothing).
2. You click "Get tickets":  <Link href="/events/xyz/tickets">   (components/event-card.tsx)
3. Soft navigation. Next.js sees that @modal has a route matching this URL: (.)events/[slug]/tickets.
   It renders THAT in the slot instead of loading the real page.
4. The browser URL is now /events/xyz/tickets, but the events list is STILL on screen,
   because `children` kept its state. The modal appears on top (components/route-modal.tsx).
5. You press Escape.  The dialog asks to close, and RouteModal answers with router.back().
6. The URL goes back to /events. The intercepting route no longer matches, so @modal renders
   default.tsx (null). The modal is gone.
7. Now refresh while on /events/xyz/tickets.  Hard navigation: no interception, the REAL page
   (events/[slug]/tickets/page.tsx) renders with the heading and a "Back to the event" link.
```

## 2.5 The modal: `RouteModal` and the `Dialog`

A normal modal keeps an `open` flag in `useState`. A **route modal has no state**: it's open **exactly when the intercepting route is rendered**.

```tsx
export function RouteModal({ title, children }: RouteModalProps) {
  const router = useRouter();
  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

- `open` with no value: always open while this component exists.
- `onOpenChange` fires with the **new** state. When the user presses Escape, clicks the overlay or the X, it fires with `false`, and we call **`router.back()`**. That returns to the previous URL, which un-matches the interceptor and clears the slot.
- Because the modal is just a URL, the **Back button closes it for free**, and the URL can be shared.

The **`Dialog`** comes from shadcn (`npx shadcn@latest add dialog`, built on Base UI). It handles the hard part, **accessibility**: focus moves into the dialog and is **trapped** there, Escape closes it, the page behind becomes inert, and screen readers announce the `DialogTitle` (every dialog needs one).

## 2.6 One content, two presentations

Both the modal and the full page render **`<TicketsForSlug>`**. It takes the `params` **Promise**, awaits it, loads the event, and shows the date, the place and the ticket list (with the Reserve buttons from class 7). Because the content is written **once**, the modal and the page can never drift apart. The full page adds only a heading and a back link.

Notice that `params` is passed down **un-awaited**. The modal shell (title, overlay) renders immediately, and the content streams in inside a `<Suspense>`: the same streaming idea you've used since class 2.

## 2.7 Test checklist

| Do this                                                           | Expect                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Click **Get tickets** on `/events`                                | Modal over the list. URL `/events/<slug>/tickets`                      |
| Press **Escape**                                                  | Modal closes, URL is `/events` again                                   |
| Open the modal, click the browser **Back**                        | Same: closes                                                           |
| Open the modal, click **About** in the header                     | The modal is gone, and you're on `/about` (the catch-all at work)      |
| Open the modal, then **refresh**                                  | The full tickets page, not a modal                                     |
| Copy `/events/<slug>/tickets` into a new tab                      | The full page                                                          |
| Remove `[...catchAll]` and repeat the **About** test              | The modal stays open on top of `/about`: now you know why it's there   |

---

# Part 3 — Everything else that changed

## 3.1 The ownership leak is closed

In class 7 `getOrganizerEvents` ignored the organizer's id, so every organizer saw every event. Now **every** query in `db/queries/dashboard.ts` filters by the owner:

```ts
.where(eq(events.organizerId, organizerId))
```

and the id comes from the **session** (`requireOrganizer()` returns the user, the page passes `organizer.id`), never from the URL or a form. This is the "owner in the `WHERE`" rule from class 7, applied to four queries.

## 3.2 New SQL: aggregates for the stats tiles

`getOrganizerStats` computes the numbers for the tiles. Two new tools:

| Tool                                              | What it does                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `count(*) FILTER (WHERE condition)`               | Counts **only the rows matching a condition**. One query produces several counts at once (published **and** drafts), instead of one query per number |
| `coalesce(sum(...), 0)`                           | `SUM` of no rows is `NULL`. `coalesce` turns that into `0`, so an organizer with no sales sees `0`, not nothing |

The three small queries run in parallel with `Promise.all`, and `.mapWith(Number)` converts PostgreSQL's bigint counts (strings in JavaScript) to numbers, as in class 7.

`getRecentOrders` and `getRecentAttendees` use **joins** to walk from an order or ticket to the event and its organizer (a ticket doesn't know its event directly: ticket → ticket type → event), and always include the owner filter.

## 3.3 `createEvent` saves a ticket type

The create-event form already collected a **price** and a **quantity**. Before, the quantity was thrown away. Now the action inserts a `ticket_types` row ("General admission") **in the same transaction** as the event and its categories, so a new event can sell tickets right away (the Reserve buttons from class 7 read those rows). It also uses `getCurrentUser()` now instead of the demo organizer, and `demo-users.ts` and `mocks/` are gone.

## 3.4 Smaller pieces

| What                                  | Where                                              | Notes                                                                     |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| shadcn `Dialog`                       | `components/ui/dialog.tsx`                         | Added with `npx shadcn@latest add dialog`                                 |
| A "Get tickets" link on every card    | `components/event-card.tsx`                        | Goes to `/events/<slug>/tickets`: intercepted into a modal                |
| `BackToEvent`, `TicketsForSlug`       | `events/[slug]/_components/`                        | Small async components that take the `params` Promise                     |
| Nav link "Your events"                | `app/(dashboard)/layout.tsx`                       | The sidebar's first link                                                  |

---

## Known issues in this snapshot

| Problem                                                                          | Why / how to fix                                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run db:seed` fails: `Can't resolve '@/node_modules/@types/pg'` (`db/seed.ts`) | An auto-import picked a path inside `node_modules/@types`. Use `import { Pool } from 'pg';`        |
| **`createEvent` checks that someone is signed in, but not their role**, and throws an error when nobody is | Use `requireOrganizer('/dashboard/events/new')` (role check + redirect). Add the same call at the top of the **new-event page**, which has no guard at all |
| The dashboard says "Signed in as JohnDoe"                                        | Hard-coded. Print `organizer.name`                                                                |
| The Publish / Unpublish buttons do nothing                                       | Still a placeholder `<form action="">`. A Server Action that checks **ownership** goes here       |
| Two files claim the home page: `app/page.tsx` and an empty `app/(marketing)/page.tsx` | One URL can't have two pages. Move the hero into `(marketing)/page.tsx` and delete `app/page.tsx` |
| `npm run typecheck` fails in `types/gatherly-event.ts`                           | It imports types that no longer exist (`Event`, `User`) and nothing uses it. Delete the file      |
| Lint: unused `error` import in `lib/api.ts`; the API still returns HTTP 200 for errors, forgets a `return`, and ignores `limit` | The class 8 issues. See the [class 08 README](../class_08_apis/README.md#known-issues-in-this-snapshot) |
| `npm run format:check` fails on several files                                    | Run `npm run format` (it rewrites files with Prettier). Review the diff, then commit              |
| Slot function named `StatusSlot` (a typo for `StatsSlot`)                        | Harmless: Next.js doesn't use the name. Rename it for clarity                                     |

---

## 🏋️ Try it yourself

1. **See the panels load separately.** Add a 2-second delay to one slot's `page.tsx`. Which panels appear first? What did the delayed one show meanwhile, and which file provided it?
2. **Break one panel.** Make `@orders/page.tsx` throw an error. What does the dashboard show? Which file made the other two panels survive? Press **Try again** after removing the error.
3. **Remove a `default.tsx`.** Delete `@stats/default.tsx`, run `npm run dev`, and refresh `/dashboard`. What happens? Put it back.
4. **Move a panel.** In `(overview)/layout.tsx` move `{attendees}` above the orders. Did you touch any slot? What does that tell you about slots?
5. **Add a fourth panel.** Create `@upcoming` that shows the organizer's next 3 published events. List every file it needs, and what you have to change in the layout.
6. **The catch-all.** Remove `@modal/[...catchAll]`, open the modal, then click **About**. Explain what you see. Put it back.
7. **Check the URL math.** Why is the interceptor named `(.)events` and not `(..)events` or `(.)(marketing)`? Which two kinds of folders don't count?
8. **Reuse the modal.** Make a new route that opens in a modal using the same `RouteModal` (for example `/events/[slug]/share`). Which three files do you need? What stays the same?
9. **Hard vs soft.** Open the modal, copy the URL, and paste it in a private window. What's different, and why?
10. **Think.** The panels each call `requireOrganizer()`. If you removed it from `@orders`, who could read the orders, and how? Which class taught you why?

---

## 🔗 Useful links

**Next.js**

- [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) and [`default.js`](https://nextjs.org/docs/app/api-reference/file-conventions/default)
- [Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups), [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading) and [`error.js`](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) (soft vs hard navigation, client-side transitions)
- [`useRouter`](https://nextjs.org/docs/app/api-reference/functions/use-router)

**UI and accessibility**

- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) and [Base UI Dialog](https://base-ui.com/react/components/dialog)
- MDN: [the `<dialog>` element and focus management](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) and [ARIA dialog role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role)

**SQL**

- PostgreSQL: [aggregate expressions (`FILTER`)](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-AGGREGATES) and [`COALESCE`](https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-COALESCE-NVL-IFNULL)
- [Drizzle: joins](https://orm.drizzle.team/docs/joins) and [`sql` operator](https://orm.drizzle.team/docs/sql)

**Previous classes**

- [Class 08 README](../class_08_apis/README.md): Route Handlers and the public API
- [Class 07 README](../class_07_auth/README.md): authentication, ownership, tickets and error pages
- [Class 06 README](../class_06_forms/README.md): forms and Server Actions
