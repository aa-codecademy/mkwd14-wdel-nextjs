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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatEventDate, formatPrice } from '../lib/format';
import { FavouriteButton } from './favourite-button';

export function EventCard({ event }: { event: GatherlyEvent }) {
  return (
    <Card className="pt-0">
      {/* temporary link: TODO: replace with event details link */}
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
      <CardContent className="text-muted-foreground">
        <p>{formatEventDate(event.startsAt)}</p>
        <p>
          {event.venue.name}, {event.venue.city}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <p className="font-semibold">{formatPrice(event.minPriceCents)}</p>
        <FavouriteButton />
      </CardFooter>
    </Card>
  );
}
