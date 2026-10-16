'use server';
import { z } from 'zod';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { eventCategories, events, venues } from '../../db/schema';
import { getDemoOrganizer } from '../../db/demo-users';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const CreateEvent = z
  .object({
    title: z.string().trim().min(3, { error: 'Title must be at least 3 characters long' }).max(120),
    description: z.string().trim().min(20, { error: 'Give attendees a real description' }),
    venueId: z.uuid({ error: 'Pick a venue' }),
    startsAt: z.coerce.date({ error: 'Pick a start date and time' }),
    endsAt: z.coerce.date({ error: 'Pick an end date and time' }),
    categoryIds: z.array(z.uuid()).min(1, { error: 'Pick at least one category' }),
    price: z.coerce
      .number({ error: 'Enter a price ' })
      .min(0, { error: "Price can't be a negative number" }),
    quantity: z.coerce.number().int().min(1, { error: 'At least one ticket' }),
  })
  .refine((event) => event.endsAt > event.startsAt, {
    error: 'Event must end after it starts',
    path: ['endsAt'],
  });

type Field = keyof z.input<typeof CreateEvent>;

export type CreateEventState = {
  errors?: Partial<Record<Field, string[]>>;
  message?: string;
  values?: Partial<Record<Field, string | string[]>>;
};

export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const organizer = await getDemoOrganizer();
  // Object.fromEntries keeps only the LAST value of a repeated field, so the
  // category checkboxes are read with getAll().
  const raw = {
    ...Object.fromEntries(formData),
    categoryIds: formData.getAll('categoryIds'),
  };

  const values = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String) : String(value),
    ]),
  );

  const parsed = CreateEvent.safeParse(raw);

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { price, quantity, categoryIds, ...input } = parsed.data;

  const venue = await db.query.venues.findFirst({ where: eq(venues.id, input.venueId) });

  if (!venue) return { errors: { venueId: ["That venue doesn't exist"] }, values };

  const priceCents = Math.round(price * 100);

  await db.transaction(async (tx) => {
    const [insertedEvent] = await tx
      .insert(events)
      .values({
        ...input,
        slug: await uniqueSlug(input.title),
        organizerId: organizer.id,
        city: venue.city,
        minPriceCents: priceCents,
        status: 'draft',
      })
      .returning({ id: events.id });

    if (!insertedEvent) throw new Error('Issue while creating event');

    await tx
      .insert(eventCategories)
      .values(categoryIds.map((categoryId) => ({ eventId: insertedEvent.id, categoryId })));
  });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

async function uniqueSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  const taken = await db.query.events.findFirst({
    where: eq(events.slug, base),
    columns: { id: true },
  });

  return taken ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base;
}
