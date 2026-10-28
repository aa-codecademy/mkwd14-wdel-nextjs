---
name: "Styling with Tailwind CSS 4 and shadcn/ui"
description: "CSS-first Tailwind 4, design tokens in @theme, v3-to-v4 renames, and shadcn/ui usage"
applyTo: "**/*.tsx,**/*.css"
---

<!-- Generated from tools/agent-rules in the course repo. Edit the source, not this file. -->

# Styling rules — Tailwind CSS 4 and shadcn/ui

## Tailwind 4 is CSS-first

- There is **no `tailwind.config.js` / `tailwind.config.ts`**. Never create one.
- `app/globals.css` starts with `@import "tailwindcss";` — not `@tailwind base; @tailwind components; @tailwind utilities;`.
- Design tokens live in `@theme` in `app/globals.css`. Defining `--color-brand-500` creates `bg-brand-500`, `text-brand-500`, etc.
- Tokens whose value is another CSS variable (e.g. fonts from `next/font`) go in `@theme inline`.
- Dark mode is `@custom-variant dark (...)` in CSS, not `darkMode: "class"`.
- Use the existing tokens (`brand-50`, `brand-500`, `brand-900`, `rounded-card`, ...) before reaching for arbitrary values like `bg-[#3b82f6]`. Add a new token to `@theme` if a value repeats.

## v3 habits that are wrong in v4

| v3                           | v4                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `shadow-sm`, `shadow`        | `shadow-xs`, `shadow-sm` (the scale shifted; same for `rounded-*`, `blur-*`) |
| `ring` (3px)                 | `ring-3` — plain `ring` is now 1px                                           |
| `border` (gray by default)   | `border border-gray-200` — the default border colour is now `currentColor`   |
| `bg-opacity-50`              | `bg-black/50`                                                                |
| `flex-shrink-0`, `flex-grow` | `shrink-0`, `grow`                                                           |
| `bg-[--brand]`               | `bg-(--brand)`                                                               |
| `first:*:pt-0`               | `*:first:pt-0` (variants apply left to right)                                |

## shadcn/ui

- Add components with `npx shadcn@latest add <name>`. They land in `components/ui/` — prefer composing them over editing them.
- This project's shadcn components are built on **Base UI** (`@base-ui/react`), not Radix. To render a component as another element, use the `render` prop — `<DialogTrigger render={<Button />}>` — **not** Radix's `asChild`.
- A link that should look like a button stays a link: `<Link href="/events" className={buttonVariants()}>`. Don't render `<a>` through `<Button render>` — Base UI's docs say links must keep link semantics.
- Merge class names with `cn()` from `@/lib/utils` (it re-exports the `cn` package; there is no `clsx` + `tailwind-merge` setup to write).
- shadcn's colour tokens (`bg-background`, `text-muted-foreground`, `border-border`, ...) are defined in `app/globals.css` — use them for neutral UI, and the `brand-*` tokens for Gatherly's own colour.
- Don't install a second component library.

## General

- Class order is Prettier's job — don't reorder by hand.
- Use semantic HTML (`<header>`, `<nav>`, `<main>`, `<button>`) and give images meaningful `alt` text.
- Text must meet WCAG AA contrast (4.5:1; 3:1 for large text). Check new colour tokens by calculation, don't eyeball them — `brand-500` failed at 3.64:1 until class 10.
- Don't put a Client Component that imports a client library (e.g. the auth client) into a layout or the header: every page downloads it. Prefer a Server Action in a `<form>`.
