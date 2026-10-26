/**
 * ROUTE HANDLER: GET /api/events   — a public JSON API: "list events".
 *
 *   curl "http://localhost:3000/api/events?q=next&city=Skopje&sort=price&page=2"
 *
 * Same data and same query function (searchEvents) as the /events PAGE, but the answer is JSON for other
 * programs instead of HTML for people. That's the benefit of keeping queries in db/queries/: the page and
 * the API share them.
 *
 * Page vs API: two different attitudes to bad input (a rule from class 4 and 6):
 *   a PAGE is FORGIVING:  ?sort=garbage quietly becomes the default, the user still sees a page.
 *   an API is STRICT:     ?sort=garbage -> 400 Bad Request, with a message saying what was wrong. A program
 *                         can't read between the lines, and silent fixes hide its bugs.
 *
 * ⚠️ Two bugs in this snapshot (marked below): the 400 is never returned, and `limit` is ignored.
 */
import type { NextRequest } from 'next/server';
import z from 'zod';
// One error format for the whole API. See lib/api.ts.
import { apiError } from '../../../lib/api';
import { searchEvents } from '../../../db/queries/events';
// Maps a database event to the public JSON shape. See lib/to-public-event.ts.
import { toPublicEvent } from '../../../lib/to-public-event';

// The accepted query string, as a Zod schema. Compare with lib/event-filters.ts (the forgiving one for pages):
// here there is no `.catch(...)`, so a bad value is an ERROR, not a default.
const Query = z
  .object({
    q: z.string().trim().min(1).optional(),
    category: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    from: z.iso.date().optional(),
    // `.default(...)` fills in a value when the param is ABSENT, but a present, invalid value still fails.
    sort: z.enum(['date', 'price', 'newest']).default('date'),
    page: z.coerce.number().int().min(1).default(1),
    // A cap (max 50) so nobody can ask for a million rows in one request.
    // ⚠️ The API accepts `limit`, but searchEvents ignores it and always returns PAGE_SIZE (6) events.
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  // `.strict()`: an UNKNOWN parameter (?foo=1) is an error too, instead of being silently ignored.
  // That catches typos like ?citi=Skopje early.
  .strict();

// A Route Handler: an exported function named after the HTTP method. It gets the Request, and must
// return a Response. (Export `POST`, `PUT`, `DELETE`... the same way for other methods.)
export async function GET(request: NextRequest) {
  // `request.nextUrl.searchParams` is the parsed query string. `Object.fromEntries` turns it into a plain
  // object for Zod. (A repeated key like ?q=a&q=b keeps only the last value.)
  const parsed = Query.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    // ⚠️ BUG: there is no `return` in front of apiError(...). It builds a Response and throws it away, and
    // the code continues with `parsed.data`, which is undefined here, so the next line crashes with a
    // 500. It must be `return apiError(...)`. (And lib/api.ts must send the real 400 status.)
    apiError(400, 'invalid_query', 'Invalid query parameters', z.flattenError(parsed.error));
  }

  // From here on the input is clean and typed. (`const { ...filters } = x` is just a copy of `x`.)
  const { ...filters } = parsed.data;

  // The same query the /events page uses. Filters, sorting and pagination all come for free.
  const { events, total, pageCount } = await searchEvents(filters);

  // The response: the data under `data`, and the pagination numbers next to it, so a client knows how many
  // pages there are. Each event goes through the whitelist mapper first.
  return Response.json({
    data: events.map(toPublicEvent),
    page: filters.page,
    total,
    pageCount,
  });
}
