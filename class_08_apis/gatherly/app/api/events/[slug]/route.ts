import type { NextRequest } from 'next/server';
import { getEventBySlug } from '../../../../db/queries/events';
import { apiError } from '../../../../lib/api';
import { toPublicEvent } from '../../../../lib/to-public-event';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/events/[slug]'>) {
  const { slug } = await ctx.params;

  const event = await getEventBySlug(slug);

  if (!event) {
    return apiError(404, 'not_found', `No published event ${slug}`);
  }

  return Response.json({ data: toPublicEvent(event) });
}
