// ⚠️ LEGACY — nothing imports this file anymore. The pages now use `EventWithDetails`, a type
// inferred from the database query (db/queries/events.ts).
// It is also BROKEN, just silently: `Event` no longer exists in db/schema.ts (renamed to `GatherlyEvent`),
// and its import was removed. The `User` import was fixed to come from Better Auth's `user` table
// (db/auth-schema.ts), but nothing imports `Event` now, so TypeScript resolves the name to the BROWSER's
// built-in DOM `Event` type (a click/submit event!) instead of complaining. The file compiles, but the type
// is wrong. Fix it by deleting this file, or by importing `GatherlyEvent` from db/schema instead.
/**
 * GatherlyEvent — what the UI needs to show one event card.
 *
 * In class 02 this was a hand-written type. Now the database schema is the source of truth, so
 * we BUILD the type from it: `Event` (one row of the `events` table) plus the related rows that
 * a query loads with it (venue, categories, organizer). If a column changes in db/schema.ts,
 * this type changes with it. No second copy to keep in sync.
 */
// `User` now comes from the auth schema: the old `users` table (and its type) was replaced by Better Auth's `user`.
import type { User } from '../db/auth-schema';
import type { Category, Venue } from '../db/schema';

// Base fields come from Drizzle; related records are loaded alongside the event.
// `Omit<Event, 'coverImageUrl'>` = all event columns EXCEPT that one; `& { ... }` adds fields back.
// Together: "an Event, but with a required coverImageUrl, plus its relations".
// ⚠️ `Event` here is the DOM's global `Event`, not our database row (see the note at the top).
export type GatherlyEvent = Omit<Event, 'coverImageUrl'> & {
  // The event card requires an image URL, although the database column is nullable.
  coverImageUrl: string;
  venue: Venue;
  categories: Category[];
  organizer: User;
};
