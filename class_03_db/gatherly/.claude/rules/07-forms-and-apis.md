---
paths:
  - "app/**"
  - "lib/**"
  - "components/**"
---

<!-- Generated from tools/agent-rules in the course repo. Edit the source, not this file. -->

# Forms, validation and API rules

## Server Actions

- Mutations are **Server Actions** in `"use server"` files under `app/actions/`. Every export of such a file must be an async function.
- Never put `"use server"` at the top of a component file.
- Only **actions** go in a `"use server"` file. Every export there is a public endpoint — a read like `getMessages()` belongs in a normal `server-only` module.
- The order inside an action is always: **authenticate → validate → authorize (ownership) → mutate → revalidate → return or redirect**.
- An action used with `useActionState` has the signature `(prevState, formData)`. Name an unused first argument `_prev`.
- Forms use `<form action={serverAction}>` so they work **without JavaScript**. Don't replace them with `onSubmit` + `fetch`.
- `useActionState` comes from `react` (not `useFormState` from `react-dom`). `useFormStatus` comes from `react-dom` and must be used in a component **inside** the `<form>`.
- After a mutation: `updateTag(tag)` when the user must see their own change immediately; `revalidateTag(tag, "max")` otherwise. Tags only work once data is cached with `cacheTag` (class 07) — before that, use `revalidatePath` for prerendered pages. `refresh()` only re-renders for the user who acted; it doesn't update a prerendered page for anyone else.

## Validation with Zod 4

- Validate every Server Action and Route Handler input with Zod, using `safeParse`.
- Use the Zod 4 API:

  | Zod 3 (wrong)        | Zod 4 (use this)                         |
  | -------------------- | ---------------------------------------- |
  | `{ message: "..." }` | `{ error: "..." }`                       |
  | `z.string().email()` | `z.email()` (also `z.url()`, `z.uuid()`) |
  | `error.flatten()`    | `z.flattenError(error)`                  |
  | `error.format()`     | `z.treeifyError(error)`                  |

- Return field errors to the form: `return { errors: z.flattenError(parsed.error).fieldErrors };`
- React resets a form after its action runs. On an error, return the submitted `values` and use them as `defaultValue`. Give a `<select>` a `key` on its value — it otherwise restores the option it mounted with.
- Repeated fields (checkboxes with one `name`) need `formData.getAll(name)`: `Object.fromEntries(formData)` keeps only the last value.
- Bound arguments (`action.bind(null, id)`) come from the client too — validate them, and put ownership in the `WHERE` of the update.

## Route Handlers

- Use a Route Handler (`app/api/**/route.ts`) only when a Server Action can't do the job: webhooks, clients that aren't this app's forms (a scanner, a public API), and file downloads (`.ics`, CSV).
- Never create a Route Handler just so a Server Component can fetch from it — query the database directly.
- Webhooks read the body with `request.text()` and verify the signature over those raw bytes **before** parsing (`lib/webhooks.ts`, `timingSafeEqual`). Then take only the id from the payload and read everything else from our database.
- Make webhook handling idempotent in one statement: `UPDATE … WHERE status = 'pending' RETURNING` — never check-then-update. A repeat delivery answers 200 and changes nothing.
- Every API error uses `apiError(status, code, message, details?)` from `lib/api.ts` — one shape, `{ error: { code, message, details } }`.
- Public API input is validated strictly (`.strict()`, 400 with `z.flattenError`) — unlike pages, which forgive with `.catch()`. Responses are shaped field by field (`toPublicEvent`); never `Response.json(row)`.
- Machine clients (the scanner) authenticate with `Authorization: Bearer …` via `organizerFromApiToken`; store only token hashes. Status codes mean things: 401 unknown caller, 403 known but not allowed, 404, 409 conflict, 422 valid-but-refused, 201 created.
- Work that mustn't delay the response (emails) goes in `after()` from `next/server`.
- File downloads (`.ics`, CSV) are Route Handlers with `Content-Type` and `Content-Disposition`; link to them with a plain `<a href>`, not `<Link>`.
