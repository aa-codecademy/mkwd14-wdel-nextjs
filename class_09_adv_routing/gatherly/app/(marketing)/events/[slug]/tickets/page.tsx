import { Suspense } from 'react';
import { BackToEvent } from '../_components/back-to-event';
import { TicketListSkeleton } from '../_components/ticket-list-skeleton';
import { TicketsForSlug } from '../_components/tickets-for-slug';

export default function TicketsPage({ params }: PageProps<'/events/[slug]/tickets'>) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-900">Get tickets</h1>

      <Suspense fallback={<TicketListSkeleton />}>
        <TicketsForSlug params={params} />
      </Suspense>
      <Suspense>
        <BackToEvent params={params} />
      </Suspense>
    </div>
  );
}
