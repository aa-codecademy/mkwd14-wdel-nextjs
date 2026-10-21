import type { NextRequest } from 'next/server';
import z from 'zod';
import { apiError } from '../../../lib/api';
import { searchEvents } from '../../../db/queries/events';
import { toPublicEvent } from '../../../lib/to-public-event';

const Query = z
  .object({
    q: z.string().trim().min(1).optional(),
    category: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    from: z.iso.date().optional(),
    sort: z.enum(['date', 'price', 'newest']).default('date'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export async function GET(request: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    apiError(400, 'invalid_query', 'Invalid query parameters', z.flattenError(parsed.error));
  }

  const { ...filters } = parsed.data;

  const { events, total, pageCount } = await searchEvents(filters);

  return Response.json({
    data: events.map(toPublicEvent),
    page: filters.page,
    total,
    pageCount,
  });
}
