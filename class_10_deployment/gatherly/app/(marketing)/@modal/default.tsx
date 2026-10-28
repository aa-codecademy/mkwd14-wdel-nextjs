/**
 * @modal/default.tsx — "no modal": what the `@modal` slot renders when nothing matches.
 *
 * `@modal` is a PARALLEL ROUTE slot of the (marketing) layout (the layout renders it as `{modal}`).
 * Most of the time no modal should be open, so the default is `null`: an empty slot. It's also what
 * Next.js shows on a page refresh, because a hard navigation can't remember what a slot was showing.
 */
export default function Default() {
  return null;
}
