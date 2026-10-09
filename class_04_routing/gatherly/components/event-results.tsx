import { searchEvents } from '../db/queries/events';
import type { EventFilters } from '../lib/event-filters';
import { EventGrid } from './event-grid';

export async function EventResults({ filters }: { filters: EventFilters }) {
  const events = await searchEvents(filters);
  console.log('🚀 ~ EventResults ~ filters:', filters);

  console.log('🚀 ~ EventResults ~ events:', events);

  return (
    <div>
      <EventGrid events={events} />
    </div>
  );
}
