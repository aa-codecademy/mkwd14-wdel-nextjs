import { Suspense } from 'react';
import { RouteModal } from '../../../../../../components/route-modal';
import { TicketsForSlug } from '../../../../events/[slug]/_components/tickets-for-slug';
import { TicketListSkeleton } from '../../../../events/[slug]/_components/ticket-list-skeleton';

export default function TicketsModal({ params }: PageProps<'/events/[slug]/tickets'>) {
  return (
    <RouteModal title="Get tickets">
      <Suspense fallback={<TicketListSkeleton />}>
        <TicketsForSlug params={params} />
      </Suspense>
    </RouteModal>
  );
}
