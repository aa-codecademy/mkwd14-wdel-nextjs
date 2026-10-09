/**
 * EventGrid — renders one <EventCard /> per event in a responsive grid.
 *
 * For now the data still comes from a mock file, even though the database now exists
 * (see db/). The next step is to load events from PostgreSQL with Drizzle instead. Only
 * this import (and an `await`) will change. The cards and the page stay the same, which is
 * one benefit of splitting data from UI.
 */
import { getPublishedEvents } from '../db/queries/events';
import { EventCard } from './event-card';

export async function EventGrid() {
  const events = await getPublishedEvents();

  return (
    // Responsive grid: 1 column on phones, 2 from `sm` (640px), 3 from `lg` (1024px).
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/*
       * Rendering a list: `.map()` turns each event into a component.
       * React needs a unique, stable `key` on each item to know which item is
       * which when the list changes. Use an id, not the array index.
       *
       * Note: the mock data includes a `draft` event (e13), and nothing filters
       * it out yet. Later: `events.filter((e) => e.status === 'published')`,
       * or a WHERE clause in the database query.
       */}
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
