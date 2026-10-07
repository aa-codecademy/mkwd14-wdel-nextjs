/**
 * The main data type of the app: one event on Gatherly.
 *
 * Types describe the SHAPE of data, and they exist only while you write code.
 * TypeScript removes them when compiling, so they cost nothing at runtime.
 *
 * Each type has its own file in `types/`. Later, when we have a database,
 * Drizzle can generate these types from the table definitions.
 *
 * `type` vs `interface`: both work for object shapes. We use `type`
 * throughout for consistency.
 */
import type { Category } from './event-category';
import type { Organizer } from './event-organizer';
import type { EventStatus } from './event-status';
import type { Venue } from './event-venue';

export type GatherlyEvent = {
  id: string;
  // URL-friendly name, e.g. 'nextjs-conf-skopje-2027' -> /events/nextjs-conf-skopje-2027
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  // Real Date objects, not strings, so we can compare and format them.
  startsAt: Date;
  endsAt: Date;
  // Only one of 'draft' | 'published' | 'canceled'. Any other string is a type error.
  status: EventStatus;
  city: string;
  // Money in whole cents (4900 = 49.00) to avoid floating-point rounding errors.
  minPriceCents: number;
  // Nested objects reuse the smaller types: one event has one venue, many categories.
  venue: Venue;
  categories: Category[];
  organizer: Organizer;
};
