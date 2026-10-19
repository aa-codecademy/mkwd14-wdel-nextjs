/**
 * SEED SCRIPT — resets the database and fills it with demo data.
 *
 *   npm run db:seed        (runs `tsx db/seed.ts`; the tables must exist: `npm run db:migrate`)
 *
 * It DELETES everything first — never point it at production.
 *
 * Two kinds of data live here:
 * - FIXED: the demo users (db/demo-users.ts looks them up by handle), venues, categories and
 *   the curated events. They are written by hand so every student sees the same pages, and
 *   so the demo stays predictable (e.g. a VIP tier with 3 seats that sells out).
 * - RANDOM (@faker-js/faker): extra attendees, and the orders and tickets they bought.
 *   Nobody depends on who they are, only that they look real.
 *
 * It's a standalone Node script, NOT part of the Next.js app. That's why it builds its own
 * database connection instead of importing `db` from db/index.ts ('server-only' throws here).
 */
import { loadEnvConfig } from '@next/env';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as authSchema from './auth-schema';
import { user } from './auth-schema';
import * as appSchema from './schema';
import {
  categories,
  eventCategories,
  events,
  orders,
  tickets,
  ticketTypes,
  venues,
  type OrderStatus,
} from './schema';
import { Pool } from 'pg';

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy from .env.example to .env to fill it out.');
}

const pool = new Pool({ connectionString });
const db = drizzle({ client: pool, schema: { ...appSchema, ...authSchema }, casing: 'snake_case' });

