/**
 * default.tsx — the FALLBACK when Next.js can't tell what to show here.
 *
 * Parallel routes (the `@slots`) are matched against the URL like normal routes. On a client-side
 * navigation, Next.js remembers what each slot was showing. But on a HARD navigation (a full page
 * load: refresh, a typed address, a shared link) it only knows the URL, and if a slot (or `children`)
 * has no page for that URL, it has nothing to render and answers 404.
 *
 * `default.tsx` is the answer for "no match": here it renders nothing. This one covers `children` of
 * the overview layout. Every `@slot` folder needs its own, for the same reason.
 *
 * Rule: every `@slot` gets a `default.tsx`. (The build fails without one when the layout has
 * other routes.)
 */
export default function Default() {
  return null;
}
