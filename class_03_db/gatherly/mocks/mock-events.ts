/**
 * MOCK DATA — fake events so we can build the UI before we have a database.
 *
 * Everything that imports `events` from here will later read from PostgreSQL
 * (class 03) instead. The data is shaped exactly like the `GatherlyEvent` type,
 * so the components won't notice the switch.
 *
 * It's a regular TypeScript module, imported only by Server Components, so it
 * never ends up in the browser's JS bundle.
 */
import type { Category, Event, User, Venue } from '../db/schema';
import type { GatherlyEvent } from '../types/gatherly-event';

// `satisfies Record<string, Category>` checks that EVERY value is a valid
// Category (missing or misspelled fields are errors) WITHOUT widening the type.
// We can still write `categories.conference` with autocomplete. With
// `const categories: Record<string, Category>`, TypeScript would forget the
// keys, and `categories.conference` could be undefined.
const categories = {
  conference: { id: 'c1', name: 'Conference', slug: 'conference', createdAt: new Date() },
  meetup: { id: 'c2', name: 'Meetup', slug: 'meetup', createdAt: new Date() },
  workshop: { id: 'c3', name: 'Workshop', slug: 'workshop', createdAt: new Date() },
  concert: { id: 'c4', name: 'Concert', slug: 'concert', createdAt: new Date() },
  networking: { id: 'c5', name: 'Networking', slug: 'networking', createdAt: new Date() },
} satisfies Record<string, Category>;

const venues = {
  arena: {
    id: 'v1',
    name: 'Boris Trajkovski Arena',
    address: 'Bul. 8 Septemvri 8',
    city: 'Skopje',
    country: 'North Macedonia',
    capacity: 8000,
    createdAt: new Date(),
  },
  hub: {
    id: 'v2',
    name: 'Innovation Hub',
    address: 'Ul. Makedonija 11',
    city: 'Skopje',
    country: 'North Macedonia',
    capacity: 200,
    createdAt: new Date(),
  },
  lakeside: {
    id: 'v3',
    name: 'Lakeside Congress Centre',
    address: 'Kej Makedonija 2',
    city: 'Ohrid',
    country: 'North Macedonia',
    capacity: 1200,
    createdAt: new Date(),
  },
  hall: {
    id: 'v4',
    name: 'Old Tobacco Hall',
    address: 'Ul. Shirok Sokak 40',
    city: 'Bitola',
    country: 'North Macedonia',
    capacity: 450,
    createdAt: new Date(),
  },
} satisfies Record<string, Venue>;

const organizers = {
  avenga: {
    id: 'u1',
    name: 'Avenga Academy',
    email: 'academy@avenga.example',
    handle: 'avenga-academy',
    role: 'organizer',
    createdAt: new Date(),
  },
  jsMk: {
    id: 'u2',
    name: 'JavaScript Macedonia',
    email: 'hello@javascript.mk.example',
    handle: 'javascript-macedonia',
    role: 'organizer',
    createdAt: new Date(),
  },
  soundwave: {
    id: 'u3',
    name: 'Soundwave Live',
    email: 'events@soundwave.example',
    handle: 'soundwave-live',
    role: 'organizer',
    createdAt: new Date(),
  },
} satisfies Record<string, User>;

