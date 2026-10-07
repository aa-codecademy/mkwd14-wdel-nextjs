// LEGACY (class 02): nothing imports this file anymore. In class 03 the `Venue`-like types
// come from the database schema (db/schema.ts). Kept for reference; safe to delete later.
// The place where an event happens. Several events can share one venue.
export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
};
