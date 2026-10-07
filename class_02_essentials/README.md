# Class 02 — Next.js Essentials

Where does my code run? This class covers the **Server and Client Component** model, **streaming** slow content with `<Suspense>`, handling **errors and 404s** with special files, and the first real Gatherly screens: a shared layout with header and footer, design tokens, typed mock data, and an events grid with optimised remote images — styled with **shadcn/ui** components (Card, Badge, Button).

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
| shadcn/ui components         | `components/ui/`, `components.json`, `lib/utils.ts` | Ready-made, accessible Card / Badge / Button that we own as source code. See [section 6](#6-shadcnui--installing-and-using-it-step-by-step) |
| Formatting helpers           | `lib/format.ts`                           | Dates and prices turned into readable text with `Intl`, in one place                  |
| A small Client Component     | `components/favourite-button.tsx`         | Heart toggle with `useState`. Only this leaf is `'use client'`                        |
| Remote images                | `next.config.ts` → `images.remotePatterns` | `next/image` only optimises images from hosts you allow                              |
| Stricter tooling             | `eslint.config.mjs`, `tsconfig.json`, `.prettierrc.json` | Type-only imports, `===`, no stray `console.log`, `noUncheckedIndexedAccess` |
| AI assistant rules           | `.claude/`, `.cursor/`, `.github/`        | Tell AI tools which versions and conventions this project uses                        |

**Components folder convention:** shared UI lives in `components/` at the project root, outside `app/`. Files outside `app/` can never become routes. Import them with a relative path or with the `@/` alias (`@/components/header`).


### 6. shadcn/ui — installing and using it, step by step

**What it is.** shadcn/ui is *not* a package like Material UI. It's a **CLI that copies component source code into your project** (`components/ui/button.tsx`, ...). After that the code is yours: read it, change the styles, add a variant. The components are built from:

| Piece                                         | Role                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Tailwind CSS**                              | The looks (classes)                                                                  |
| **[Base UI](https://base-ui.com/)** (or Radix UI) | The behaviour: accessibility, focus, keyboard support. We chose **Base UI**       |
| **class-variance-authority (`cva`)**          | Maps props like `variant="outline"` to class names                                   |
| **[lucide-react](https://lucide.dev/)**       | The icons                                                                            |

> Our `components.json` says `"style": "base-nova"` — that's the **Nova** preset on **Base UI**, with `lucide` icons and the `neutral` base colour.

#### Before you start

- [ ] A Next.js project with the **App Router** (we have one: `app/`).
- [ ] **Tailwind CSS v4** — your `app/globals.css` starts with `@import 'tailwindcss';` and there is **no** `tailwind.config.js`. (This guide assumes v4, which is what `create-next-app` installs today.)
- [ ] The `@/*` import alias in `tsconfig.json`: `"paths": { "@/*": ["./*"] }`. `create-next-app` adds it for you.
- [ ] You're in the **project root** (the folder with `package.json`) and your work is **committed**, so `git diff` shows exactly what the CLI changed.

#### Step 0 (only for a brand-new project)

```bash
npx create-next-app@latest my-app
cd my-app
```

Choose the recommended defaults (TypeScript, ESLint, Tailwind, App Router).

#### Step 1 — initialise shadcn/ui

```bash
npx shadcn@latest init
```

The CLI asks a few questions (which component library — **Base** or Radix — and which preset/theme, plus the base colour). Pick **Base** and the default **Nova** preset to get exactly what Gatherly uses. The questions can change between CLI versions, so read them calmly.

Want no questions? This uses the defaults (Next.js template + the `base-nova` preset, which is our setup):

```bash
npx shadcn@latest init -d
```

Useful flags: `-b, --base <base|radix|aria>` (component library), `-p, --preset <name>`, `-d, --defaults`, `-f, --force` (overwrite an existing setup). List them all with `npx shadcn@latest init --help`.

**What `init` changes** — run `git diff` and `git status` and find each of these:

| File                    | What happened                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `components.json`       | **New.** shadcn's config: style, icon library, the path aliases (`@/components`, `@/components/ui`, `@/lib/utils`) and where your CSS lives |
| `lib/utils.ts`          | **New.** The `cn()` helper that joins class names and resolves Tailwind conflicts                          |
| `app/globals.css`       | **Modified.** Imports `tw-animate-css` and `shadcn/tailwind.css`, and adds the theme variables (`--background`, `--primary`, `--muted-foreground`, ...) for light and `.dark` mode |
| `app/layout.tsx`        | **Modified.** Adds the Geist font (`--font-sans`) and uses `cn()` on `<html>`                              |
| `package.json`          | **Modified.** New dependencies: `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css`, `shadcn` |

#### Step 2 — add components

```bash
npx shadcn@latest add button card badge
```

This creates `components/ui/button.tsx`, `card.tsx` and `badge.tsx`. Add more any time (`add input`, `add dialog`, ...). Run `npx shadcn@latest add` without names to pick from a list. If a file already exists, the CLI asks before overwriting it.

Browse all components: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

#### Step 3 — use them

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next.js Conf Skopje</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm">Get ticket</Button>
      </CardContent>
    </Card>
  );
}
```

See the real thing in `components/event-card.tsx`. Notes:

- `variant` and `size` are defined in `components/ui/button.tsx`. Open it and read `buttonVariants`.
- `className` is **merged** with the defaults by `cn()`, so `<Card className="pt-0">` overrides the Card's top padding.
- These components have no state, so they're **Server Components**. A component that needs state or clicks (like our `FavouriteButton`) adds `'use client'` itself.

#### Step 4 — theming

All colours come from CSS variables in `app/globals.css`:

```css
:root {
  --primary: oklch(0.205 0 0);        /* light mode */
}
.dark {
  --primary: oklch(0.922 0 0);        /* dark mode, applies inside an element with class="dark" */
}
```

Change a value and every component that uses `bg-primary` changes with it. Our own **brand** colours (`brand-500`, ...) live in a separate `@theme` block, so they don't clash with shadcn's.

#### Common problems

| Problem                                                          | Fix                                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A tutorial uses `<Button asChild>` and it does nothing           | That's the **Radix** version. **Base UI** uses a `render` prop instead: `<Button render={<a href="/" />}>` |
| `Module not found: Can't resolve '@/components/ui/button'`       | The component wasn't added yet (`npx shadcn@latest add button`), or the `@/*` alias is missing in `tsconfig.json` |
| `init` complains about Tailwind or the CSS file                  | Check that `app/globals.css` exists and starts with `@import 'tailwindcss';`. On an old Tailwind v3 project, follow shadcn's [Tailwind v3 guide](https://ui.shadcn.com/docs/tailwind-v3) or upgrade to v4 |
| `npm run format:check` complains about `components/ui/*`         | The generated files use double quotes and no semicolons. Run `npx prettier --write components/ui lib` once |
| `npm run lint` fails with "`inter` is assigned a value but never used" | A leftover in `app/layout.tsx` (we use Geist now). Remove the unused `Inter` font, see the comment in that file |
| I want to start over                                             | `git restore .` and delete the untracked files, or re-run `init` with `-f`                           |

**Links:** [Installation: Next.js](https://ui.shadcn.com/docs/installation/next) · [CLI reference](https://ui.shadcn.com/docs/cli) · [Components](https://ui.shadcn.com/docs/components) · [Theming](https://ui.shadcn.com/docs/theming) · [`components.json`](https://ui.shadcn.com/docs/components-json) · [Base UI docs](https://base-ui.com/react/overview/quick-start) · [CVA docs](https://cva.style/docs) · [Lucide icons](https://lucide.dev/icons/)

---

## 🏋️ Try it yourself

1. Add `app/events/loading.tsx` to Gatherly, with a skeleton grid. To see it, temporarily add `await connection()` and a 2 s `sleep` to the events page.
2. Add `app/not-found.tsx` to Gatherly so unknown URLs show a branded 404 with a link back to `/events`.
3. Add `app/events/error.tsx` with a **Try again** button that calls `retry()`.
4. Add a shadcn component (`npx shadcn@latest add skeleton`) and use it in the `loading.tsx` from exercise 1. Run `git status` to see which files the CLI created.
5. Hide draft events: filter `events` by `status === 'published'` in `EventGrid`.
6. Move the `console.log` in `ClientLog` out of `useEffect` into the function body. Where does it show up now, and why?
7. Open `components/ui/button.tsx` and add a new `variant` (say `brand`, using `bg-brand-500 text-white`). Use it on the home page's "Browse events" link with `buttonVariants({ variant: 'brand' })`.

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

**shadcn/ui**

- [Installation: Next.js](https://ui.shadcn.com/docs/installation/next), [CLI](https://ui.shadcn.com/docs/cli), [components](https://ui.shadcn.com/docs/components) and [theming](https://ui.shadcn.com/docs/theming)
- [Base UI](https://base-ui.com/) (the accessible primitives we chose) and [Lucide icons](https://lucide.dev/)
- [class-variance-authority](https://cva.style/docs)

**Tailwind CSS v4**

- [Theme variables (`@theme`)](https://tailwindcss.com/docs/theme) and [colors / OKLCH](https://tailwindcss.com/docs/colors)
- [Responsive design](https://tailwindcss.com/docs/responsive-design) and [grid columns](https://tailwindcss.com/docs/grid-template-columns)

**Formatting data for humans**

- [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) (prices) and [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) (dates)
