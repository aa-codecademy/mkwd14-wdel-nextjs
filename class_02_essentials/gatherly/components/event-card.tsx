/**
 * EventCard — one event in the grid, built from shadcn/ui parts.
 *
 * The first version was plain <div>s. After `shadcn add card badge button` it
 * is composed from <Card>, <Badge> and <Button>, and uses the helpers in
 * lib/format.ts to show dates and prices the way people read them.
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
// shadcn/ui components live in components/ui/ — our own files, copied by the CLI.
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
// Turn a Date / cents into text. See lib/format.ts.
import { formatEventDate, formatPrice } from '../lib/format';
// A Client Component (has state) rendered inside this Server Component.
import { FavouriteButton } from './favourite-button';

export function EventCard({ event }: { event: GatherlyEvent }) {
  return (
    // `pt-0` overrides the Card's default top padding (cn() resolves the conflict),
    // so the cover image can touch the top edge of the card.
    <Card className="pt-0">
      {/* temporary link: TODO: replace with event details link */}
      {/*
       * `fill` makes the image fill its parent instead of using fixed width/height.
       * It only works when the parent is `relative` and has a size, which is why
       * the link has `relative` + `aspect-video` (16:9). `object-cover` crops the
       * image to fit without stretching it.
       * `sizes` tells the browser how wide the image will be at each screen size,
       * so it downloads the smallest file that still looks sharp.
       * Remote images need the host in next.config.ts (`remotePatterns`).
       */}
      <Link href="/events" className="relative block aspect-video">
        <Image
          src={event.coverImageUrl}
          alt={event.title}
          className="object-cover"
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
        />
      </Link>
      <CardHeader>
        <div className="flex flex-wrap gap-1">
          {event.categories.map((category) => (
            // `variant="secondary"` is one of the variants defined in components/ui/badge.tsx.
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
        <CardTitle>
          {/* temporary link: TODO: replace with event details link */}
          <Link href="/events" className="hover:underline">
            {event.title}
          </Link>
        </CardTitle>
      </CardHeader>
      {/* `text-muted-foreground` is a shadcn colour token (grey text), defined in globals.css. */}
      <CardContent className="text-muted-foreground">
        {/* e.g. "Fri, 12 Mar 2027, 09:00" */}
        <p>{formatEventDate(event.startsAt)}</p>
        <p>
          {event.venue.name}, {event.venue.city}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        {/* e.g. "From €49.00" or "Free" */}
        <p className="font-semibold">{formatPrice(event.minPriceCents)}</p>
        <FavouriteButton />
      </CardFooter>
    </Card>
  );
}
