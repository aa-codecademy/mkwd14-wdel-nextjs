/**
 * TicketsForSlug — the content of "Get tickets", shared by the modal AND the full page.
 *
 * It takes the `params` PROMISE (not the slug), awaits it, loads the event, and renders the date, the place
 * and the ticket list (<TicketsList>, with its Reserve buttons from class 7). Because the content lives in one
 * component, the modal (@modal/(.)events/...) and the full page (events/[slug]/tickets) can't drift apart.
 */
import { notFound } from 'next/navigation';
import { getEventBySlug } from '../../../../../db/queries/events';
import { formatEventDate } from '../../../../../lib/format';
import { TicketsList } from './tickets-list';

export async function TicketsForSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await getEventBySlug(slug);

  // An unknown or unpublished slug: the 404 page. (Inside a modal this renders the not-found UI in the slot.)
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
