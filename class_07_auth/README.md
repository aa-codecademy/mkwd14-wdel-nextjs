# Class 06 — Forms & Server Actions (and the Organizer Dashboard)

Until now Gatherly could only **read** data. In this class it learns to **change** data: an organizer fills in a **form**, and a **Server Action** validates it and saves a new event in the database.

This folder is also where the app grows its **organizer dashboard** next to the public site (route groups), and where the events list gets filters, pagination and streaming. Everything is explained here, step by step. The forms part comes first, because it's the heart of the class.

> 🧭 **Where we are:** *creating* an event works end to end (form → validation → database → redirect). The dashboard's **Publish / Unpublish** button is still a placeholder, nobody is signed in yet (a seeded "demo organizer" acts instead), and the ticketing tables exist but nothing uses them yet.

**On this page:**
[Run it](#-run-it) · [Part 1: Forms and Server Actions](#part-1--forms-and-server-actions-step-by-step) · [Part 2: The new tables](#part-2--the-new-database-tables) · [Part 3: Route groups](#part-3--route-groups-and-the-two-shells) · [Part 4: Filters and pagination](#part-4--filters-and-pagination-in-the-url) · [Part 5: Streaming](#part-5--streaming-with-suspense-and-a-skeleton) · [Part 6: The dashboard](#part-6--the-dashboard) · [Known issues](#known-issues-in-this-snapshot) · [Exercises](#-try-it-yourself) · [Links](#-useful-links)

## 📁 What's in this folder

| Folder                    | What it is                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | The course app at this point. Every new file has comments written for students, so read the code next to this README |

---

## 🚀 Run it

You need the PostgreSQL server from class 3 running ([class 03 README](../class_03_db/README.md), Steps 1–2).

```bash
cd class_06_forms/gatherly
npm install
cp .env.example .env         # skip if you already have .env (Windows PowerShell: Copy-Item .env.example .env)
npm run db:migrate           # NEW: this class adds 3 tables (orders, tickets, ticket_types)
npm run db:seed              # fills the tables with fake data. It ADDS rows each time, see the class 04 README for how to reset
npm run dev
```

> ⚠️ **Two things stand between you and a working form.** Read [Known issues](#known-issues-in-this-snapshot) first. Short version:
>
> 1. `npm run db:seed` currently fails because of a wrong import. The one-line fix is in the table below.
> 2. The create-event form acts as a **demo organizer** with the handle `avenga`. The seed doesn't create that user yet, so add it by hand (two rows), like this:
>
> ```sql
> INSERT INTO users (name, email, handle, role) VALUES
>   ('Avenga Academy', 'academy@avenga.example', 'avenga', 'organizer'),
>   ('Demo Attendee',  'attendee@example.com',   'demo-attendee', 'attendee');
> ```
>
> Run it in `psql "<your DATABASE_URL>"`, or with Docker:
> `docker exec -it gatherly-db psql -U postgres -d gatherly -c "INSERT INTO users (name, email, handle, role) VALUES ('Avenga Academy','academy@avenga.example','avenga','organizer'), ('Demo Attendee','attendee@example.com','demo-attendee','attendee');"`

Then try these URLs:

| URL                                                                                | What you should see                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [/dashboard](http://localhost:3000/dashboard)                                      | The organizer's events, in a layout with a sidebar                        |
| [/dashboard/events/new](http://localhost:3000/dashboard/events/new)                | **The new-event form**                                                    |
| [/events](http://localhost:3000/events)                                            | Events with search, category pills, filters and pagination                |
| [/events?page=999](http://localhost:3000/events?page=999)                          | "There are only N pages of results", with a link to the last page         |
| [/about](http://localhost:3000/about)                                              | A static page inside the public layout                                    |

---

# Part 1 — Forms and Server Actions, step by step

## 1.1 The problem

A page that only reads data is easy: the server runs a query and sends HTML. But to **create** an event, three things have to happen:

1. the browser shows a **form** and sends what the user typed,
2. the **server** receives it, checks it, and writes it to the database,
3. the browser shows **the result**: either "saved" or "this field is wrong".

Before **Server Actions**, you built every piece by hand: an API route (`app/api/events/route.ts`), a `fetch('/api/events', { method: 'POST', body: ... })` call in the browser, JSON encoding and decoding, loading state, and error state, all wired together manually.

A **Server Action** removes the wiring. It's an `async` function that runs **on the server**, and you hand it directly to a form:

```tsx
<form action={createEvent}> ... </form>
```

Next.js turns this into a POST request, runs the function on the server and sends back the result. You write the form and the function. Next.js writes the networking.

```
 browser                                          server
 ───────                                          ──────
 <form action={formAction}>         POST          createEvent(prevState, formData)
   fields...                    ───────────►        1. read the form data
   [Create Event]                                   2. validate it (Zod)
                                                    3. check it against the database
 shows errors, or navigates      ◄───────────       4. save it (transaction)
 to /dashboard                    result            5. revalidate + redirect, or return errors
```

## 1.2 The files, and who runs where

| File                                                                     | Runs on        | Job                                                                |
| ------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------ |
| `app/(dashboard)/dashboard/events/new/page.tsx`                          | **server**     | Loads the venues and categories, renders the form                  |
| `.../new/_components/new-event-form.tsx`                                 | **browser** (and server for the first HTML) | The `<form>`, wired to the action with `useActionState` |
| `.../new/_components/field.tsx`, `field-errors.tsx`                      | browser        | A label + control + error messages, reused for every field         |
| `components/submit-button.tsx`                                           | browser        | A button that disables itself while saving (`useFormStatus`)       |
| `app/actions/events.ts`                                                  | **server only** | **The Server Action** `createEvent`: validate, save, redirect      |
| `db/demo-users.ts`                                                       | server only    | "Who is acting?" until sign-in exists                              |
| `db/queries/dashboard.ts`                                                | server only    | `getEventFormOptions()` for the form's dropdown and checkboxes     |

A useful way to remember it:

```
page (server)   ──props──►  form (client)  ──submit──►  action (server)
reads the options           shows state                 validates and writes
```

## 1.3 Step by step: follow one submit from click to database

Open [the form](http://localhost:3000/dashboard/events/new), the file `new-event-form.tsx`, and `app/actions/events.ts` side by side. We'll follow what happens.

### Step 1. The page loads the options (server)

`page.tsx` is a Server Component. It calls `getEventFormOptions()` and passes `{ venues, categories }` to the form as **props**. The dropdown and the checkboxes are therefore built from **the database**: add a venue, and it shows up without touching the form's code.

Props going from a Server Component to a Client Component must be **plain data** (objects, arrays, strings, numbers). They travel over the network, so functions and class instances can't be passed.

### Step 2. The form connects to the action (client)

```tsx
'use client';

const [state, formAction, pending] = useActionState(createEvent, initialState);

return <form action={formAction}> ... </form>;
```

`useActionState` is a React hook. You give it the Server Action and a starting state, and it returns **three things**:

| Returned      | What it is                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `state`       | **What the action last returned.** First it's `initialState`. After each submit it's the new result |
| `formAction`  | A wrapped version of the action. **This is what goes into `<form action={...}>`**                  |
| `pending`     | `true` while the action is running                                                                 |

That's why the form is a **Client Component** (`'use client'`): hooks only work there. Note what's *missing*: no `onSubmit`, no `fetch`, no `event.preventDefault()`. A `<form action={function}>` is all React needs.

### Step 3. The browser builds a `FormData`

When the user presses the button, the browser collects every field into a **`FormData`** object. Each field is stored under its **`name`** attribute:

```html
<input name="title" value="Next.js Meetup" />          →  title        = "Next.js Meetup"
<input name="price" type="number" value="12.5" />      →  price        = "12.5"        (a STRING!)
<input type="checkbox" name="categoryIds" value="a1">  →  categoryIds  = "a1"          (only if ticked)
<input type="checkbox" name="categoryIds" value="b2">  →  categoryIds  = "b2"          (again, same name)
```

Three things to know:

1. **Everything is a string** (or a file). Even `type="number"`. You convert later.
2. **`name` is the key.** No `name` → the field is not sent. The names must match the keys in your Zod schema.
3. **A repeated name means a repeated entry.** Two ticked checkboxes called `categoryIds` give two entries. `Object.fromEntries(formData)` keeps only the **last** one, so the action reads them with `formData.getAll('categoryIds')`, which returns an array.

### Step 4. The action starts (server)

```ts
'use server';

export async function createEvent(_prev: CreateEventState, formData: FormData): Promise<CreateEventState> {
```

- **`'use server'`** at the top of the file marks every exported function as a Server Action. So every export must be `async`. (Exporting *types* is fine; they vanish when compiled.)
- The signature `(previousState, formData)` is the one `useActionState` expects: it passes the **previous state** first, then the **form data**. We don't need the previous state, so it's called `_prev`. The underscore tells ESLint "unused on purpose".
- It returns the **new state**, which becomes `state` in the form.

> 🔒 **The most important sentence of this class:** a Server Action is a **public HTTP endpoint**. Anyone can send it a POST request with any data, without ever opening your form (with curl, or by editing the HTML in DevTools). Next.js docs say it plainly: Server Actions "are reachable via direct POST requests, not just through your application's UI". So the action must **never trust its input** and must **check who is calling**. Everything that follows is built on that.

### Step 5. Authenticate: who is asking?

```ts
const organizer = await getDemoOrganizer();
```

The first thing an action asks is *who is this?* There's no sign-in in the app yet, so `db/demo-users.ts` returns a fixed, seeded user (handle `avenga`). When authentication arrives, this one line is replaced by "read the real session, and stop with an error if nobody is signed in".

The key point: **the organizer comes from the server, never from the form.** If the form had a hidden `<input name="organizerId">`, anyone could change it in DevTools and create events *as someone else*.

> ⚠️ A page-level check does **not** protect the actions inside it. Even if only organizers can open `/dashboard/events/new`, the action is its own endpoint and must check again by itself.

### Step 6. Validate with Zod

First the schema describes what a **valid** form looks like, once:

```ts
const CreateEvent = z.object({
  title: z.string().trim().min(3, { error: 'Title must be at least 3 characters long' }).max(120),
  price: z.coerce.number().min(0, { error: "Price can't be a negative number" }),
  categoryIds: z.array(z.uuid()).min(1, { error: 'Pick at least one category' }),
  // ... description, venueId, startsAt, endsAt, quantity
}).refine((event) => event.endsAt > event.startsAt, {
  error: 'Event must end after it starts',
  path: ['endsAt'],
});
```

What to notice:

| Piece                              | What it does                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `z.string().trim().min(3)`         | Text, spaces trimmed first, at least 3 characters                                              |
| `{ error: '...' }`                 | The message the user sees. (This is **Zod 4** syntax. Old Zod 3 tutorials use `{ message }`, which is wrong here) |
| `z.coerce.number()`                | **Converts first, checks second.** The form sends `"12.5"`, and this turns it into `12.5`      |
| `z.coerce.date()`                  | Turns `"2027-03-12T09:00"` into a `Date`                                                       |
| `z.uuid()`                         | Must look like an id. A `<select>` sends the venue's id as text                                |
| `z.array(z.uuid()).min(1)`         | The ticked checkboxes: a list with at least one id                                             |
| `.refine(...)` with `path`         | A rule that compares **two fields** ("ends after it starts"). `path` says which field shows the error |

Then the action runs it:

```ts
const parsed = CreateEvent.safeParse(raw);

if (!parsed.success) {
  return { errors: z.flattenError(parsed.error).fieldErrors, values };
}
```

- **`safeParse`** never throws. It gives `{ success: true, data }` or `{ success: false, error }`. (`parse` would throw, and a thrown error crashes the request.)
- **`z.flattenError(error).fieldErrors`** reshapes Zod's error into something the form can use directly:

```json
{
  "title":    ["Title must be at least 3 characters long"],
  "endsAt":   ["Event must end after it starts"],
  "categoryIds": ["Pick at least one category"]
}
```

- After a successful parse, `parsed.data` is **clean and typed**: real `Date` objects, real numbers, real arrays. Nothing downstream has to wonder.

**Why validate on the server when the inputs already have `required` and `min`?** Those attributes are only a convenience for honest users, and anyone can remove them in DevTools or skip the form completely. **The server is the only place where validation counts.** (Try it, see exercise 2.)

### Step 7. Return the errors, don't throw them

On a validation failure the action **returns** a state object:

```ts
export type CreateEventState = {
  errors?: Partial<Record<Field, string[]>>;   // one list of messages per field
  message?: string;                            // a message about the whole form
  values?: Partial<Record<Field, string | string[]>>;   // what the user typed
};
```

Returning (instead of throwing) is what lets the form show a message **next to each wrong field**. React puts the returned object in `state`, the form re-renders, and each `<Field errors={state.errors?.title}>` prints its messages through `<FieldErrors>`.

**Why `values`?** Here's the timeline that surprises everyone:

```
1. The user fills in 8 fields and presses submit.
2. The action runs and returns errors.
3. React RESETS the form after an action runs (uncontrolled inputs go back to their defaults).
4. Without `values`, the user would find EVERY field empty again, because one field was wrong.
```

So the action sends back what was typed (`values`), and every input uses it as its starting value: `defaultValue={value('title')}`. That's why the inputs use **`defaultValue`** (uncontrolled) and not `value` + `onChange`: the browser owns the text while the user types, and we only decide where it starts.

### Step 8. Check the data against the database

```ts
const venue = await db.query.venues.findFirst({ where: eq(venues.id, input.venueId) });
if (!venue) return { errors: { venueId: ["That venue doesn't exist"] }, values };
```

Validation checks the **shape** of the data ("this looks like an id"). It can't know the venue **exists**. Someone can submit any valid-looking id, so we look it up. This is **authorization / checking the world**, the step between validating and writing.

(An honest note: the category ids get no such check. A made-up category id would fail later at the database's foreign key, as an unhandled error. Exercise 8 is about that.)

### Step 9. Save, inside a transaction

```ts
await db.transaction(async (tx) => {
  const [insertedEvent] = await tx.insert(events).values({ ...input, slug, organizerId: organizer.id, city: venue.city, minPriceCents: priceCents, status: 'draft' }).returning({ id: events.id });
  await tx.insert(eventCategories).values(categoryIds.map((categoryId) => ({ eventId: insertedEvent.id, categoryId })));
});
```

Each detail has a reason:

| Detail                                          | Why                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Transaction**                                 | The event and its category links are saved **together or not at all**. No event left without categories if the second insert fails |
| `.returning({ id })`                            | PostgreSQL generates the id. We need it for the second insert                                    |
| `priceCents = Math.round(price * 100)`          | Money is stored as whole **cents**. `12.50 * 100` can be `1249.9999999999998` in floating point, so we round |
| `organizerId: organizer.id`                     | From the **session**, never from the form (see Step 5)                                           |
| `city: venue.city`                              | Copied from the venue, so the list page can filter by city without a JOIN                        |
| `status: 'draft'`                               | New events start as drafts. The organizer publishes them later                                   |
| `slug: await uniqueSlug(title)`                 | "Next.js Conf 2027!" → `next-js-conf-2027`. If it's taken, a short random suffix is added        |

### Step 10. Revalidate, then redirect

```ts
revalidatePath('/dashboard');
redirect('/dashboard');
```

- **`revalidatePath('/dashboard')`**: *"the data behind this page changed, render it again."* Next.js may remember (cache) a rendered page. We just added an event, so the dashboard must not show its old list. A mutation without a revalidate is a classic bug: the data is saved, but the screen doesn't change.
- **`redirect('/dashboard')`**: send the browser to the list, where the new draft appears at the top.

Two rules about `redirect`:

1. It works by **throwing a special error** (`NEXT_REDIRECT`) that Next.js understands, so **no code after it runs**, and the function has no `return` on success.
2. Because it throws, it must **not be inside a `try/catch`**: the `catch` would swallow it and nothing would redirect. Call it outside, as we do here.

### Step 11. The pending state: don't let people click twice

While the action runs (a few hundred milliseconds, or seconds on a slow network), a user may click again and create **two events**. The form prevents this with two tools, because they solve slightly different problems:

| Tool                | Where it comes from                | Where you can use it                                                     |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `pending` (the 3rd value of `useActionState`) | `react`          | In the **same component** that calls `useActionState`. We use it for `aria-busy` on the form |
| `useFormStatus()`   | `react-dom`                        | In a **child component inside the `<form>`**, never in the component that renders the form |

That second rule is why `SubmitButton` is its own file. It calls `useFormStatus()`, reads `pending`, and returns a button that is **disabled** and shows "Creating event..." while the action runs. Put in the same component as the `<form>`, `useFormStatus` would always say `false`.

### Step 12. Accessibility: forms are for everyone

| Practice                         | In our form                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Every control has a **label**    | `<label htmlFor="title">` and `<Input id="title">`. The `htmlFor` must equal the `id`: clicking the label focuses the field, and screen readers read it |
| Group related controls           | The checkboxes are in a `<fieldset>` with a `<legend>` ("Categories")                                 |
| Show errors **next to** the field | `<FieldErrors>` under each field, in red (`text-destructive`)                                        |
| Say it's busy                    | `aria-busy={pending}` on the form                                                                     |
| Link an error to its field       | `aria-describedby="title-error"` on the input. The error elements already have ids (`title-error`), but the inputs don't point at them yet. A good exercise |

## 1.4 `useActionState` or `useFormStatus`?

| You want to...                                               | Use                           |
| ------------------------------------------------------------ | ----------------------------- |
| Show the action's **result** (errors, values, a message)     | `useActionState`              |
| Know "is this form submitting?" in the **form component**    | `pending` from `useActionState` |
| Disable a button / show a spinner in a **child** of the form | `useFormStatus`               |
| Show a result instantly, before the server answers           | `useOptimistic` (later)       |

Both need a Client Component. Neither is needed for a form to *work*: `<form action={serverAction}>` alone already submits. They add **feedback**.

## 1.5 Progressive enhancement: it works before JavaScript loads

Because the form is a real `<form>` with an `action`, the browser can submit it even if the JavaScript hasn't loaded yet (slow phone, flaky network) or failed. Next.js then does a normal full-page request and renders the result. Once JavaScript is ready, the same form is submitted without a reload. That's called **progressive enhancement**: the basic thing always works, and JavaScript makes it nicer.

This is the reason to prefer `<form action={...}>` over `onSubmit` + `fetch`. Try it: DevTools → Settings → "Disable JavaScript", reload, and submit the form.

## 1.6 Security checklist for every Server Action

Before you call an action done, check each item:

1. ✅ **Authenticate**: does it know who is calling, from the **server** (session), not from the form?
2. ✅ **Validate**: is every input checked with a schema (`safeParse`), including types, lengths and ranges?
3. ✅ **Authorize**: may *this* user do this to *this* record? (Is it their event? Does the venue exist?)
4. ✅ **Never trust hidden fields or bound arguments**: `<input type="hidden">` and `action.bind(null, id)` both come from the browser too. Re-check them, and put ownership in the `WHERE` of an update.
5. ✅ **Order matters**: authenticate → validate → authorize → change data → revalidate → return or redirect.
6. ✅ **Fail gracefully**: bad input returns messages. A user should never see a stack trace.

## 1.7 Gotchas in this form (found while reading it)

These are in the code comments too. They make great discussion points:

| Gotcha                                                                      | What happens / the fix                                                                                      |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| An **empty number field** becomes `0` with `z.coerce.number()`              | An empty price silently means "free", and the "Enter a price" message can never appear. Check for `""` first |
| `datetime-local` has **no time zone**                                       | `"2027-03-12T09:00"` is read in the **server's** zone (your laptop now, UTC once deployed), so times can shift |
| After an error, the **`<select>`** may jump back to its first option        | React restores the option it mounted with. Add `key={value('venueId')}` so it rebuilds                      |
| The venue's **label doesn't focus** its select                              | `<Field name="venue">` but the select's `id` is `venueId`. `htmlFor` must equal `id`                        |
| `errors?.length && <X />` can render a stray **"0"**                        | React prints the number 0. Write `errors && errors.length > 0 && ...`                                       |
| `uniqueSlug` **checks, then inserts**                                       | Two people submitting the same title at once can both pass the check. The database's UNIQUE constraint is the real guard: catch that error and retry |
| `quantity` is **validated but never saved**                                 | It's meant for the `ticket_types` table, which the action doesn't fill yet (ESLint reports it as unused)    |

---

# Part 2 — The new database tables

This class's migration adds the groundwork for **selling tickets**. Run `npm run db:migrate` and PostgreSQL gets three new tables and one new type (`drizzle/0003_*.sql`):

```
events ──< ticket_types          what you can buy, its price, how many exist
users  ──< orders >── events     one purchase: who bought, for which event, how much
orders ──< tickets >── ticket_types   one row per admission, each with a UNIQUE code
```

| Table          | Columns worth knowing                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `ticket_types` | `event_id`, `name` ("Standard", "VIP"), `price_cents`, `quantity` (how many exist)                 |
| `orders`       | `user_id`, `event_id`, `status` (`pending` / `paid` / `refunded` / `canceled`), `total_cent`       |
| `tickets`      | `order_id`, `ticket_type_id`, `code` (**unique**, what the QR code will carry), `attendee_name`    |

Things to understand:

- **They're unused for now.** No page reads or writes them. They exist so the next features (reserving tickets, the QR check-in) have somewhere to go.
- **Delete rules** (`onDelete`): a ticket type disappears when its event is deleted (`cascade`), and tickets disappear with their order (`cascade`). But you **can't** delete a user or an event that has orders, or a ticket type that has tickets (the default, "no action"). That protects sales history.
- **Spelling trap:** event statuses use `'cancelled'` (two l's), order statuses use `'canceled'` (one l). Both are valid English, and mixing them up is an easy bug, so copy them exactly.
- **Relations** were added (`ticketTypesRelations`, `ordersRelations`, `ticketsRelations`, and `ticketTypes: many(...)` on events) so queries can use `with: { ticketTypes: true }`.
- **Types** are derived from the tables again: `TicketType`, `Order`, `Ticket`, and `EventStatus` / `OrderStatus` from the enums' `enumValues`.

How to read the migration: open `drizzle/0003_*.sql` and match each `CREATE TABLE` to the table in `db/schema.ts`. That's the workflow from class 3 (`generate`, read, `migrate`).

---

# Part 3 — Route groups and the two shells

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
├── (dashboard)/                    ← the organizer area
│   ├── layout.tsx                  ← sidebar, no site header
│   └── dashboard/
│       ├── page.tsx                ← "/dashboard"
│       └── events/new/page.tsx     ← "/dashboard/events/new"  (the form from Part 1)
└── actions/
    └── events.ts                   ← Server Actions (not a route: no page.tsx)
```

Why? Before, the header and footer lived in the root layout, so **every** page had them. A dashboard shouldn't. With groups, each part of the app gets its own frame:

```
/events     RootLayout ─► MarketingLayout (header, footer) ─► EventsLayout (breadcrumb) ─► page
/dashboard  RootLayout ─► DashboardLayout (sidebar)                                      ─► page
```

- The group name **never appears in the URL**. That's why the folder is `(dashboard)/dashboard/`: the outer one is the group, the inner one gives `/dashboard`.
- **Two pages can't resolve to the same URL.** `app/page.tsx` and `app/(marketing)/page.tsx` would both be `/`. (A [known issue](#known-issues-in-this-snapshot).)
- The **root layout** is the only one that renders `<html>` and `<body>`. Groups add frames *inside* it.
- Layouts stay mounted while you move between pages of the same group. Moving to the *other* group changes the whole shell.
- A **private folder** (`_components`) starting with an underscore is never a route. It keeps the pieces that belong to one page next to it. `app/actions/` isn't a route either, simply because it has no `page.tsx`.

---

# Part 4 — Filters and pagination in the URL

Every control on `/events` changes the **URL**, and the server re-renders. There are three mechanisms, each the simplest one that works:

| Control                 | Mechanism                                              | Client JavaScript? |
| ----------------------- | ------------------------------------------------------ | ------------------ |
| Search box (`?q=`)      | `useRouter().replace()` after a debounce               | yes (reacts while typing) |
| Category pills          | plain `<Link href="/events?category=meetup">`          | no                 |
| City / date / sort      | a `<Form>` from `next/form` that submits with GET      | no                 |

**`next/form`'s `<Form>`** is a `<form>` that, submitted with GET, becomes a client-side **navigation** to `/events?city=...&from=...&sort=...`: no full reload, and it works without JavaScript. A GET form **replaces the whole query string**, so to keep the search text and category the form re-sends them as **hidden inputs**. Compare with Part 1: that was a POST form (it *changes* data), this is a GET form (it only *reads*). A GET form never needs a Server Action.

**`eventsHref(filters, patch)`** (`lib/event-filters.ts`) builds a `/events` URL from the current filters, changing only what's in `patch`. Every pill and pagination link uses it, so they all keep the user's other filters. It leaves out defaults (no `?sort=date`, no `?page=1`).

**The Zod schema** (the same idea as in the action) stays **forgiving**: anything invalid falls back to a default instead of crashing.

| Param      | Rule                                                    | `?x=garbage` becomes |
| ---------- | ------------------------------------------------------- | -------------------- |
| `q`        | trimmed text, at least 1 character                      | no filter            |
| `category`, `city` | any non-empty text                              | matches nothing      |
| `from`     | `z.iso.date()`, a real date as `YYYY-MM-DD`             | no filter            |
| `sort`     | `z.enum(['date', 'price', 'newest'])`                   | `'date'`             |
| `page`     | `z.coerce.number().int().min(1)`                        | `1`                  |

*Pages are forgiving, actions are strict:* in a page, bad URL input becomes "no filter". In an action, bad form input becomes an **error message** the user must fix.

**Pagination = `LIMIT` + `OFFSET`.** We show 6 events per page (`PAGE_SIZE`): page 1 skips 0 rows, page 2 skips 6, page 3 skips 12. To print "Page 2 of 5" we also need the total number of matches: `db.$count(events, where)`, using the **same** `where`. The page rows and the count are independent, so they run **at the same time** with `Promise.all`. `pageCount = Math.ceil(total / PAGE_SIZE)`, at least 1.

**Handle the empty cases.** `EventResults` decides between: (1) results on this page; (2) the page is **past the end** (`?page=99`): "There are only N pages", with a link to the last page; (3) **nothing matches**: "No events match", with a link to clear the filters. The check `events.length === 0 && total > 0` separates (2) from (3).

**Building the query.** `browseConditions` starts with `status = 'published'` and **adds one condition per filter the user set**, then joins them with `and(...)`. The category filter uses a **subquery** (`inArray(events.id, <inner select>)`), because events and categories are many-to-many. `sortOrder` maps `?sort=` to an `ORDER BY` (with a tie-breaker), and `selectDistinct` gives each city once for the dropdown.

> 💡 Searching while on page 3 keeps `?page=3`. A cleaner behaviour is `next.delete('page')` in `search-box.tsx`. Try it as an exercise.

---

# Part 5 — Streaming with `<Suspense>` and a skeleton

Recall class 02's `/streaming` example. The events page does the same for real:

```tsx
<Suspense key={JSON.stringify(filters)} fallback={<EventGridSkeleton />}>
  <EventResults filters={filters} />
</Suspense>
```

`EventResults` awaits the database, so it *suspends*. Everything outside the boundary (heading, search box, filters) is sent immediately, the **skeleton** shows in the gap, and the real grid is streamed in when its query finishes.

- **A good skeleton has the same shape** as what it replaces (grid, image, title line), so nothing jumps when the real cards arrive. `Skeleton` is a shadcn component: a grey box with `animate-pulse`.
- **Why the `key`?** A boundary shows its fallback only the *first* time. Without the `key`, changing a filter would keep the **old** results on screen until the new ones are ready, with no sign of loading. A `key` that changes with the filters says "new boundary", so the skeleton shows on every search, filter and page change.
- `getFilterOptions()` is awaited **outside** the boundary, so the page shell still waits for that one small query.

---

# Part 6 — The dashboard

`/dashboard` lists the organizer's events, newest first, with a status badge. Its **New event** button opens the form from Part 1, and after saving you land back here, with the new draft on top.

- It's in the **(dashboard)** group, so it gets the **sidebar** layout. The site header has a "For organizers" link to it.
- **`buttonVariants()`** gives a `<Link>` the look of a button. "New event" *navigates*, so it must be a link, not a `<button>`.
- Only **published** events link to their public page. A draft's `/events/<slug>` would be a 404.
- `getOrganizerEvents` is **not** limited to published events (an organizer must see drafts), and it selects only the columns the list needs.

What is still a **placeholder**:

| Placeholder                                         | What it will become                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| "Signed in as JohnDoe"                              | The real signed-in organizer                                             |
| `getOrganizerEvents('')` returns **everyone's** events | Only the signed-in organizer's own events (the `where` is commented out) |
| `<form action="">` around Publish / Unpublish       | A **second Server Action** that changes the event's status (exercise 6)  |
| `db/demo-users.ts`                                  | Deleted: every action reads the real session instead                     |

> 🔒 **Rule for later:** a dashboard query must **always** be limited to the current user. Returning all rows "for now" is fine on a laptop and a serious data leak in production.

---

## Known issues in this snapshot

Run `npm run check` and `npm run build` and you'll meet these. Fix them, in this order:

| Problem                                                                 | Why / how to fix                                                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run db:seed` fails: `Module not found: Can't resolve '@/node_modules/@types/pg'` (`db/seed.ts`) | An editor auto-import picked a path inside `node_modules/@types`, which only has type definitions. Use `import { Pool } from 'pg';`. (`db/index.ts` already has it right) |
| The create-event form throws `Demo user "avenga" not found`             | `db/demo-users.ts` needs users with the handles `avenga` and `demo-attendee`, and the seed makes random ones. Insert the two rows from [Run it](#-run-it), or add them to `db/seed.ts` |
| Two files for the home page: `app/page.tsx` **and** an **empty** `app/(marketing)/page.tsx` | One URL can't have two pages, and an empty file isn't a valid page (`tsc`: "is not a module"). Move the hero from `app/page.tsx` into `app/(marketing)/page.tsx` and delete `app/page.tsx`, so `/` gets the header and footer too |
| `npm run lint`: `'quantity' is assigned a value but never used` (`app/actions/events.ts`) | The form collects a ticket quantity, but the action doesn't save it yet. Use it (create a `ticket_types` row in the same transaction, exercise 5), or drop it from the destructuring |
| `npm run lint`: `'eq' is defined but never used`, `'organizerId' is defined but never used` (`db/queries/dashboard.ts`) | They belong to the commented-out `where`. Prefix the argument with `_` and remove the `eq` import until sign-in exists |
| `npm run typecheck` fails in `mocks/mock-events.ts` and `types/gatherly-event.ts` | They import the old type name `Event` (now `GatherlyEvent`) and **nothing uses them**. Delete the `mocks/` folder and `types/gatherly-event.ts` |
| The venue label doesn't focus its select; the select may jump back after an error | See the [gotchas table](#17-gotchas-in-this-form-found-while-reading-it) (`htmlFor` and `key`)       |
| Nit: `db/queries/dashboard.ts` has no `import 'server-only'` and imports `db` from `'..'` | Add `import 'server-only';` like `db/queries/events.ts`                                          |
| Inter isn't actually applied (`app/layout.tsx`)                         | `font-sans` reads `--font-sans`, but the layout defines `--font-inter`. Set `--font-sans: var(--font-inter)` in `globals.css` |

---

## 🏋️ Try it yourself

1. **Create an event.** Open `/dashboard/events/new`, fill the form and submit. Then look at the `events` and `event_categories` tables in Drizzle Studio (`npm run db:studio`). Where is your event? How many rows were created in the join table? What is its status?
2. **Break the validation from the browser.** Submit the form empty. Then, in DevTools, delete the `min` attribute from the price field, type `-5` and submit. Which message do you get, and *who* produced it? Why is that the important part?
3. **Look at the network.** Open the Network tab and submit with an error, then with valid data. Find the POST request. What does the response contain? Why does a successful submit end with a redirect?
4. **No JavaScript.** Disable JavaScript in DevTools, reload and submit the form. Does it still work? Which of the two hooks (`useActionState`, `useFormStatus`) do you lose, and what does the user still get?
5. **Use the `quantity`.** In the same transaction that creates the event, also insert a `ticket_types` row (a name like "Standard", `priceCents`, `quantity`). Check it in Studio. This also removes the lint error.
6. **Wire Publish / Unpublish.** Write a second Server Action `setEventStatus(eventId, formData)`. Hint: pass the event id with `action={setEventStatus.bind(null, event.id)}`. Remember the checklist: the id comes from the browser, so validate it, and make sure the event belongs to the organizer in the `WHERE` of the update. Then `revalidatePath('/dashboard')`.
7. **Add a field.** Add an optional `website` field to the form (`z.url()`, or empty). Does your schema accept an empty string? (Hint: `""` is not a valid URL.) Does it need a migration?
8. **Harden the action.** Make an invalid **category id** produce a friendly message instead of a crash (look at how `venueId` is checked). Then handle the **unique slug race** by catching the database's duplicate error and retrying.
9. **Fix the form's small bugs:** the venue label (`htmlFor`), the `<select>` that resets (`key`), and add `aria-describedby` so each input points to its error.
10. **Think.** Why does `createEvent` take `organizer` from `getDemoOrganizer()` and not from a hidden `<input name="organizerId">`? What could someone do if it did?

---

## 🔗 Useful links

**Forms and Server Actions**

- [Next.js: Forms](https://nextjs.org/docs/app/guides/forms) — validation, `useActionState`, `useFormStatus`, pending states
- [Next.js: Mutating data (Server Functions)](https://nextjs.org/docs/app/getting-started/mutating-data) and [`'use server'`](https://nextjs.org/docs/app/api-reference/directives/use-server)
- [Next.js: Data security](https://nextjs.org/docs/app/guides/data-security) — why Server Actions must check authentication and authorization
- [`revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) and [`redirect`](https://nextjs.org/docs/app/api-reference/functions/redirect)
- React: [`useActionState`](https://react.dev/reference/react/useActionState), [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) and [`<form>`](https://react.dev/reference/react-dom/components/form)
- [Zod: error formatting (`flattenError`)](https://zod.dev/error-formatting) and [defining schemas (`coerce`, `refine`)](https://zod.dev/api)
- [Input validation cheat sheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

**HTML and accessibility**

- MDN: [`<form>` and sending data](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data), [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData), [`<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label), [`<fieldset>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset) and [`datetime-local`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local)
- [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby) and [`aria-busy`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy)

**Next.js: routing and streaming**

- [Route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) and [project organization (private folders)](https://nextjs.org/docs/app/getting-started/project-structure)
- [`<Form>` (`next/form`)](https://nextjs.org/docs/app/api-reference/components/form)
- [Streaming](https://nextjs.org/docs/app/guides/streaming) and [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Learn Next.js: search and pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) and [mutating data](https://nextjs.org/learn/dashboard-app/mutating-data)

**Drizzle**

- [Transactions](https://orm.drizzle.team/docs/transactions) and [insert with `returning`](https://orm.drizzle.team/docs/insert)
- [Filter operators (`and`, `eq`, `gte`, `ilike`, `inArray`)](https://orm.drizzle.team/docs/operators), [Select (limit, offset, distinct, `$count`)](https://orm.drizzle.team/docs/select) and [relational queries](https://orm.drizzle.team/docs/rqb)

**Previous classes**

- [Class 04 README](../class_04_routing/README.md): the seed script, queries layer, dynamic route and search
- [Class 03 README](../class_03_db/README.md): PostgreSQL and Drizzle setup, migrations
- [Class 02 README](../class_02_essentials/README.md): Server vs Client Components, Suspense, shadcn/ui
