/**
 * A UNION of string literals: an EventStatus can only be one of these three
 * values. TypeScript autocompletes them and flags typos like 'publised'.
 * It's a lightweight alternative to an `enum`.
 */
export type EventStatus = 'draft' | 'published' | 'canceled';
