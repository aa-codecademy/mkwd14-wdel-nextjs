/**
 * ROUTE: /events   — the list of events, with SEARCH
 *
 * The URL is the single source of truth for the search:
 *
 *   /events              -> all published events
 *   /events?q=next       -> events whose title contains "next"
 *
 * The flow, step by step:
 *   1. The user types in <SearchBox /> (a Client Component). After a short pause it puts the
 *      text into the URL: ?q=next.
 *   2. Changing the URL makes Next.js render THIS page again on the server, now with
 *      searchParams = { q: 'next' }.
 *   3. parseEventFilters() validates and cleans the raw search params (lib/event-filters.ts).
 *   4. <EventResults /> asks the database for the matching events and renders the grid.
 *
 * Why keep the search in the URL instead of in React state? The page can be shared and
 * bookmarked, the Back button works, a refresh keeps the results, and the SERVER can read the
 * value, so it fetches only the matching rows.
 *
 * This page uses `searchParams`, so it's rendered per request (dynamic), not once at build time.
 * It's a Server Component; only <SearchBox /> runs in the browser.
 */
// Relative imports. `@/components/event-results` would point to the same file —
// see the "@/*" alias note in components/event-grid.tsx.
import { EventResults } from '../../components/event-results';
import { SearchBox } from '../../components/search-box';
import { parseEventFilters } from '../../lib/event-filters';

// `searchParams` is a Promise (like `params`), so the component is async and awaits it.
// Its raw type is { [key]: string | string[] | undefined }: the same key can appear many times
// (?q=a&q=b), and the user can type anything in the address bar.
export default async function EventsPage({ searchParams }: PageProps<'/events'>) {
  // Never trust the URL: parse it into a clean object ({ q?: string }).
  const filters = parseEventFilters(await searchParams);

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-900">Upcoming events</h1>
      {/*
       * `text-muted-foreground` (softer grey text) is a shadcn/ui colour token.
       * It works now because `shadcn init` added `--color-muted-foreground` to
       * app/globals.css. Before shadcn it silently did nothing.
       */}
      <p className="mt-1 mb-8 text-muted-foreground">Everything happening on Gatherly.</p>

      <div className="mb-8 space-y-4">
        {/* Client Component: needs the browser (typing, router). Everything else here stays on the server. */}
        <SearchBox />
      </div>

      {/* Server Component that queries the database. We pass the CLEAN filters, not the raw URL. */}
      <EventResults filters={filters} />
    </div>
  );
}
