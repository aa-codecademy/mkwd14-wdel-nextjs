/**
 * ROUTE: /events/[slug]/tickets   — the FULL-PAGE version of "Get tickets".
 *
 * This is the page you get on a refresh, a direct visit or a shared link. When you reach this URL by clicking
 * a link inside the app, the intercepting route in app/(marketing)/@modal/(.)events/[slug]/tickets/
 * takes over and shows the same content in a modal instead.
 *
 * Both use <TicketsForSlug>, so the content is written once. Here it just gets a heading and a way back.
 */
import { Suspense } from 'react';
import { BackToEvent } from '../_components/back-to-event';
import { TicketListSkeleton } from '../_components/ticket-list-skeleton';
import { TicketsForSlug } from '../_components/tickets-for-slug';

export default function TicketsPage({ params }: PageProps<'/events/[slug]/tickets'>) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-900">Get tickets</h1>

      {/* The ticket list is slow-ish, so it has a skeleton. */}
      <Suspense fallback={<TicketListSkeleton />}>
        <TicketsForSlug params={params} />
      </Suspense>
      {/* Both children AWAIT the `params` promise, so each sits in its own <Suspense>: the page can
          render its heading at once and stream the rest. (No fallback: the link is tiny.) */}
      <Suspense>
        <BackToEvent params={params} />
      </Suspense>
    </div>
  );
}
