/**
 * Turns the raw URL search params into a clean, typed `EventFilters` object.
 *
 * Anything in the URL is USER INPUT: it can be missing, repeated (?q=a&q=b), empty (?q=) or
 * anything someone types in the address bar. So we validate it with Zod before using it, the
 * same way we will validate form data later.
 *
 * Our rule for pages is to be FORGIVING: bad input never crashes the page. It's treated as
 * "no filter". (APIs, later, are strict and answer with an error instead.)
 */
// Zod 4: describe the shape you expect, then parse the data against it.
import z from 'zod';

// The allowed sort orders, in ONE place. `as const` keeps them as exact literal types
// ('date' | 'price' | 'newest'), and the schema and the form's <select> both agree on them.
export const SORT_BY_OPTIONS = ['date', 'price', 'newest'] as const;

// ?q=a&q=b arrives as ['a', 'b']. We only want ONE value, so take the first.
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
// `preprocess` runs `first` BEFORE the schema checks the value. `one(schema)` = "one value of this type".
const one = <T extends z.ZodType>(schema: T) => z.preprocess(first, schema);

const filterSchema = z.object({
  // A search text: trim the spaces, at least 1 character, and the whole param is optional.
  // `.catch(undefined)` = "if validation fails for ANY reason, use undefined instead of throwing".
  // So ?q= (empty), ?q=%20%20 (only spaces) or a missing q all become `q: undefined`.
  q: one(z.string().trim().min(1).optional()).catch(undefined),
  // Category slug / city name: any non-empty text, or nothing. An unknown value simply matches no
  // events. (We don't need to check it against the database to stay safe: it's only ever sent as
  // a query parameter.)
  category: one(z.string().min(1).optional()).catch(undefined),
  city: one(z.string().min(1).optional()).catch(undefined),
  // `z.iso.date()` accepts only a valid calendar date as "YYYY-MM-DD". ?from=banana -> undefined.
  from: one(z.iso.date().optional()).catch(undefined),
  // `z.enum([...])`: only one of the listed values. Anything else (?sort=hacked) falls back to
  // the DEFAULT given to `.catch('date')`. A missing sort gets the default too.
  sort: one(z.enum(SORT_BY_OPTIONS)).catch('date'),
  // URL params are always strings. `z.coerce.number()` converts "3" to 3, `.int().min(1)` rejects
  // 0, -2 and 1.5. Anything invalid (?page=abc) becomes page 1.
  page: one(z.coerce.number().int().min(1)).catch(1),
});

// `parse` returns the clean object (or throws; it can't here because of `.catch`).
// Unknown params like ?foo=bar are dropped, because z.object() ignores keys it doesn't know.
export function parseEventFilters(searchParams: Record<string, string | string[] | undefined>) {
  return filterSchema.parse(searchParams);
}

// BUILDS a /events URL from the current filters, changing only what's in `patch`:
//   eventsHref(filters, { category: 'meetup', page: 1 })
// This is how links stay consistent: every pill and pagination link keeps the user's other
// filters without hand-writing query strings in each component.
// `Partial<EventFilters>` = an object with any subset of the filter fields.
export function eventsHref(current: EventFilters, patch: Partial<EventFilters> = {}): string {
  // Spread the current filters, then the patch on top: the patch wins.
  const next = { ...current, ...patch };

  const params = new URLSearchParams();

  // Only write the params that differ from the default, so URLs stay short and clean:
  // no `?sort=date` (the default) and no `?page=1`.

  if (next.q) {
    params.set('q', next.q);
  }

  if (next.category) {
    params.set('category', next.category);
  }

  if (next.city) {
    params.set('city', next.city);
  }

  if (next.from) {
    params.set('from', next.from);
  }

  if (next.sort !== 'date') {
    params.set('sort', next.sort);
  }

  if (next.page > 1) {
    params.set('page', String(next.page));
  }

  const query = params.toString();

  // No params at all -> the plain /events URL, without a trailing `?`.
  return query ? `/events?${query}` : '/events';
}

// The TypeScript type is DERIVED from the schema, so they can never get out of sync:
// EventFilters = { q?: string; category?: string; city?: string; from?: string;
//                  sort: 'date' | 'price' | 'newest'; page: number }
// (`sort` and `page` are never undefined: `.catch(...)` always gives them a value.)
export type EventFilters = z.infer<typeof filterSchema>;
