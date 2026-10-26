// The loading placeholder for <TicketsList>, shown by the <Suspense> on the event page. It keeps the
// real heading and only greys out the list, and its height is close to the real list's to avoid a jump.
import { Skeleton } from '../../../../../components/ui/skeleton';

export function TicketListSkeleton() {
  return (
    <section className="mt-8" aria-busy="true">
      <h2 className="text-xl font-semibold">Tickets</h2>
      <Skeleton className="mt-3 h-40 w-full rounded-card" />
    </section>
  );
}
