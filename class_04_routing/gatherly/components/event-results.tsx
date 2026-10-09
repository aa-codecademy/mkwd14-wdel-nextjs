/**
 * EventResults — fetches the events for the current filters and renders them.
 *
 * An ASYNC SERVER COMPONENT: it `await`s the database query directly in the component. No
 * useEffect, no loading state, no API route. Separating "fetch" (this component) from
 * "display" (<EventGrid />) lets us later wrap THIS component in <Suspense> to stream
 * the results while the rest of the page is already visible.
 */
import { searchEvents } from '../db/queries/events';
import type { EventFilters } from '../lib/event-filters';
import { EventGrid } from './event-grid';

export async function EventResults({ filters }: { filters: EventFilters }) {
  const events = await searchEvents(filters);
  // DEBUG LEFTOVERS: these logs print in the TERMINAL running `npm run dev` (this runs on the
  // server, not in the browser console). Handy while learning, but remove them before you
  // commit: ESLint warns about console.log (see eslint.config.mjs).
  console.log('🚀 ~ EventResults ~ filters:', filters);

  console.log('🚀 ~ EventResults ~ events:', events);

  return (
    <div>
      <EventGrid events={events} />
    </div>
  );
}
