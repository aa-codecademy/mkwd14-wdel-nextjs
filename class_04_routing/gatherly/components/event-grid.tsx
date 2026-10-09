/**
 * EventGrid — renders one <EventCard /> per event in a responsive grid.
 *
 * Since class 04 the events come from the DATABASE (db/queries/events.ts), not from the
 * mock file. They're passed in as a prop by <EventResults />. This component only displays a
 * list and knows nothing about where it came from, which is why we could swap the mock data
 * for real data without touching the cards.
 *
 * `EventWithDetails` is the type inferred from the query: an event + venue + categories +
 * organizer.
 */
import { type EventWithDetails } from '../db/queries/events';
import { EventCard } from './event-card';

// (It's declared `async`, but there's no `await` inside, so a plain function would do.)
export async function EventGrid({ events }: { events: EventWithDetails[] }) {
  return (
    // Responsive grid: 1 column on phones, 2 from `sm` (640px), 3 from `lg` (1024px).
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/*
       * Rendering a list: `.map()` turns each event into a component.
       * React needs a unique, stable `key` on each item to know which item is
       * which when the list changes. Use an id, not the array index.
       *
       * Drafts and cancelled events never get here: the database query already filters
       * `status = 'published'` (see db/queries/events.ts). Filter in the query, not in the UI.
       */}
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
