// LEGACY (class 02): nothing imports this file anymore. In class 03 the `EventStatus`-like types
// come from the database schema (db/schema.ts). Kept for reference; safe to delete later.
/**
 * A UNION of string literals: an EventStatus can only be one of these three
 * values. TypeScript autocompletes them and flags typos like 'publised'.
 * It's a lightweight alternative to an `enum`.
 */
export type EventStatus = 'draft' | 'published' | 'canceled';
