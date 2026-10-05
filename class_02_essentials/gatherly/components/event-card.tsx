import Link from 'next/link';
import type { GatherlyEvent } from '../types/gatherly-event';
import Image from 'next/image';

export function EventCard({ event }: { event: GatherlyEvent }) {
  return (
    <div className="border">
      {/* temporary link: TODO: replace with event details link */}
      <Link href="/events">
        <Image
          src={event.coverImageUrl}
          alt={event.title}
          // className="object-cover"
          width={300}
          height={300}
          // sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
        />
      </Link>
      <div className="flex flex-wrap gap-1">
        {event.categories.map((category) => (
          <span key={category.id}>{category.name}</span>
        ))}
      </div>
      <h1>{event.title}</h1>
      <div>
        <p>{event.startsAt.toISOString()}</p>
        <p>
          {event.venue.name}, {event.venue.city}
        </p>
      </div>
      <div>
        <p>{event.minPriceCents === 0 ? 'Free' : `From ${event.minPriceCents}`}</p>
      </div>
    </div>
  );
}
