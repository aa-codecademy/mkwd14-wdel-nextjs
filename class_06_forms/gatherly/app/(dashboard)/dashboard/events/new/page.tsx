import { getEventFormOptions } from '../../../../../db/queries/dashboard';
import { NewEventForm } from './_components/new-event-form';

export default async function NewEventFormPage() {
  const { venues, categories } = await getEventFormOptions();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-900">New event</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        It starts as a draft. Publish it from your dashboard.
      </p>
      <NewEventForm venues={venues} categories={categories} />
    </div>
  );
}
