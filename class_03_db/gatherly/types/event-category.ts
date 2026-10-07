// LEGACY (class 02): nothing imports this file anymore. In class 03 the `Category`-like types
// come from the database schema (db/schema.ts). Kept for reference; safe to delete later.
// A category like 'Conference' or 'Meetup'. `slug` is the URL-friendly version of the name.
export type Category = {
  id: string;
  name: string;
  slug: string;
};
