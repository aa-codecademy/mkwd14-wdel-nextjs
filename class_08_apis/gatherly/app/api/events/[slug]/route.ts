/**
 * ROUTE HANDLER: GET /api/events/:slug   — a public JSON API: "one event".
 *
 *   curl http://localhost:3000/api/events/nextjs-conf-skopje-2027
 *
 * The dynamic segment `[slug]` works like in pages, and `RouteContext<'/api/events/[slug]'>` is the generated
 * type for this route's `params` (the counterpart of PageProps). `params` is a Promise: await it.
 *
 * What it answers, as HTTP:
 *   200  { "data": { ...the public event... } }
 *   404  { "error": { "code": "not_found", "message": "No published event ..." } }   (see lib/api.ts)
 *
 * A draft or cancelled event answers 404, the same as one that doesn't exist: getEventBySlug only returns
 * published events, so the API never confirms that an unpublished event is there.
 */
import type { NextRequest } from 'next/server';
import { getEventBySlug } from '../../../../db/queries/events';
import { apiError } from '../../../../lib/api';
import { toPublicEvent } from '../../../../lib/to-public-event';

// `_request`: we don't need the request here, and the underscore tells ESLint "unused on purpose".
export async function GET(_request: NextRequest, ctx: RouteContext<'/api/events/[slug]'>) {
  const { slug } = await ctx.params;

  const event = await getEventBySlug(slug);

  if (!event) {
    // (With the bug in lib/api.ts, this still goes out as HTTP 200. It should be a real 404.)
    return apiError(404, 'not_found', `No published event ${slug}`);
  }

  // Always the whitelist mapper, never the raw row. `data` as the single top-level key leaves room to add
  // `meta`, `links`... later without breaking clients.
  return Response.json({ data: toPublicEvent(event) });
}
