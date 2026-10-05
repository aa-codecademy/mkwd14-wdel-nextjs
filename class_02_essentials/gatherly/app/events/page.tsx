import { EventGrid } from '../../components/event-grid';

export default function EventsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-900">Upcoming events</h1>
      <p className="text-muted-foreground mt-1 mb-8">Everything happening on Gatherly.</p>
      <EventGrid />
    </div>
  );
}
