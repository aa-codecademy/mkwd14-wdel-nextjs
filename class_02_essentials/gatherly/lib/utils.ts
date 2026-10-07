/**
 * `cn()` — the small helper every shadcn/ui component uses to build `className`.
 *
 * It does two jobs:
 *   1. joins class names and ignores falsy values, so conditions are easy:
 *        cn('px-2', isActive && 'bg-brand-500')   // 'px-2' or 'px-2 bg-brand-500'
 *   2. resolves Tailwind CONFLICTS: the last class wins.
 *        cn('px-2', 'px-4')                       // 'px-4' (not both)
 *      That's what lets us pass `className="pt-0"` to <Card> and override its
 *      default padding instead of fighting it.
 *
 * `shadcn init` created this file (see the "utils" alias in components.json).
 * In most tutorials it is written with the `clsx` + `tailwind-merge` packages.
 * Our version re-exports `cn` from the `cn` package, a small drop-in
 * replacement made by the shadcn team. You use it the same way.
 */
export { cn } from "cn"
