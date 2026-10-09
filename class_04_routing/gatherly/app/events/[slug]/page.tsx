import { notFound } from 'next/navigation';
import { getEventBySlug } from '../../../db/queries/events';
import { Badge } from '../../../components/ui/badge';
import { FavouriteButton } from '../../../components/favourite-button';
import { formatEventDate, formatPrice } from '../../../lib/format';
import { EventCover } from '../../../components/event-cover';

export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <article>
      <div className="relative aspect-21/9 overflow-hidden rounded-card">
        <EventCover
          src={event.coverImageUrl}
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
