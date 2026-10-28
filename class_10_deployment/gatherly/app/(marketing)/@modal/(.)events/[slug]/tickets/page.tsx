/**
 * INTERCEPTING ROUTE: /events/[slug]/tickets, shown as a MODAL on top of the current page.
 *
 * The folder name `(.)events` is the key. `(.)` means "intercept a route at the same level".
 * So when the browser navigates (by clicking a link, inside the app) to /events/some-slug/tickets, Next.js
 * does NOT load that page. It renders THIS file in the `@modal` slot instead, and the page you were on
 * (the events list, or an event) STAYS visible behind the dialog. The URL changes, so the modal can be
 * shared and the Back button closes it.
 *
 *   click "Get tickets" on /events        ->  URL: /events/xyz/tickets   (soft navigation)
 *                                              screen: the events list + this modal over it
 *   refresh, or open that URL directly    ->  (hard navigation) the REAL page is rendered:
 *                                              app/(marketing)/events/[slug]/tickets/page.tsx
 *
 * So one URL has two presentations that share the same content (<TicketsForSlug>): a modal when you
 * come from inside the app, a full page when you arrive from outside (a shared link, a search engine, a refresh).
 *
 * The interception markers count URL SEGMENTS, not folders: route groups like `(marketing)` and slots like
 * `@modal` don't count. That's why `(.)events` here, in `app/(marketing)/@modal/`, matches `/events/...`.
 *   (.)   same level      (..)  one level up      (..)(..)  two levels up      (...)  from the root
 */
import { Suspense } from 'react';
import { RouteModal } from '../../../../../../components/route-modal';
import { TicketsForSlug } from '../../../../events/[slug]/_components/tickets-for-slug';
import { TicketListSkeleton } from '../../../../events/[slug]/_components/ticket-list-skeleton';

// `PageProps<'/events/[slug]/tickets'>` types `params` for the URL that is being intercepted.
export default function TicketsModal({ params }: PageProps<'/events/[slug]/tickets'>) {
  return (
    // The modal shell (title, close button, overlay) renders immediately...
    <RouteModal title="Get tickets">
      {/* ...and the content streams in. We pass `params` (still a Promise) down WITHOUT awaiting it here,
          so this component doesn't block: <TicketsForSlug> awaits it itself, inside the Suspense. */}
      <Suspense fallback={<TicketListSkeleton />}>
        <TicketsForSlug params={params} />
      </Suspense>
    </RouteModal>
  );
}
