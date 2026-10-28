// LEGACY (class 02): nothing imports this file anymore. In class 03 the `Organizer`-like types
// come from the database schema (db/schema.ts). Kept for reference; safe to delete later.
// The person or company that publishes an event. Later this will be a user account.
export type Organizer = {
  id: string;
  name: string;
};
