# Class 02 — Next.js Essentials

Where does my code run? This class covers the **Server and Client Component** model, **streaming** slow content with `<Suspense>`, handling **errors and 404s** with special files, and the first real Gatherly screens: a shared layout with header and footer, design tokens, typed mock data, and an events grid with optimised remote images.

## 📁 What's in this folder

| Folder                    | What it is                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| [`examples/`](./examples) | Playground routes, one concept each. Every file has comments explaining what happens and why.      |
| [`gatherly/`](./gatherly) | The course app at the end of class 2. Start class 3 from here if you fell behind.                  |

```bash
cd class_02_essentials/examples   # or class_02_essentials/gatherly
npm install
npm run dev
```

---

## 🧩 Concepts covered

### 1. Server vs Client Components — `examples/app/where-does-this-run/`

|                              | Server Component (default)              | Client Component (`'use client'`)             |
| ---------------------------- | --------------------------------------- | --------------------------------------------- |
| Renders on the server?       | ✅ always                                | ✅ for the first HTML                          |
| Runs in the browser?         | ❌ never                                 | ✅ hydrated, then re-renders there             |
| JS sent to the browser?      | ❌ none                                  | ✅ the component and everything it imports     |
| `async` / `await` data       | ✅                                       | ❌                                             |
| `useState`, `useEffect`, `onClick` | ❌                                 | ✅                                             |
| Secrets, DB, file system     | ✅ safe                                  | ❌ never, because the code is public           |

