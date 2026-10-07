import type { Category, Event, User, Venue } from '../db/schema';

// Base fields come from Drizzle; related records are loaded alongside the event.
export type GatherlyEvent = Omit<Event, 'coverImageUrl'> & {
  // The event card requires an image URL, although the database column is nullable.
  coverImageUrl: string;
  venue: Venue;
  categories: Category[];
  organizer: User;
};
