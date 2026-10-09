/**
 * SearchBox — a text input that keeps its value in the URL (?q=...).
 *
 * A CLIENT component, because it needs the browser: typing events and the router.
 * It does not fetch anything itself. It only updates the URL. Next.js then re-renders the
 * server page (app/events/page.tsx) with the new search params, and the new results stream
 * back. No fetch(), no useEffect, no loading state to write by hand.
 *
 * The hooks (all from 'next/navigation'):
 *   useRouter()       -> `router.replace(url)` changes the URL without a full page reload
 *   usePathname()     -> the current path, e.g. "/events" (no query string)
 *   useSearchParams() -> a read-only view of the current ?query=string
 */
'use client';

// `use-debounce` (an npm package): delays a function until the user stops typing.
import { useDebouncedCallback } from 'use-debounce';
import { Input } from './ui/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // DEBOUNCE: without it, every keystroke would change the URL and run a database query
  // (typing "next" = 4 queries). With a 500 ms debounce the function runs only after the user
  // pauses typing for half a second, so we send 1 query.
  const onChange = useDebouncedCallback((value: string) => {
    // Start from a COPY of the current params, so any other params (filters we add later)
    // are kept. URLSearchParams is the built-in browser class for query strings.
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set('q', value.trim());
    } else {
      next.delete('q');
    }

    // toString() also URL-encodes the text for us ("rock & roll" -> "rock+%26+roll").
    const query = next.toString();

    // `replace` (not `push`): typing doesn't add a history entry per search, so the Back
    // button leaves the page instead of stepping through every search term.
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, 500);

  return (
    <Input
      placeholder="Search events..."
      type="search"
      name="q"
      // `defaultValue` (not `value`): the input is UNCONTROLLED. The browser owns the text while
      // the user types; we only set the starting value, so a reload or a shared link shows the
      // current search in the box.
      defaultValue={searchParams.get('q') ?? ''}
      // There's no visible <label>, so the aria-label gives screen readers a name for the field.
      aria-label="Search events"
      className="h-10"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
