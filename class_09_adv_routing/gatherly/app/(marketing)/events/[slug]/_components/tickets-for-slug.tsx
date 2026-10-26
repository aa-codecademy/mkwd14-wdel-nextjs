import { notFound } from 'next/navigation';
import { getEventBySlug } from '../../../../../db/queries/events';
import { formatEventDate } from '../../../../../lib/format';
import { TicketsList } from './tickets-list';

export async function TicketsForSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {formatEventDate(event.startsAt)} - {event.venue.name}, {event.venue.city}
      </p>
      <TicketsList eventId={event.id} />
    </div>
  );
}
