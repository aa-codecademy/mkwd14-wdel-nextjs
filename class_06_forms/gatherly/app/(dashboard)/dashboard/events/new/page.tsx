/**
 * ROUTE: /dashboard/events/new   — the "create an event" page.
 *
 * The page itself is a SERVER Component with one job: load what the form needs (the list of
 * venues and categories to choose from) and hand it to the form. The form is a CLIENT Component
 * (./_components/new-event-form.tsx) because it uses React hooks.
 *
 * This split is a pattern you'll use again and again:
 *   page (server)  -> reads the database, passes plain data down as props
 *   form (client)  -> interactive: pending state, error messages
 *   action (server)-> receives the submit, validates, writes (app/actions/events.ts)
 *
 * It lives in the (dashboard) route group, so the sidebar layout wraps it automatically.
 */
// The options for the <select> and the checkboxes come from the database, so a new venue or
// category appears in the form without changing any code.
import { getEventFormOptions } from '../../../../../db/queries/dashboard';
import { NewEventForm } from './_components/new-event-form';

export default async function NewEventFormPage() {
  // Props passed from a Server to a Client Component must be plain data (objects, arrays, strings),
  // because they travel over the network. Functions and class instances can't.
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
