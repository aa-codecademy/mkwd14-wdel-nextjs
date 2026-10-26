/**
 * ROUTE HANDLER: GET /api/events/:slug/calendar.ics   — "Add to calendar".
 *
 * Our first Route Handler that isn't Better Auth's. `route.ts` is the special file for an HTTP endpoint (the
 * counterpart of `page.tsx`): instead of a React component it exports a function per HTTP method (GET,
 * POST, ...) that receives a Request and returns a Response.
 *
 * Why a Route Handler here, and not a page or a Server Action?
 *   - it returns a FILE (calendar data), not HTML,
 *   - it's reached by a plain link (GET), so a browser, a phone or a calendar app can open it,
 *   - a Server Action is only for changing data from our own forms.
 * (Rule of thumb from class 6: use a Route Handler for downloads, webhooks and other clients' requests.)
 *
 * The folder is literally named `calendar.ics`, so the URL ends in ".ics" and the browser knows what to do.
 * See lib/ics.ts for how the file is built.
 */
// GET /api/events/:slug/calendar.ics

import type { NextRequest } from 'next/server';
import { getEventBySlug } from '../../../../../db/queries/events';
import { buildIcs } from '../../../../../lib/ics';

// `NextRequest` = the standard Request plus Next.js extras (`request.nextUrl`). `RouteContext<'...'>` is the
// generated global type that knows this route's params (like PageProps for pages).
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/events/[slug]/calendar.ics'>,
) {
  // `params` is a Promise here too, so it's awaited.
  const { slug } = await ctx.params;

  const event = await getEventBySlug(slug);

  // No such (published) event: answer with a real HTTP 404 status. A handler has no notFound() page UI
  // to show: it speaks HTTP, so we set the status ourselves.
  if (!event) {
    return new Response('Not found', { status: 404 });
  }

  const ics = buildIcs(
    {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: `${event.venue.name}, ${event.venue.address}, ${event.venue.city}`,
      // A calendar app needs an ABSOLUTE link back to the event, so we build it from this request's origin
      // (http://localhost:3000 in development, your domain in production).
      url: new URL(`/events/${event.slug}`, request.nextUrl.origin).toString(),
    },
    // "Generated at": now.
    new Date(),
  );

  return new Response(ics, {
    headers: {
      // Tells the browser WHAT it is: calendar data (so "open with Calendar" works).
      'Content-Type': 'text/calendar; charset=utf-8',
      // `attachment` = download it instead of showing it, and `filename` is the suggested file name.
      // (The slug is safe here: it came from OUR database row, not directly from the URL.)
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}
