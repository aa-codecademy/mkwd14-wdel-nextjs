/**
 * EventResults — fetches the events for the current filters and renders them.
 *
 * An ASYNC SERVER COMPONENT: it `await`s the database query directly in the component. No
 * useEffect, no loading state, no API route. Separating "fetch" (this component) from
 * "display" (<EventGrid />) lets us later wrap THIS component in <Suspense> to stream
 * the results while the rest of the page is already visible.
 */
import Link from 'next/link';
import { searchEvents } from '../../../../db/queries/events';
import { eventsHref, type EventFilters } from '../../../../lib/event-filters';
import { EventGrid } from '../../../../components/event-grid';
import { Pagination } from './pagination';

export async function EventResults({ filters }: { filters: EventFilters }) {
  const { events, pageCount, total } = await searchEvents(filters);

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
        {total} {total === 1 ? 'event' : 'events'}
      </p>
      <EventGrid events={events} />
      <Pagination filters={filters} pageCount={pageCount} />
    </div>
  );
}
