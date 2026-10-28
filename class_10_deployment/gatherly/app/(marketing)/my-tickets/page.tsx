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
