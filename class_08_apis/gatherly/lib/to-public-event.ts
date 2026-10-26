/**
 * toPublicEvent — the SHAPE of an event in our public API.
 *
 * The database row and the API response are two different things on purpose. We pick the public fields
 * ONE BY ONE, and never do `Response.json(row)`, for three reasons:
 *   1. SAFETY: a row has internal ids and whatever sensitive column is added next year (an organizer's
 *      email, a ban flag...). With a whitelist, a new column stays private until someone decides to expose it.
 *   2. STABILITY: other people's code depends on this shape. If we rename a database column, the API
 *      doesn't have to change. We just update this mapper.
 *   3. CONVENIENCE: we can give clients exactly what's useful: ISO dates, category SLUGS instead of whole
 *      objects, and ready-made links.
 *
 * (This pattern has a name: a DTO, "data transfer object".) It's a pure function: easy to read and to test.
 */
import type { EventWithDetails } from '../db/queries/events';

// The `EventWithDetails` type comes from the query (db/queries/events.ts), so if the query changes shape
// the compiler tells us which line here to fix.
export function toPublicEvent(event: EventWithDetails) {
  return {
    slug: event.slug,
    title: event.title,
    description: event.description,
    // Dates as ISO 8601 strings ("2027-03-12T08:00:00.000Z"): JSON has no Date type, and every language can parse this.
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    city: event.city,
    // Named for what it means, and still in cents (the client formats it).
    fromPriceCents: event.minPriceCents,
    coverImageUrl: event.coverImageUrl,
    // Nested objects with only the public fields: no venue id, no capacity, and for the organizer no email or
    // role (the query doesn't even load them, see `withDetails` in db/queries/events.ts).
    venue: { name: event.venue.name, address: event.venue.address, city: event.venue.city },
    organizer: { name: event.organizer.name, handle: event.organizer.handle },
    // Just the slugs: ['conference', 'networking'].
    categories: event.categories.map((category) => category.slug),
    // HATEOAS-style links: where to go next, so clients don't have to build URLs themselves.
    links: {
      page: `/events/${event.slug}`,
      calendar: `/api/events/${event.slug}/calendar.ics`,
    },
  };
}