// Small helper that builds an Unsplash image URL from a photo id.
// `w=1200&q=75&fm=jpg` asks Unsplash for a 1200px wide, 75% quality JPG.
// The host must be allowed in next.config.ts for next/image to load it.
const cover = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=75&fm=jpg`;

type MockEvent = Omit<Event, 'coverImageUrl' | 'createdAt' | 'venueId' | 'organizerId'> & {
  coverImageUrl: string;
  venue: Venue;
  categories: Category[];
  organizer: User;
};

const mockEvent = ({ venue, organizer, ...event }: MockEvent): GatherlyEvent => ({
  ...event,
  coverImageUrl: event.coverImageUrl,
  createdAt: new Date(),
  venueId: venue.id,
  organizerId: organizer.id,
  venue,
  categories: event.categories,
  organizer,
});

// The type annotation `GatherlyEvent[]` makes TypeScript check every object
// below. Forget a field or misspell `status`, and you get an error right here.
export const events: GatherlyEvent[] = [
  mockEvent({
    id: 'e1',
    slug: 'nextjs-conf-skopje-2027',
    title: 'Next.js Conf Skopje 2027',
    description:
      'A full day of talks on the App Router, Server Components and caching, from people who ship them in production. Lunch and after-party included.',
    coverImageUrl: cover('1540575467063-178a50c2df87'),
    // ISO 8601 date with a time-zone offset (+01:00 = Central European Time in winter).
    startsAt: new Date('2027-03-12T09:00:00+01:00'),
    endsAt: new Date('2027-03-12T18:00:00+01:00'),
    status: 'published',
    city: 'Skopje',
    minPriceCents: 4900,
    // References to the objects above — shared, not copied. Several events use venues.hub.
    venue: venues.hub,
    categories: [categories.conference],
    organizer: organizers.avenga,
  }),
  mockEvent({
    id: 'e2',
    slug: 'summer-lights-festival',
    title: 'Summer Lights Festival',
    description:
      'Two stages, twelve artists and a confetti finale. The biggest open-air night of the season.',
    coverImageUrl: cover('1492684223066-81342ee5ff30'),
    startsAt: new Date('2027-07-03T19:00:00+02:00'),
    endsAt: new Date('2027-07-04T02:00:00+02:00'),
    status: 'published',
    city: 'Skopje',
    minPriceCents: 3500,
    venue: venues.arena,
    categories: [categories.concert],
    organizer: organizers.soundwave,
  }),
  mockEvent({
    id: 'e3',
    slug: 'indie-night-live',
    title: 'Indie Night Live',
    description: 'Three local bands, one long night. Phones up for the encore.',
    coverImageUrl: cover('1501281668745-f7f57925c3b4'),
    startsAt: new Date('2027-02-19T20:00:00+01:00'),
    endsAt: new Date('2027-02-19T23:30:00+01:00'),
    status: 'published',
    city: 'Bitola',
    minPriceCents: 1500,
    venue: venues.hall,
    categories: [categories.concert],
    organizer: organizers.soundwave,
  }),
  mockEvent({
    id: 'e4',
    slug: 'design-systems-in-practice',
    title: 'Design Systems in Practice',
    description:
      'How three product teams built, adopted and survived their design systems. Case studies, not theory.',
    coverImageUrl: cover('1505373877841-8d25f7d46678'),
    startsAt: new Date('2027-01-28T18:00:00+01:00'),
    endsAt: new Date('2027-01-28T21:00:00+01:00'),
    status: 'published',
    city: 'Skopje',
    minPriceCents: 0,
    venue: venues.hub,
    categories: [categories.meetup],
    organizer: organizers.jsMk,
  }),
  mockEvent({
    id: 'e5',
    slug: 'javascript-meetup-january',
    title: 'JavaScript Meetup — January',
    description:
      'Monthly community meetup: two short talks, lightning demos, and pizza. First-time speakers welcome.',
    coverImageUrl: cover('1515187029135-18ee286d815b'),
    startsAt: new Date('2027-01-14T18:30:00+01:00'),
    endsAt: new Date('2027-01-14T21:00:00+01:00'),
    status: 'published',
    city: 'Skopje',
    minPriceCents: 0,
    venue: venues.hub,
    categories: [categories.meetup, categories.networking],
    organizer: organizers.jsMk,
  }),
  mockEvent({
    id: 'e6',
    slug: 'balkan-tech-expo',
    title: 'Balkan Tech Expo',
    description:
      'Sixty exhibitors, a startup pitch competition and a hiring floor. Bring your CV and your questions.',
    coverImageUrl: cover('1523580494863-6f3031224c94'),
    startsAt: new Date('2027-04-22T10:00:00+02:00'),
    endsAt: new Date('2027-04-23T17:00:00+02:00'),
    status: 'published',
    city: 'Ohrid',
    minPriceCents: 2000,
    venue: venues.lakeside,
    categories: [categories.conference, categories.networking],
    organizer: organizers.avenga,
  }),
  mockEvent({
    id: 'e7',
    slug: 'founders-dinner-ohrid',
    title: "Founders' Dinner",
    description:
      'An evening of good food and better conversations for founders, investors and early employees.',
    coverImageUrl: cover('1511578314322-379afb476865'),
    startsAt: new Date('2027-04-22T19:30:00+02:00'),
    endsAt: new Date('2027-04-22T23:00:00+02:00'),
    status: 'published',
    city: 'Ohrid',
    minPriceCents: 6000,
    venue: venues.lakeside,
    categories: [categories.networking],
    organizer: organizers.avenga,
  }),
  mockEvent({
    id: 'e8',
    slug: 'arena-rock-night',
    title: 'Arena Rock Night',
    description: 'The loudest night of the winter. Standing only; ear plugs at the door.',
    coverImageUrl: cover('1459749411175-04bf5292ceea'),
    startsAt: new Date('2027-12-05T20:00:00+01:00'),
    endsAt: new Date('2027-12-05T23:59:00+01:00'),
    status: 'published',
    city: 'Skopje',
    minPriceCents: 4000,
    venue: venues.arena,
    categories: [categories.concert],
    organizer: organizers.soundwave,
  }),
  mockEvent({
    id: 'e9',
    slug: 'open-mic-tech-talks',
    title: 'Open Mic: Tech Talks',
    description:
      'Five minutes, one slide, any topic. Sign up at the door and tell us what you learned this month.',
    coverImageUrl: cover('1475721027785-f74eccf877e2'),
    startsAt: new Date('2027-02-04T19:00:00+01:00'),
    endsAt: new Date('2027-02-04T21:00:00+01:00'),
    status: 'published',
    city: 'Bitola',
    minPriceCents: 0,
    venue: venues.hall,
    categories: [categories.meetup],
    organizer: organizers.jsMk,
  }),
  mockEvent({
    id: 'e10',
    slug: 'typescript-deep-dive-workshop',
    title: 'TypeScript Deep Dive',
    description:
      'A hands-on day of generics, narrowing and inference. Bring a laptop with Node 20.9 or newer.',
    coverImageUrl: cover('1522202176988-66273c2fd55f'),
    startsAt: new Date('2027-02-27T10:00:00+01:00'),
    endsAt: new Date('2027-02-27T16:00:00+01:00'),
    status: 'published',
    city: 'Skopje',
    minPriceCents: 2500,
    venue: venues.hub,
    categories: [categories.workshop],
    organizer: organizers.avenga,
  }),
  mockEvent({
    id: 'e11',
    slug: 'product-discovery-workshop',
    title: 'Product Discovery Workshop',
    description:
      'Interview users, map assumptions and design a test you can run next Monday. Small groups, lots of sticky notes.',
    coverImageUrl: cover('1517048676732-d65bc937f952'),
    startsAt: new Date('2027-03-20T09:30:00+01:00'),
    endsAt: new Date('2027-03-20T15:30:00+01:00'),
    status: 'published',
    city: 'Ohrid',
    minPriceCents: 3000,
    venue: venues.lakeside,
    categories: [categories.workshop],
    organizer: organizers.avenga,
  }),
  mockEvent({
    id: 'e12',
    slug: 'react-server-components-meetup',
    title: 'React Server Components, Explained',
    description:
      'What actually runs where, what ships to the browser, and why. A meetup talk with a live demo and Q&A.',
    coverImageUrl: cover('1591115765373-5207764f72e7'),
    startsAt: new Date('2027-03-04T18:30:00+01:00'),
    endsAt: new Date('2027-03-04T20:30:00+01:00'),
    status: 'published',
    city: 'Skopje',
    minPriceCents: 0,
    venue: venues.hub,
    categories: [categories.meetup],
    organizer: organizers.jsMk,
  }),
  mockEvent({
    id: 'e13',
    slug: 'winter-jazz-evening',
    title: 'Winter Jazz Evening',
    description: 'Still being planned — drafts never appear in the list.',
    coverImageUrl: cover('1470229722913-7c0e2dbbafd3'),
    startsAt: new Date('2027-12-18T20:00:00+01:00'),
    endsAt: new Date('2027-12-18T23:00:00+01:00'),
    // A draft — useful later to test that drafts are hidden from the public list.
    status: 'draft',
    city: 'Bitola',
    minPriceCents: 2000,
    venue: venues.hall,
    categories: [categories.concert],
    organizer: organizers.soundwave,
  }),
];
