// What the public API returns about an event — chosen field by field. Never

import type { EventWithDetails } from '../db/queries/events';

// Response.json(row): the row has internal ids and whatever columns get added next.
export function toPublicEvent(event: EventWithDetails) {
  return {
    slug: event.slug,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    city: event.city,
    fromPriceCents: event.minPriceCents,
    coverImageUrl: event.coverImageUrl,
    venue: { name: event.venue.name, address: event.venue.address, city: event.venue.city },
    organizer: { name: event.organizer.name, handle: event.organizer.handle },
    categories: event.categories.map((category) => category.slug),
    links: {
      page: `/events/${event.slug}`,
      calendar: `/api/events/${event.slug}/calendar.ics`,
    },
  };
}
