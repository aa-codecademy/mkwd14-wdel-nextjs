/**
 * ROUTE: /my-tickets   — the signed-in user's tickets.
 *
 * The page itself is a thin shell: a heading plus <TicketList>, which does the slow, per-user work (reading
 * the session and querying the database). The list sits inside <Suspense>, so the heading shows at once and
 * the list streams in. Anything that reads the session/cookies is dynamic, so it belongs inside a Suspense
 * boundary (not in the page body) to keep the rest of the page static.
 *
 * The login guard is NOT here: it lives in <TicketList> (requireUser). Whoever reads the data checks who is asking.
 */
import { Suspense } from 'react';
import { TicketList } from './_components/ticket-list';

export default function MyTicketsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-900">My tickets</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">Loading your tickets...</p>}>
        <TicketList />
      </Suspense>
    </div>
  );
}
