import { Skeleton } from '../../../../../components/ui/skeleton';

export function TicketListSkeleton() {
  return (
    <section className="mt-8" aria-busy="true">
      <h2 className="text-xl font-semibold">Tickets</h2>
      <Skeleton className="mt-3 h-40 w-full rounded-card" />
    </section>
  );
}