Open [/where-does-this-run](http://localhost:3000/where-does-this-run) and compare the **terminal** with the **browser console**. Each log shows up in only one of them.

**Rule of thumb:** keep pages and layouts as Server Components. Add `'use client'` only to the small interactive leaves (a button, a form, a dropdown).

### 2. `connection()` — forcing dynamic rendering

Pages that use nothing request-specific are **prerendered at build time**. `await connection()` (from `next/server`) tells Next.js to wait for a real request, which makes the page dynamic (`ƒ` in the build output). We use it so the server log and the streaming delay happen **on each visit**, not once during `npm run build`.

### 3. Streaming with `<Suspense>` — `examples/app/streaming/`

An `async` Server Component that awaits something slow blocks the whole page, unless it's wrapped in `<Suspense fallback={...}>`. Then Next.js sends the page immediately with the fallback, and **streams** the real content into place when it's ready.

- [/streaming](http://localhost:3000/streaming): the heading appears at once, and the blue box appears after 5 s.
- Uncomment the `<Slow>` outside Suspense: the whole page now waits.
- `loading.tsx` in a route folder = automatic `<Suspense>` around that page.

### 4. Errors and 404s — `examples/app/error-examples/`

| File / function   | When it's used                                                                   | Notes                                                    |
| ----------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `error.tsx`       | A component in this folder (or below) **throws while rendering**                 | Must be `'use client'`. Gets `error` and `retry()`       |
| `not-found.tsx`   | `notFound()` is called in this folder (or below)                                 | Returns HTTP **404**. The closest one wins               |
| `notFound()`      | Call it when the requested thing doesn't exist (e.g. unknown id)                 | From `next/navigation`. Throws, so code after it never runs |
| `global-error.tsx`| An error in the **root layout**                                                  | Not in this example. Replaces the whole page             |

Try: the **Throw unhandled** button on [/error-examples](http://localhost:3000/error-examples), then [/error-examples/missing](http://localhost:3000/error-examples/missing), [/error-examples/123](http://localhost:3000/error-examples/123) and [/error-examples/42](http://localhost:3000/error-examples/42).

> ⚠️ Error boundaries only catch errors thrown **during rendering**, not errors inside `onClick` handlers. That's why `ThrowButton` sets state on click and throws on the next render.

### 5. Gatherly — what we built

| What                         | Where                                     | Why                                                                                   |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Shared header + footer       | `app/layout.tsx`, `components/`           | Written once, shown on every page, and kept mounted during navigation                 |
| Brand design tokens          | `app/globals.css` (`@theme`)              | `bg-brand-500`, `rounded-card`, … — one place to change the look                      |
| Inter font                   | `app/layout.tsx` (`next/font`)            | Self-hosted, no layout shift, mapped to `font-sans`                                   |
| Landing page + `/events`     | `app/page.tsx`, `app/events/page.tsx`     | Pages stay thin, and components do the work                                           |
| Domain types                 | `types/`                                  | `GatherlyEvent`, `Venue`, `Category`, … — TypeScript checks every field               |
| Mock data                    | `mocks/mock-events.ts`                    | Build the UI before the database exists. Swapped for PostgreSQL in class 03           |
| Event grid + cards           | `components/event-grid.tsx`, `event-card.tsx` | Rendering lists with `.map()` and `key`, responsive grid                         |
| Remote images                | `next.config.ts` → `images.remotePatterns` | `next/image` only optimises images from hosts you allow                              |
| Stricter tooling             | `eslint.config.mjs`, `tsconfig.json`, `.prettierrc.json` | Type-only imports, `===`, no stray `console.log`, `noUncheckedIndexedAccess` |
| AI assistant rules           | `.claude/`, `.cursor/`, `.github/`        | Tell AI tools which versions and conventions this project uses                        |

**Components folder convention:** shared UI lives in `components/` at the project root, outside `app/`. Files outside `app/` can never become routes. Import them with a relative path or with the `@/` alias (`@/components/header`).

---

## 🏋️ Try it yourself

1. Add `app/events/loading.tsx` to Gatherly, with a skeleton grid. To see it, temporarily add `await connection()` and a 2 s `sleep` to the events page.
2. Add `app/not-found.tsx` to Gatherly so unknown URLs show a branded 404 with a link back to `/events`.
3. Add `app/events/error.tsx` with a **Try again** button that calls `retry()`.
4. In `EventCard`: format the price (`minPriceCents / 100` with `Intl.NumberFormat`), format the date with `toLocaleDateString`, and change the title `<h1>` to an `<h3>`.
5. Hide draft events: filter `events` by `status === 'published'` in `EventGrid`.
6. Move the `console.log` in `ClientLog` out of `useEffect` into the function body. Where does it show up now, and why?

---

## 🔗 Useful links

**Next.js**

- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Server and client boundary](https://nextjs.org/docs/app/guides/server-and-client-boundary) — what can cross it (props must be serialisable)
- [Streaming](https://nextjs.org/docs/app/guides/streaming) and [`loading.js`](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [`connection()`](https://nextjs.org/docs/app/api-reference/functions/connection)
- [Error handling](https://nextjs.org/docs/app/getting-started/error-handling), [`error.js`](https://nextjs.org/docs/app/api-reference/file-conventions/error), [`not-found.js`](https://nextjs.org/docs/app/api-reference/file-conventions/not-found), [`notFound()`](https://nextjs.org/docs/app/api-reference/functions/not-found)
- [Images](https://nextjs.org/docs/app/getting-started/images) and [`<Image>` `remotePatterns`](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Fonts](https://nextjs.org/docs/app/getting-started/fonts)
- [Metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Project structure](https://nextjs.org/docs/app/getting-started/project-structure) — colocation, `components/`, the `@/` alias

**React**

- [`<Suspense>`](https://react.dev/reference/react/Suspense)
- [`'use client'`](https://react.dev/reference/rsc/use-client) and [Server Components](https://react.dev/reference/rsc/server-components)
- [Rendering lists and keys](https://react.dev/learn/rendering-lists)
- [Synchronizing with effects (`useEffect`)](https://react.dev/learn/synchronizing-with-effects)
- [Error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Passing props to a component](https://react.dev/learn/passing-props-to-a-component)

**TypeScript**

- [Object types](https://www.typescriptlang.org/docs/handbook/2/objects.html) and [union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)
- [The `satisfies` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
- [`import type`](https://www.typescriptlang.org/docs/handbook/modules/reference.html#type-only-imports-and-exports)
- [`noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess)

**Tailwind CSS v4**

- [Theme variables (`@theme`)](https://tailwindcss.com/docs/theme) and [colors / OKLCH](https://tailwindcss.com/docs/colors)
- [Responsive design](https://tailwindcss.com/docs/responsive-design) and [grid columns](https://tailwindcss.com/docs/grid-template-columns)

**Formatting data for humans**

- [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) (prices) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) (dates)
