/**
 * EventCard — one event in the grid. A first, unstyled version. We'll style it
 * and fill in the TODOs in the next classes.
 *
 * Props: `{ event: GatherlyEvent }`. TypeScript knows every field on `event`,
 * so a typo like `event.titel` is an error in the editor, not a bug in the
 * browser.
 */
import Link from 'next/link';
// `import type`: we only need the TYPE, never a runtime value. The import is
// removed from the compiled JS. The ESLint rule `consistent-type-imports`
// enforces this.
import type { GatherlyEvent } from '../types/gatherly-event';
import Image from 'next/image';

export function EventCard({ event }: { event: GatherlyEvent }) {
  return (
    <div className="border">
      {/* temporary link: TODO: replace with event details link */}
      {/* Later this becomes /events/[slug], a dynamic route like in the class 01 examples. */}
      <Link href="/events">
        {/*
         * next/image with a REMOTE image (Unsplash). This only works because
         * next.config.ts allows `images.unsplash.com` in `images.remotePatterns`.
         * Without that, Next.js refuses to optimise images from unknown hosts.
         *
         * width/height are required for remote images. They tell the browser the
         * aspect ratio up front, so the layout doesn't jump when the image loads.
         * Next.js also resizes the image and serves a modern format (WebP/AVIF).
         *
         * `alt` describes the image for screen readers and shows if it fails to
         * load. Never leave it out.
         */}
        <Image
          src={event.coverImageUrl}
          alt={event.title}
          // className="object-cover"
          width={300}
          height={300}
          // `sizes` tells the browser how wide the image will be at each screen
          // size, so it downloads the smallest file that looks sharp.
          // sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
        />
      </Link>
      <div className="flex flex-wrap gap-1">
        {/* An event can have several categories, so we render a list with keys again. */}
        {event.categories.map((category) => (
          <span key={category.id}>{category.name}</span>
        ))}
      </div>
      {/*
       * Note: the page already has an <h1> ("Upcoming events"), so card titles
       * should be <h2> or <h3>. A page should have one <h1>, which helps
       * accessibility and SEO.
       */}
      <h1>{event.title}</h1>
      <div>
        {/*
         * Raw ISO string for now, e.g. "2027-03-12T08:00:00.000Z". Later we'll
         * format it for humans with Intl.DateTimeFormat or
         * toLocaleDateString(). Careful: the server and the user's browser can
         * be in different time zones.
         */}
        <p>{event.startsAt.toISOString()}</p>
        <p>
          {event.venue.name}, {event.venue.city}
        </p>
      </div>
      <div>
        {/*
         * Prices are stored in CENTS (whole numbers) to avoid floating-point
         * rounding errors (0.1 + 0.2 !== 0.3). This still prints e.g.
         * "From 4900". Divide by 100 and format with
         * Intl.NumberFormat(..., { style: 'currency', currency: 'EUR' }).
         */}
        <p>{event.minPriceCents === 0 ? 'Free' : `From ${event.minPriceCents}`}</p>
      </div>
    </div>
  );
}
