/**
 * ROUTE: /events   — the list of all events
 *
 * The page stays small: a heading, plus <EventGrid />, which does the work.
 * Splitting UI into small components keeps pages readable, and the pieces can
 * be reused (e.g. the same grid on a "featured events" section later).
 *
 * Everything here is a Server Component, so the events are rendered to HTML on
 * the server, and no event data or rendering code ships to the browser as JS.
 */
// A relative import. `@/components/event-grid` would point to the same file —
// see the "@/*" alias note in components/event-grid.tsx.
import { EventResults } from '../../components/event-results';
import { SearchBox } from '../../components/search-box';
import { parseEventFilters } from '../../lib/event-filters';

export default async function EventsPage({ searchParams }: PageProps<'/events'>) {
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
        <SearchBox />
      </div>

      <EventResults filters={filters} />
    </div>
  );
}
