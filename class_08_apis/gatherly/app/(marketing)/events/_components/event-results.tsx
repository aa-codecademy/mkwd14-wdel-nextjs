/**
 * EventResults — fetches ONE PAGE of events for the current filters and renders it.
 *
 * An ASYNC SERVER COMPONENT: it `await`s the database query directly in the component. No
 * useEffect, no loading state, no API route. Separating "fetch" (this component) from
 * "display" (<EventGrid />) lets the page wrap THIS component in <Suspense>, to stream the
 * results while the rest of the page is already visible.
 *
 * It also decides what to show in the three possible situations:
 *   1. results exist for this page       -> the count, the grid and the pagination
 *   2. the page is past the end          -> "only N pages", with a link to the last page
 *   3. nothing matches the filters       -> "No events match", with a link to clear them
 * A good list page always handles the empty cases, not only the happy one.
 */
import Link from 'next/link';
import { searchEvents } from '../../../../db/queries/events';
import { eventsHref, type EventFilters } from '../../../../lib/event-filters';
import { EventGrid } from '../../../../components/event-grid';
// A sibling file in the same private folder.
import { Pagination } from './pagination';

export async function EventResults({ filters }: { filters: EventFilters }) {
  // `total` = how many events match ALL filters; `events` = only the current page (see the query).
  const { events, pageCount, total } = await searchEvents(filters);

  // Case 2: events exist, but not on this page, e.g. someone edited the URL to ?page=99, or
  // searched while on page 3. `total > 0` is what tells this case apart from "no results".
  if (events.length === 0 && total > 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-10 text-center">
        <p className="font-medium">
          There are only {pageCount} {pageCount === 1 ? 'page' : 'pages'} of results.
        </p>
        <Link
          className="mt-2 inline-block text-brand-500 hover:underline"
          href={eventsHref(filters, { page: pageCount })}
        >
          Go to last page
        </Link>
      </div>
    );
  }

  // Case 3: nothing matches. (We got here, so total === 0.)
  if (events.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-10 text-center">
        <p className="font-medium">No events match these filters.</p>
        <Link className="mt-2 inline-block text-brand-500 hover:underline" href="/events">
          Clear all filters
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {/* Singular or plural: "1 event" vs "6 events". */}
        {total} {total === 1 ? 'event' : 'events'}
      </p>
      <EventGrid events={events} />
      <Pagination filters={filters} pageCount={pageCount} />
    </div>
  );
}
