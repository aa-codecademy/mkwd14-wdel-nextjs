// GET /api/events/:slug/calendar.ics

import type { NextRequest } from 'next/server';
import { getEventBySlug } from '../../../../../db/queries/events';
import { buildIcs } from '../../../../../lib/ics';

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/events/[slug]/calendar.ics'>,
) {
  const { slug } = await ctx.params;

  const event = await getEventBySlug(slug);

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
      url: new URL(`/events/${event.slug}`, request.nextUrl.origin).toString(),
    },
    new Date(),
  );

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}
