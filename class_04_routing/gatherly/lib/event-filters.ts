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

// ?q=a&q=b arrives as ['a', 'b']. We only want ONE value, so take the first.
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
// `preprocess` runs `first` BEFORE the schema checks the value. `one(schema)` = "one value of this type".
const one = <T extends z.ZodType>(schema: T) => z.preprocess(first, schema);

const filterSchema = z.object({
  // A search text: trim the spaces, at least 1 character, and the whole param is optional.
  // `.catch(undefined)` = "if validation fails for ANY reason, use undefined instead of throwing".
  // So ?q= (empty), ?q=%20%20 (only spaces) or a missing q all become `q: undefined`.
  q: one(z.string().trim().min(1).optional()).catch(undefined),
});

// `parse` returns the clean object (or throws; it can't here because of `.catch`).
// Unknown params like ?foo=bar are dropped, because z.object() ignores keys it doesn't know.
export function parseEventFilters(searchParams: Record<string, string | string[] | undefined>) {
  return filterSchema.parse(searchParams);
}

// The TypeScript type is DERIVED from the schema, so they can never get out of sync:
// EventFilters = { q?: string | undefined }
export type EventFilters = z.infer<typeof filterSchema>;
