/**
 * ROUTE: /events/[slug]   — the event DETAILS page (a dynamic route)
 *
 * `[slug]` in the folder name is a dynamic segment (see class 01, /routing/[id]):
 *   /events/nextjs-conf-skopje-2027  ->  params = { slug: 'nextjs-conf-skopje-2027' }
 *
 * Why a SLUG and not the id? The id is a random uuid, while a slug is readable
 * ("nextjs-conf-skopje-2027"), so the URL tells the user (and Google) what's on the page.
 * That's why `slug` is a unique column in db/schema.ts.
 *
 * What happens on a request:
 *   1. read the slug from the URL,
 *   2. look the event up in the database (db/queries/events.ts),
 *   3. no such event (or not published)? -> notFound() -> the 404 page next to this file,
 *   4. otherwise render the page.
 *
 * This page depends on the URL and reads the database, so Next.js renders it on the server
 * when it is requested. It's a Server Component, so none of this code is sent to the browser.
 */
import { notFound } from 'next/navigation';
// Relative imports on purpose here; `@/db/queries/events` would work the same (the `@/` alias).
import { getEventBySlug } from '../../../db/queries/events';
import { Badge } from '../../../components/ui/badge';
import { FavouriteButton } from '../../../components/favourite-button';
import { formatEventDate, formatPrice } from '../../../lib/format';
// A small component that handles events WITHOUT a cover image. See components/event-cover.tsx.
import { EventCover } from '../../../components/event-cover';

// `PageProps<'/events/[slug]'>` is the global helper that types `params` for this exact route.
export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
  // `params` is a Promise in Next.js 15+, so it must be awaited.
  // The slug comes from the URL, so it's user input. We pass it to a query that sends it to
  // PostgreSQL as a parameter, never glued into the SQL text.
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  // No row found (wrong slug, or the event is a draft/cancelled)? Show the 404 page.
  // notFound() THROWS, so nothing below runs. It also makes TypeScript understand that after
  // this `if`, `event` is definitely not null/undefined (type narrowing).
  if (!event) {
    notFound();
  }

  return (
    // <article> = a self-contained piece of content. Better for screen readers than a plain <div>.
    <article>
      {/*
       * The wrapper must be `relative` and have a size (`aspect-21/9` = a 21:9 banner), because
       * <Image fill> inside EventCover positions itself against it. `overflow-hidden` +
       * `rounded-card` crop the image to the rounded corners.
       */}
      <div className="relative aspect-21/9 overflow-hidden rounded-card">
        <EventCover
          src={event.coverImageUrl}
          // `preload` = load this image right away. Use it for the main image above the fold.
          // (It replaces the old `priority` prop in Next.js 16.)
          preload
          sizes="(min-width: 1024px) 1024px, 100vw"
          alt={event.title}
        />
      </div>
      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-1">
            {event.categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-brand-900">{event.title}</h1>
          <p className="mt-1 text-muted-foreground">{event.organizer.name}</p>
        </div>
        <FavouriteButton />
      </div>

      {/*
       * <dl> is a "description list": <dt> = the label, <dd> = its value. The right element for
       * "When / Where / Tickets" pairs. It also stacks on phones and goes 3 columns from `sm` up.
       */}
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">When</dt>
          <dd className="font-medium">{formatEventDate(event.startsAt)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Where</dt>
          <dd className="font-medium">
            {event.venue.name}
            <br />
            {event.venue.address}, {event.venue.city}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Tickets</dt>
          <dd className="font-medium">{formatPrice(event.minPriceCents)}</dd>
        </div>
      </dl>

      <p className="mt-6 max-w-prose text-lg">{event.description}</p>
    </article>
  );
}
