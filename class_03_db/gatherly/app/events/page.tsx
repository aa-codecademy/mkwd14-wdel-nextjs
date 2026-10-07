/**
 * ROUTE: /events   — the list of all events
 *
 * The page stays small: a heading, plus <EventGrid />, which does the work.
 * Splitting UI into small components keeps pages readable, and the pieces can
 * be reused (e.g. the same grid on a "featured events" section later).
 *
 * Everything here is a Server Component, so the events are rendered to HTML on
 * the server, and no event data or rendering code ships to the browser as JS.
 */
// A relative import. `@/components/event-grid` would point to the same file —
// see the "@/*" alias note in components/event-grid.tsx.
import { EventGrid } from '../../components/event-grid';

export default function EventsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-900">Upcoming events</h1>
      {/*
       * `text-muted-foreground` doesn't do anything yet: there's no
       * `--color-muted-foreground` token in globals.css. It's a shadcn/ui
       * token, and it will start working once we add shadcn/ui.
       */}
      <p className="text-muted-foreground mt-1 mb-8">Everything happening on Gatherly.</p>
      <EventGrid />
    </div>
  );
}
