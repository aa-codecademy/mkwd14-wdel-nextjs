# Class 08 — Route Handlers & a Public API

Until now, everything Gatherly sent out was made **for people**: HTML pages. In this class it also learns to talk to **programs**: a phone app, another website, a script, a calendar. For that we build a small **public JSON API** with **Route Handlers**, the Next.js files that answer plain HTTP requests.

> 🧭 **Where we are:** two read-only endpoints work (`GET /api/events` and `GET /api/events/[slug]`), plus the calendar download from class 7 (`.ics`). The design is right (strict validation, a whitelist of public fields, one error format), but **two bugs** stop errors from working properly: they go out as HTTP **200**, and the list endpoint forgets a `return`. Both are explained in [Known issues](#known-issues-in-this-snapshot) and are great exercises.

This folder is class 7 plus the API. Everything about sign-in, tickets and errors is explained in the [class 07 README](../class_07_auth/README.md).

**On this page:**
[Run it](#-run-it) · [Part 1: What is an API](#part-1--what-is-an-api) · [Part 2: Route Handlers step by step](#part-2--route-handlers-step-by-step) · [Part 3: The events API](#part-3--the-events-api) · [Part 4: Designing the response](#part-4--designing-the-response) · [Part 5: Validation and errors](#part-5--validation-and-errors) · [Part 6: Testing an API](#part-6--testing-an-api) · [Part 7: Security](#part-7--security-checklist-for-an-api) · [Known issues](#known-issues-in-this-snapshot) · [Exercises](#-try-it-yourself) · [Links](#-useful-links)

## 📁 What's in this folder

| Folder                    | What it is                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | The course app at this point. Every new file has comments written for students, so read the code next to this README |

---

## 🚀 Run it

Same setup as class 7: PostgreSQL running ([class 03](../class_03_db/README.md)), a `.env` with `DATABASE_URL`, `BETTER_AUTH_SECRET` and (optionally) the GitHub values ([class 07, Part 2](../class_07_auth/README.md#part-2--getting-the-github-credentials-step-by-step)).

```bash
cd class_08_apis/gatherly
npm install
cp .env.example .env         # skip if you already have .env (Windows PowerShell: Copy-Item .env.example .env)
npm run db:migrate
npm run db:seed              # see the first row of Known issues: the seed has a wrong import to fix first
npm run dev
```

Then call the API. The simplest way is the browser: open the URLs. Or use `curl` (Part 6):

| URL                                                                           | What you get                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [/api/events](http://localhost:3000/api/events)                               | A page of published events, as JSON                                       |
| [/api/events?q=next&sort=price](http://localhost:3000/api/events?q=next&sort=price) | Filtered and sorted                                                 |
| [/api/events?page=2](http://localhost:3000/api/events?page=2)                 | The second page                                                           |
| `/api/events/<a-real-slug>`                                                   | One event. Get a slug from the list                                       |
| [/api/events/does-not-exist](http://localhost:3000/api/events/does-not-exist) | An error JSON (with the status bug, see Known issues)                     |
| `/api/events/<a-real-slug>/calendar.ics`                                      | A downloaded calendar file                                                |

---

# Part 1 — What is an API?

An **API** (application programming interface) is a way for **programs** to talk to your app. A web **page** answers a browser with HTML that a person reads. An **API** answers any program with **data** (almost always JSON) that code reads.

```
a person  ── GET /events/some-event ───────────►  Gatherly ─► HTML   (a page to look at)
a program ── GET /api/events/some-event ───────►  Gatherly ─► JSON   (data to use)
```

The same app, the same database, the same query functions. Only the **last step** differs: render a page, or return data. That's why the queries live in `db/queries/` and not inside the pages.

## 1.1 HTTP in one page

An API is spoken in **HTTP**. Every exchange has a request and a response.

**Methods** (what the client wants to do):

| Method   | Meaning                       | Gatherly example                                 |
| -------- | ----------------------------- | ------------------------------------------------ |
| `GET`    | **Read.** Never changes data  | List events, get one event, download the `.ics`  |
| `POST`   | **Create** something          | Create an event (later)                          |
| `PUT` / `PATCH` | Replace / change something | Update an event                                |
| `DELETE` | Remove something              | Cancel an event                                  |

**Status codes** (how it went). The code is as important as the body, and clients read it **first**:

| Code  | Name                   | Use it when                                                   |
| ----- | ---------------------- | ------------------------------------------------------------- |
| `200` | OK                     | It worked, and here's the data                                |
| `201` | Created                | A new thing was created                                       |
| `400` | Bad Request            | The **client** sent something invalid (a bad query string)    |
| `401` | Unauthorized           | "Who are you?" Not signed in (class 7)                        |
| `403` | Forbidden              | Signed in, but not allowed (class 7)                          |
| `404` | Not Found              | No such thing (or one we won't confirm exists)                |
| `500` | Internal Server Error  | **We** broke: a bug, or the database is down                  |

Rule of thumb: **2xx** = success, **4xx** = the caller's fault (fixing the request helps), **5xx** = our fault.

**Headers** are small labels on a request or response, such as `Content-Type: application/json` (what the body is) or `Content-Disposition: attachment` (download this).

**JSON** is the data format: objects, arrays, strings, numbers, booleans, `null`. It has **no Date type**, so dates travel as text (ISO 8601: `"2027-03-12T08:00:00.000Z"`).

## 1.2 Page, Server Action or Route Handler?

You now have three ways to run code on the server. Choosing right is a skill:

| You want to...                                                       | Use                                   | Why                                                         |
| -------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| Show something to a **person**                                       | A **page** (`page.tsx`)               | Returns HTML                                                |
| **Change data** from **your own** form or button                     | A **Server Action** (class 6)         | Next.js wires the form and the function for you             |
| Serve **other programs**: a JSON API, a **file download**, a webhook | A **Route Handler** (`route.ts`)      | You control the full HTTP response: status, headers, body   |

Two warnings from our rules: don't create a Route Handler just so your own page can `fetch` it (a Server Component can query the database directly), and don't use a Server Action to serve data to other clients (they have no form to submit).

---

# Part 2 — Route Handlers, step by step

## 2.1 The file: `route.ts`

`route.ts` is to an API what `page.tsx` is to a page. A folder with a `route.ts` becomes an **endpoint** at that URL:

```
app/api/events/route.ts                      →  /api/events
app/api/events/[slug]/route.ts               →  /api/events/some-slug
app/api/events/[slug]/calendar.ics/route.ts  →  /api/events/some-slug/calendar.ics
```

(The folder name is just text, so a folder called `calendar.ics` gives a URL ending in `.ics`. We have no `page.tsx` there: a folder can't have both a `page.tsx` and a `route.ts` for the same URL.)

Instead of a React component, a Route Handler **exports a function named after the HTTP method**. It receives a `Request` and returns a `Response`:

```ts
export async function GET(request: NextRequest) {
  return Response.json({ message: 'Hello' });
}
```

Supported names: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`. A method you don't export answers **405 Method Not Allowed** automatically.

## 2.2 The tools you use

| Tool                                | What it is                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Request` / `Response`              | The **standard web** objects (the same as in `fetch`). No Next.js magic, so what you learn works elsewhere |
| `NextRequest`                       | A `Request` with extras. The one we use: `request.nextUrl.searchParams` (the parsed query string)     |
| `Response.json(body, init)`         | Answers with JSON, and sets `Content-Type` for you. **The status goes in `init`**: `{ status: 404 }`  |
| `new Response(text, { headers })`   | Answers with anything else (plain text, a file), and you set the headers                              |
| `RouteContext<'/api/events/[slug]'>` | A **global** type that knows this route's `params`. The Route Handler twin of `PageProps`            |
| `await ctx.params`                  | The dynamic segments. A **Promise**, like in pages: always `await` it                                 |

## 2.3 They run per request

A `GET` Route Handler runs **on every request** by default (since Next.js 15). Nothing is cached unless you opt in. That's what we want for a JSON API that reads a database.

## 2.4 Walk through the smallest one

Open `app/api/events/[slug]/route.ts`. It's short and shows the whole pattern:

```ts
export async function GET(_request: NextRequest, ctx: RouteContext<'/api/events/[slug]'>) {
  const { slug } = await ctx.params;                 // 1. read the URL part

  const event = await getEventBySlug(slug);          // 2. ask the database (published events only)

  if (!event) {
    return apiError(404, 'not_found', `No published event ${slug}`);   // 3. not found: an error response
  }

  return Response.json({ data: toPublicEvent(event) });                // 4. success: the public shape
}
```

Four steps: **read input → fetch → handle "not found" → return the right shape.** Every handler you'll ever write is a variation on this.

---

# Part 3 — The events API

## 3.1 `GET /api/events`: list

Query parameters (all optional):

| Param      | Rule                                         | Default | Example               |
| ---------- | -------------------------------------------- | ------- | --------------------- |
| `q`        | text, at least 1 character                   | none    | `?q=next`             |
| `category` | a category slug                              | none    | `?category=meetup`    |
| `city`     | a city name                                  | none    | `?city=Skopje`        |
| `from`     | a date `YYYY-MM-DD`                          | none    | `?from=2027-03-01`    |
| `sort`     | `date`, `price` or `newest`                  | `date`  | `?sort=price`         |
| `page`     | a whole number ≥ 1                           | `1`     | `?page=2`             |
| `limit`    | a whole number 1 to 50 ⚠️ *currently ignored* | `20`   | `?limit=10`           |

An unknown parameter (`?foo=1`) is an **error**, not ignored (Part 5). The answer:

```json
{
  "data": [
    {
      "slug": "nextjs-conf-skopje-2027",
      "title": "Next.js Conf Skopje 2027",
      "description": "...",
      "startsAt": "2027-03-12T08:00:00.000Z",
      "endsAt": "2027-03-12T17:00:00.000Z",
      "city": "Skopje",
      "fromPriceCents": 4900,
      "coverImageUrl": "https://...",
      "venue": { "name": "Innovation Hub", "address": "Ul. Makedonija 11", "city": "Skopje" },
      "organizer": { "name": "Avenga Academy", "handle": "avenga" },
      "categories": ["conference"],
      "links": { "page": "/events/nextjs-conf-skopje-2027", "calendar": "/api/events/nextjs-conf-skopje-2027/calendar.ics" }
    }
  ],
  "page": 1,
  "total": 12,
  "pageCount": 2
}
```

`data` holds the items, and `page`, `total` and `pageCount` let a client build its own "next page" button. It reuses `searchEvents(filters)`, the **same function** as the `/events` page.

## 3.2 `GET /api/events/[slug]`: one event

`{ "data": { ...one event... } }`, or a **404** error for an unknown slug **or an unpublished event**. A draft answers exactly like a missing event: the API never confirms that an event you may not see exists.

## 3.3 `GET /api/events/[slug]/calendar.ics`: a file, not JSON

Added in class 7. The same kind of handler, but the response is a **file**, so the headers do the work:

```ts
return new Response(ics, {
  headers: {
    'Content-Type': 'text/calendar; charset=utf-8',                // what it is
    'Content-Disposition': `attachment; filename="${slug}.ics"`,   // download it, with this name
  },
});
```

`lib/ics.ts` builds the text in the iCalendar format (escaping, folding long lines, UTC dates). A calendar app can import the file, so this is a good example of something **only a Route Handler** can do. The event page links to it with a plain `<a>` (not `<Link>`: it's a download, not a page).

---

# Part 4 — Designing the response

## 4.1 Never return a database row

```ts
return Response.json(event);   // ❌ tempting, and dangerous
```

A row has internal ids and **whatever columns get added next year** (an email, a flag, a note). With `Response.json(row)`, every new column **leaks automatically**. So we pick the public fields **one by one** in `lib/to-public-event.ts`:

```ts
return { slug: event.slug, title: event.title, startsAt: event.startsAt.toISOString(), ... };
```

That's a **whitelist**: a new column stays private until someone deliberately adds it. It also **decouples** the API from the database: renaming a column only changes the mapper, and the clients (which you don't control) keep working. (This is called a **DTO**, a data transfer object.)

Look at what the mapper does besides hiding things:

| It does...                                | Because...                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `startsAt.toISOString()`                  | JSON has no Date type. ISO 8601 is understood everywhere                    |
| `fromPriceCents` (not `minPriceCents`)    | A name for what it means to a client (and still cents: the client formats it) |
| `categories` as an array of **slugs**     | A client wants `['meetup']`, not whole database objects                     |
| `venue` and `organizer` with 3 and 2 fields | No venue id or capacity, and **no organizer email**                       |
| `links`                                   | Tells clients where to go next, so they don't build URLs themselves         |

The query goes one step earlier: the organizer is loaded with only `id`, `name` and `handle` (`withDetails` in `db/queries/events.ts`), so the email never even leaves the database.

## 4.2 One envelope, one error shape

Success always has `data` at the top (room to add `meta` or `links` later without breaking anyone). **Errors always look the same**, so a client can handle them with one piece of code (`lib/api.ts`):

```json
{ "error": { "code": "not_found", "message": "No published event abc" } }
{ "error": { "code": "invalid_query", "message": "Invalid query parameters", "details": { "formErrors": [], "fieldErrors": { "sort": ["Invalid option: expected one of ..."] } } } }
```

`code` is a short, stable word that code can switch on, `message` is for the developer reading it, and `details` is optional extra (here Zod's field errors).

## 4.3 Pagination

Never return "all of them". The list is paged (`page`), with `total` and `pageCount` so a client knows where the end is. `limit` is capped at **50** in the schema, so nobody can ask for a million rows in one request. (Right now `searchEvents` still uses its own fixed page size of 6 and ignores `limit`: Known issues.)

---

# Part 5 — Validation and errors

## 5.1 Strict for APIs, forgiving for pages

You've seen the same Zod idea three times. The attitude differs on purpose:

| | The `/events` **page** (`lib/event-filters.ts`) | The `/api/events` **API** (`route.ts`) |
| --- | --- | --- |
| Bad `?sort=garbage` | Quietly becomes the default. The visitor still sees a page | **400 Bad Request** with a message |
| Unknown `?foo=1` | Ignored | **400** (`.strict()`) |
| Why | A person typing in the address bar wants a page, not an error | A **program** can't read between the lines. A silent fix hides **its** bug |

In code, the API schema has no `.catch(...)`, and the object is `.strict()`:

```ts
const Query = z.object({ sort: z.enum([...]).default('date'), page: z.coerce.number().int().min(1).default(1), ... }).strict();
```

`.default(x)` fills in a value when the param is **absent**. A **present but invalid** value still fails. That's the difference from `.catch`.

## 5.2 The flow of a request

```
GET /api/events?sort=banana
  1. Object.fromEntries(request.nextUrl.searchParams)   →  { sort: 'banana' }
  2. Query.safeParse(...)                                →  { success: false, error }
  3. return apiError(400, 'invalid_query', ..., z.flattenError(error))   →  HTTP 400 + the JSON error
  (valid input)
  3. searchEvents(filters)                               →  the rows
  4. Response.json({ data: events.map(toPublicEvent), page, total, pageCount })
```

## 5.3 The status code is half of the error

`apiError(404, ...)` should make the **HTTP status** 404. In this snapshot it doesn't: `status` is written **inside the JSON body**, and the real HTTP status stays **200**. A client sees "success" with an error hidden in the body. Run it and look:

```bash
curl -i http://localhost:3000/api/events/does-not-exist
# HTTP/1.1 200 OK        ← should be 404
# {"error":{"code":"not_found",...},"status":404}
```

The fix is one change in `lib/api.ts`: pass the status as the **second argument** of `Response.json`, not in the body (exercise 1).

---

# Part 6 — Testing an API

You don't need a front end to test an API:

| Tool                                | How                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| **The browser**                     | Open the URL. Great for `GET`. Chrome and Firefox pretty-print JSON                       |
| **`curl`** (terminal)               | `curl http://localhost:3000/api/events`. Add **`-i`** to see the **status line and headers** |
| **A client app**                    | [Bruno](https://www.usebruno.com/), [Postman](https://www.postman.com/) or the VS Code extension Thunder Client: save and replay requests |
| **DevTools → Network**              | Shows every request the browser makes, with status, headers and body                      |

Useful `curl` commands:

```bash
curl http://localhost:3000/api/events                              # the list
curl "http://localhost:3000/api/events?q=next&sort=price&page=1"   # quote the URL: & means something to the shell
curl -i http://localhost:3000/api/events/does-not-exist            # -i: show the status and headers
curl -i "http://localhost:3000/api/events?sort=banana"             # should be 400
curl -OJ http://localhost:3000/api/events/<slug>/calendar.ics      # download the file (-O save, -J use the server's file name)
```

**What to check** every time: the **status code**, the **`Content-Type`** header, and that the body contains **only** what you meant to expose.

---

# Part 7 — Security checklist for an API

A public API is a door for anyone, including people who mean harm. Before you ship an endpoint:

1. ✅ **Validate every input** (query string, body, params) with a schema. Reject unknown fields.
2. ✅ **Whitelist the output.** A mapper like `toPublicEvent`, never `Response.json(row)`.
3. ✅ **Cap the page size** (`limit` max) so one request can't read the whole table or overload the server.
4. ✅ **Don't confirm what you hide.** A draft event answers 404, not "403, it exists but you can't see it".
5. ✅ **Use the right status codes**, so clients, caches and monitoring understand what happened.
6. ✅ **Anything that changes data needs authentication and authorization** (class 7): read the session, check the role, and check **ownership**. This API is read-only and public, so it needs neither yet. A `POST /api/events` would need both, just like the Server Action.
7. ✅ **Never put secrets in a response**, and don't leak internals in errors (a stack trace, the SQL, a file path).
8. ✅ **Think about abuse.** A public endpoint can be hammered, so real APIs add **rate limiting**. Browsers also enforce **CORS** (which other websites may call your API from a browser). Neither is set up here.

---

## Known issues in this snapshot

Run `npm run check` and call the API, and you'll meet these. Fix them in this order:

| Problem                                                                      | Why / how to fix                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run db:seed` fails: `Module not found: Can't resolve '@/node_modules/@types/pg'` (`db/seed.ts`) | An auto-import picked a path inside `node_modules/@types`. Use `import { Pool } from 'pg';` (class 7's seed has it right) |
| **`apiError` sends HTTP 200** with the status inside the body (`lib/api.ts`) | Pass the status as the **second argument**: `Response.json({ error: ... }, { status })`. Check with `curl -i` |
| **`GET /api/events` never returns the 400.** `apiError(...)` has no `return` (`app/api/events/route.ts`) | A bad query continues with `parsed.data` undefined and crashes with a 500. Write `return apiError(...)` |
| **`limit` is accepted but ignored**                                          | `searchEvents` always uses `PAGE_SIZE` (6). Make the page size a parameter, or drop `limit` from the schema |
| Unused import `error` from `'console'` (`lib/api.ts`)                        | A leftover auto-import. Delete the line (ESLint reports it)                                       |
| `db/demo-users.ts` doesn't compile; `createEvent` still uses the demo organizer | The `users` table is gone since class 7. Switch the action to `requireOrganizer()` and delete the file |
| Several protection gaps from class 7 (the new-event page, the dashboard query ignoring the owner) | See the *Known issues* of the [class 07 README](../class_07_auth/README.md#known-issues-in-this-snapshot) |
| `npm run typecheck` fails in `mocks/` and `types/gatherly-event.ts`          | Unused leftovers importing types that no longer exist. Delete them                                |
| Two files for the home page: `app/page.tsx` and an empty `app/(marketing)/page.tsx` | Move the hero into `(marketing)/page.tsx` and delete `app/page.tsx`                         |

---

## 🏋️ Try it yourself

1. **Fix the status code.** Change `apiError` so the HTTP status is real. Check with `curl -i` that `/api/events/does-not-exist` gives `404 Not Found`. What did the client see before?
2. **Fix the missing `return`.** Call `/api/events?sort=banana` before and after the fix. What status and body do you get each time?
3. **Make `limit` work.** Let `searchEvents` take a page size (default 6). Does `/api/events?limit=3` return 3? Does `pageCount` still add up?
4. **Read the JSON like a client.** Call `/api/events` and list every field you get. Which fields of the database row are **not** there? Open `toPublicEvent` and explain why each one is missing.
5. **Add a field.** Add `capacity` (from the venue) to the public event. What did you have to change, and what **didn't** you have to touch?
6. **Break it on purpose.** Call `/api/events?foo=1`, `?page=0`, `?page=abc`, `?limit=1000`. For each: what do you expect, and what do you get? Which Zod rule decides?
7. **Download the calendar.** Fetch the `.ics` with `curl -i` and read the headers. Then open the file in your calendar app. What happens if you remove the `Content-Disposition` header?
8. **Write a new endpoint.** `GET /api/categories` that returns `{ data: [{ name, slug }] }`. Use a whitelist mapper, and a real status code for errors.
9. **Think.** Where would you put the `getCurrentUser()` check to make `POST /api/events` safe? What would it return to a visitor, and what to an attendee? (Hint: 401 and 403.)
10. **Compare.** The same list exists as a page (`/events`) and as an API (`/api/events`). What do they share, and what is different? Why is it good that both call `searchEvents`?

---

## 🔗 Useful links

**Route Handlers**

- [`route.js` reference](https://nextjs.org/docs/app/api-reference/file-conventions/route) — methods, `RouteContext`, caching, cookies and headers
- [Next.js: Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) and [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [`NextRequest`](https://nextjs.org/docs/app/api-reference/functions/next-request) and [`NextResponse`](https://nextjs.org/docs/app/api-reference/functions/next-response)
- MDN: [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) and [`Response.json()`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json_static)

**HTTP and API design**

- MDN: [HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview), [request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods), [status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) and [`Content-Disposition`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)
- [JSON](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON) (MDN) and [ISO 8601 dates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- [REST API design: the basics](https://restfulapi.net/) and [CORS explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (MDN)
- [iCalendar (RFC 5545)](https://datatracker.ietf.org/doc/html/rfc5545), the format behind the `.ics` file

**Validation and security**

- [Zod: `.strict()`, `.default()` and `.catch()`](https://zod.dev/api) and [error formatting](https://zod.dev/error-formatting)
- OWASP: [REST security cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) and [API security top 10](https://owasp.org/API-Security/)

**Tools**

- [Bruno](https://www.usebruno.com/) and [Postman](https://www.postman.com/) (API clients), and the [`curl` manual](https://curl.se/docs/manpage.html)

**Previous classes**

- [Class 07 README](../class_07_auth/README.md): authentication, ticket reservation, error pages and the `.ics` route
- [Class 06 README](../class_06_forms/README.md): Server Actions and their security checklist
- [Class 04 README](../class_04_routing/README.md): the queries layer and `searchEvents`
