/**
 * GatherlyEvent — what the UI needs to show one event card.
 *
 * In class 02 this was a hand-written type. Now the database schema is the source of truth, so
 * we BUILD the type from it: `Event` (one row of the `events` table) plus the related rows that
 * a query loads with it (venue, categories, organizer). If a column changes in db/schema.ts,
 * this type changes with it. No second copy to keep in sync.
 */
import type { Category, Event, User, Venue } from '../db/schema';

// Base fields come from Drizzle; related records are loaded alongside the event.
// `Omit<Event, 'coverImageUrl'>` = all event columns EXCEPT that one; `& { ... }` adds fields back.
// Together: "an Event, but with a required coverImageUrl, plus its relations".
export type GatherlyEvent = Omit<Event, 'coverImageUrl'> & {
  // The event card requires an image URL, although the database column is nullable.
  coverImageUrl: string;
  venue: Venue;
  categories: Category[];
  organizer: User;
};