const cover = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=75&fm=jpg`;

// ───────────────────────── FIXED DATA ─────────────────────────

const userData = {
  avenga: {
    name: 'Avenga Academy',
    email: 'academy@example.com',
    handle: 'avenga',
    role: 'organizer',
  },
  jsMk: {
    name: 'JavaScript Macedonia',
    email: 'hello@js.example.com',
    handle: 'js-mk',
    role: 'organizer',
  },
  soundwave: {
    name: 'Soundwave Live',
    email: 'bookings@soundwave.example.com',
    handle: 'soundwave',
    role: 'organizer',
  },
  // Stands in for "the signed-in attendee" until real sign-in exists (see db/demo-users.ts).
  demoAttendee: {
    name: 'Demo Attendee',
    email: 'attendee@example.com',
    handle: 'demo-attendee',
    role: 'attendee',
  },
};

const venueData = {
  arena: {
    name: 'Boris Trajkovski Arena',
    address: 'Bul. 8 Septemvri 8',
    city: 'Skopje',
    country: 'North Macedonia',
    capacity: 8000,
  },
  hub: {
    name: 'Innovation Hub',
    address: 'Ul. Makedonija 11',
    city: 'Skopje',
    country: 'North Macedonia',
    capacity: 200,
  },
  lakeside: {
    name: 'Lakeside Congress Centre',
    address: 'Kej Makedonija 2',
    city: 'Ohrid',
    country: 'North Macedonia',
    capacity: 1200,
  },
  hall: {
    name: 'Old Tobacco Hall',
    address: 'Ul. Shirok Sokak 40',
    city: 'Bitola',
    country: 'North Macedonia',
    capacity: 450,
  },
};

const categoryData = {
  conference: { name: 'Conference', slug: 'conference' },
  meetup: { name: 'Meetup', slug: 'meetup' },
  workshop: { name: 'Workshop', slug: 'workshop' },
  concert: { name: 'Concert', slug: 'concert' },
  networking: { name: 'Networking', slug: 'networking' },
};

type SeedTicketType = { name: string; priceCents: number; quantity: number };

// `city` and `minPriceCents` are denormalised copies, filled in from the venue and the tiers.
type SeedEvent = Omit<
  typeof events.$inferInsert,
  'venueId' | 'organizerId' | 'city' | 'minPriceCents'
> & {
  venue: keyof typeof venueData;
  organizer: keyof typeof userData;
  categories: (keyof typeof categoryData)[];
  ticketTypes: SeedTicketType[];
};

/** An early-bird and a regular tier, or one free tier. */
function tiers(fromCents: number): SeedTicketType[] {
  if (fromCents === 0) return [{ name: 'Free admission', priceCents: 0, quantity: 80 }];
  return [
    { name: 'Early bird', priceCents: fromCents, quantity: 20 },
    { name: 'Regular', priceCents: Math.round((fromCents * 1.4) / 100) * 100, quantity: 150 },
  ];
}

const eventData: SeedEvent[] = [
  {
    slug: 'nextjs-conf-skopje-2027',
    title: 'Next.js Conf Skopje 2027',
    description:
      'A full day of talks on the App Router, Server Components and caching, from people who ship them in production. Lunch and after-party included.',
    coverImageUrl: cover('1540575467063-178a50c2df87'),
    startsAt: new Date('2027-03-12T09:00:00+01:00'),
    endsAt: new Date('2027-03-12T18:00:00+01:00'),
    status: 'published',
    // A VIP tier with only 3 seats, so "sold out" can be shown live.
    ticketTypes: [...tiers(4900), { name: 'VIP', priceCents: 14900, quantity: 3 }],
    venue: 'hub',
    categories: ['conference'],
    organizer: 'avenga',
  },
  {
    slug: 'summer-lights-festival',
    title: 'Summer Lights Festival',
    description:
      'Two stages, twelve artists and a confetti finale. The biggest open-air night of the season.',
    coverImageUrl: cover('1492684223066-81342ee5ff30'),
    startsAt: new Date('2027-07-03T19:00:00+02:00'),
    endsAt: new Date('2027-07-04T02:00:00+02:00'),
    status: 'published',
    ticketTypes: tiers(3500),
    venue: 'arena',
    categories: ['concert'],
    organizer: 'soundwave',
  },
  {
    slug: 'indie-night-live',
    title: 'Indie Night Live',
    description: 'Three local bands, one long night. Phones up for the encore.',
    coverImageUrl: cover('1501281668745-f7f57925c3b4'),
    startsAt: new Date('2027-02-19T20:00:00+01:00'),
    endsAt: new Date('2027-02-19T23:30:00+01:00'),
    status: 'published',
    ticketTypes: tiers(1500),
    venue: 'hall',
    categories: ['concert'],
    organizer: 'soundwave',
  },
  {
    slug: 'design-systems-in-practice',
    title: 'Design Systems in Practice',
    description:
      'How three product teams built, adopted and survived their design systems. Case studies, not theory.',
    coverImageUrl: cover('1505373877841-8d25f7d46678'),
    startsAt: new Date('2027-01-28T18:00:00+01:00'),
    endsAt: new Date('2027-01-28T21:00:00+01:00'),
    status: 'published',
    ticketTypes: tiers(0),
    venue: 'hub',
    categories: ['meetup'],
    organizer: 'jsMk',
  },
  {
    slug: 'javascript-meetup-january',
    title: 'JavaScript Meetup — January',
    description:
      'Monthly community meetup: two short talks, lightning demos, and pizza. First-time speakers welcome.',
    coverImageUrl: cover('1515187029135-18ee286d815b'),
    startsAt: new Date('2027-01-14T18:30:00+01:00'),
    endsAt: new Date('2027-01-14T21:00:00+01:00'),
    status: 'published',
    ticketTypes: tiers(0),
    venue: 'hub',
    categories: ['meetup', 'networking'],
    organizer: 'jsMk',
  },
  {
    slug: 'balkan-tech-expo',
    title: 'Balkan Tech Expo',
    description:
      'Sixty exhibitors, a startup pitch competition and a hiring floor. Bring your CV and your questions.',
    coverImageUrl: cover('1523580494863-6f3031224c94'),
    startsAt: new Date('2027-04-22T10:00:00+02:00'),
    endsAt: new Date('2027-04-23T17:00:00+02:00'),
    status: 'published',
    ticketTypes: tiers(2000),
    venue: 'lakeside',
    categories: ['conference', 'networking'],
    organizer: 'avenga',
  },
  {
    slug: 'founders-dinner-ohrid',
    title: "Founders' Dinner",
    description:
      'An evening of good food and better conversations for founders, investors and early employees.',
    coverImageUrl: cover('1511578314322-379afb476865'),
    startsAt: new Date('2027-04-22T19:30:00+02:00'),
    endsAt: new Date('2027-04-22T23:00:00+02:00'),
    status: 'published',
    ticketTypes: tiers(6000),
    venue: 'lakeside',
    categories: ['networking'],
    organizer: 'avenga',
  },
  {
    slug: 'arena-rock-night',
    title: 'Arena Rock Night',
    description: 'The loudest night of the winter. Standing only; ear plugs at the door.',
    coverImageUrl: cover('1459749411175-04bf5292ceea'),
    startsAt: new Date('2027-12-05T20:00:00+01:00'),
    endsAt: new Date('2027-12-05T23:59:00+01:00'),
    status: 'published',
    ticketTypes: tiers(4000),
    venue: 'arena',
    categories: ['concert'],
    organizer: 'soundwave',
  },
  {
    slug: 'open-mic-tech-talks',
    title: 'Open Mic: Tech Talks',
    description:
      'Five minutes, one slide, any topic. Sign up at the door and tell us what you learned this month.',
    coverImageUrl: cover('1475721027785-f74eccf877e2'),
    startsAt: new Date('2027-02-04T19:00:00+01:00'),
    endsAt: new Date('2027-02-04T21:00:00+01:00'),
    status: 'published',
    ticketTypes: tiers(0),
    venue: 'hall',
    categories: ['meetup'],
    organizer: 'jsMk',
  },
  {
    slug: 'typescript-deep-dive-workshop',
    title: 'TypeScript Deep Dive',
    description:
      'A hands-on day of generics, narrowing and inference. Bring a laptop with Node 20.9 or newer.',
    coverImageUrl: cover('1522202176988-66273c2fd55f'),
    startsAt: new Date('2027-02-27T10:00:00+01:00'),
    endsAt: new Date('2027-02-27T16:00:00+01:00'),
    status: 'published',
    ticketTypes: tiers(2500),
    venue: 'hub',
    categories: ['workshop'],
    organizer: 'avenga',
  },
  {
    slug: 'product-discovery-workshop',
    title: 'Product Discovery Workshop',
    description:
      'Interview users, map assumptions and design a test you can run next Monday. Small groups, lots of sticky notes.',
    coverImageUrl: cover('1517048676732-d65bc937f952'),
    startsAt: new Date('2027-03-20T09:30:00+01:00'),
    endsAt: new Date('2027-03-20T15:30:00+01:00'),
    status: 'published',
    ticketTypes: tiers(3000),
    venue: 'lakeside',
    categories: ['workshop'],
    organizer: 'avenga',
  },
  {
    slug: 'react-server-components-meetup',
    title: 'React Server Components, Explained',
    description:
      'What actually runs where, what ships to the browser, and why. A meetup talk with a live demo and Q&A.',
    coverImageUrl: cover('1591115765373-5207764f72e7'),
    startsAt: new Date('2027-03-04T18:30:00+01:00'),
    endsAt: new Date('2027-03-04T20:30:00+01:00'),
    status: 'published',
    ticketTypes: tiers(0),
    venue: 'hub',
    categories: ['meetup'],
    organizer: 'jsMk',
  },
  {
    slug: 'winter-jazz-evening',
    title: 'Winter Jazz Evening',
    description: 'Still being planned — drafts never appear in the list.',
    coverImageUrl: cover('1470229722913-7c0e2dbbafd3'),
    startsAt: new Date('2027-12-18T20:00:00+01:00'),
    endsAt: new Date('2027-12-18T23:00:00+01:00'),
    status: 'draft',
    ticketTypes: tiers(2000),
    venue: 'hall',
    categories: ['concert'],
    organizer: 'soundwave',
  },
];

// ───────────────────────── RANDOM DATA ─────────────────────────

const EXTRA_ATTENDEES = 25;

/** Random attendees. The index keeps the UNIQUE email and handle from ever colliding. */
function randomAttendees() {
  return Array.from({ length: EXTRA_ATTENDEES }, (_, index) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).replace('@', `+${index}@`).toLowerCase(),
      handle: `${faker.internet.username({ firstName, lastName }).toLowerCase()}-${index}`,
      role: 'attendee',
    };
  });
}

// Mostly paid, with a few of every other status so the order screens have something to show.
const orderStatuses: OrderStatus[] = [
  'paid',
  'paid',
  'paid',
  'paid',
  'pending',
  'refunded',
  'canceled',
];

/** Find the inserted row that a piece of seed data refers to. */
function lookup<Row>(rows: Row[], matches: (row: Row) => boolean, what: string): Row {
  const row = rows.find(matches);
  if (!row) throw new Error(`Seed data refers to an unknown ${what}`);
  return row;
}

async function seed() {
  try {
    // A TRANSACTION = all or nothing: a failed insert rolls everything back, so the database
    // is never left half-empty after the deletes.
    await db.transaction(async (tx) => {
      // Children before parents, or the foreign keys refuse.
      await tx.delete(tickets);
      await tx.delete(orders);
      await tx.delete(ticketTypes);
      await tx.delete(eventCategories);
      await tx.delete(events);
      await tx.delete(categories);
      await tx.delete(venues);
      // Deleting users also cascades to their `account` and `session` rows.
      await tx.delete(user);

      // Parents before children, for the same reason. `.returning()` gives us the generated ids.
      const insertedUsers = await tx
        .insert(user)
        .values(
          // `user.id` is text with no default (Better Auth owns it), so we generate one per row.
          [...Object.values(userData), ...randomAttendees()].map((row) => ({
            ...row,
            id: randomUUID(),
          })),
        )
        .returning();
      const insertedVenues = await tx.insert(venues).values(Object.values(venueData)).returning();
      const insertedCategories = await tx
        .insert(categories)
        .values(Object.values(categoryData))
        .returning();

      const attendees = insertedUsers.filter((row) => row.role === 'attendee');
      const demoAttendee = lookup(
        insertedUsers,
        (row) => row.handle === userData.demoAttendee.handle,
        'demo attendee',
      );

      const usedCodes = new Set<string>();
      let orderCount = 0;
      let ticketCount = 0;

      for (const {
        venue,
        organizer,
        categories: categoryKeys,
        ticketTypes: tiersForEvent,
        ...event
      } of eventData) {
        const venueRow = lookup(
          insertedVenues,
          (v) => v.name === venueData[venue].name,
          `venue "${venue}"`,
        );
        const organizerRow = lookup(
          insertedUsers,
          (u) => u.handle === userData[organizer].handle,
          `organizer "${organizer}"`,
        );

        const [insertedEvent] = await tx
          .insert(events)
          .values({
            ...event,
            venueId: venueRow.id,
            organizerId: organizerRow.id,
            city: venueRow.city, // the denormalised copies
            minPriceCents: Math.min(...tiersForEvent.map((t) => t.priceCents)),
          })
          .returning({ id: events.id });
        if (!insertedEvent) throw new Error(`Insert returned no row for ${event.slug}`);

        const insertedTiers = await tx
          .insert(ticketTypes)
          .values(tiersForEvent.map((tier) => ({ ...tier, eventId: insertedEvent.id })))
          .returning();

        // The many-to-many: one junction row per category.
        await tx.insert(eventCategories).values(
          categoryKeys.map((key) => ({
            eventId: insertedEvent.id,
            categoryId: lookup(
              insertedCategories,
              (c) => c.slug === categoryData[key].slug,
              `category "${key}"`,
            ).id,
          })),
        );

        // Drafts aren't on sale, so nobody has bought anything yet.
        if (event.status !== 'published') continue;

        // Remaining seats per ticket type: random orders must never oversell a tier.
        const remaining = new Map(insertedTiers.map((tier) => [tier.id, tier.quantity]));

        // Fixed on purpose: the 3-seat VIP tier is sold out, bought by the demo attendee.
        const vipTier = insertedTiers.find((tier) => tier.name === 'VIP');
        const buyers = faker.helpers.arrayElements(attendees, { min: 3, max: 10 });
        const plannedOrders = [
          ...(vipTier ? [{ buyer: demoAttendee, tier: vipTier, seats: vipTier.quantity }] : []),
          ...buyers.map((buyer) => ({
            buyer,
            tier: faker.helpers.arrayElement(insertedTiers),
            seats: faker.number.int({ min: 1, max: 4 }),
          })),
        ];

        for (const { buyer, tier, seats: wanted } of plannedOrders) {
          const seats = Math.min(wanted, remaining.get(tier.id) ?? 0);
          if (seats === 0) continue;
          remaining.set(tier.id, (remaining.get(tier.id) ?? 0) - seats);

          const [order] = await tx
            .insert(orders)
            .values({
              userId: buyer.id,
              eventId: insertedEvent.id,
              status:
                vipTier && tier.id === vipTier.id
                  ? 'paid'
                  : faker.helpers.arrayElement(orderStatuses),
              totalCent: tier.priceCents * seats,
              createdAt: faker.date.recent({ days: 60 }),
            })
            .returning({ id: orders.id });
          if (!order) throw new Error(`Insert returned no order for ${event.slug}`);

          // One ticket per seat. The first one carries the buyer's name; guests get fake ones.
          await tx.insert(tickets).values(
            Array.from({ length: seats }, (_, seat) => {
              let code: string;
              do {
                code = `GTH-${faker.string.alphanumeric({ length: 10, casing: 'upper' })}`;
              } while (usedCodes.has(code));
              usedCodes.add(code);
              return {
                orderId: order.id,
                ticketTypeId: tier.id,
                code,
                attendeeName: seat === 0 ? buyer.name : faker.person.fullName(),
              };
            }),
          );
          orderCount += 1;
          ticketCount += seats;
        }
      }

      process.stdout.write(
        `Seeded ${insertedUsers.length} users, ${insertedVenues.length} venues, ` +
          `${insertedCategories.length} categories, ${eventData.length} events, ` +
          `${orderCount} orders and ${ticketCount} tickets.\n`,
      );
    });
  } finally {
    // Close the connection pool, or the Node process would stay open and never exit.
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
});
