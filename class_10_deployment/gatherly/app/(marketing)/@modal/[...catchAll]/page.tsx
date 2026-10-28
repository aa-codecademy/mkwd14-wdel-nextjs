/**
 * @modal/[...catchAll] — the page that CLOSES the modal when you navigate somewhere else.
 *
 * This one is easy to miss and easy to get wrong. On a client-side navigation a parallel slot KEEPS
 * what it was showing if the new URL has no match for it. So after opening the tickets modal and
 * clicking a link to /about, the modal would stay open on top of /about!
 *
 * `[...catchAll]` is a catch-all segment: it matches EVERY other URL in this slot, and renders
 * `null`. So any navigation away from the intercepted route clears the slot, and the modal closes.
 * (The rule of thumb: a modal slot needs three files: default.tsx, this catch-all, and the intercepting route.)
 */
export default function CatchAll() {
  return null;
}
