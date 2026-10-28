/**
 * LAYOUT with PARALLEL ROUTES — the dashboard overview is assembled from independent panels.
 *
 * A folder starting with `@` is a SLOT (a "parallel route"): a part of the page that has its OWN
 * page.tsx, loading.tsx and error.tsx, and is rendered at the same time as the others.
 *
 *   (overview)/
 *   ├── layout.tsx          <- this file: receives every slot as a prop and decides WHERE to put it
 *   ├── page.tsx            <- `children`: the list of events, the main part of the page
 *   ├── @stats/             -> the `stats` prop      (the row of number tiles)
 *   ├── @orders/            -> the `orders` prop     (recent orders)
 *   └── @attendees/         -> the `attendees` prop  (recent attendees)
 *
 * `@stats` is NOT part of the URL, it only names the prop. Everything here is still just `/dashboard`.
 *
 * WHY, instead of one big page that loads all four things? Each slot is independent:
 *   - they LOAD IN PARALLEL: the slowest one doesn't hold the others back,
 *   - each has its own SKELETON (loading.tsx) and shows up when ready (streaming),
 *   - each has its own ERROR page (error.tsx): if the orders query fails, the stats and attendees
 *     still render, and only that panel shows "Couldn't load this panel. Try again".
 *
 * WHY the `(overview)` folder? It's a ROUTE GROUP (not part of the URL). It scopes this layout, and
 * its slots, to the `/dashboard` page only. `/dashboard/events/new` is a sibling route and does not
 * get these panels around the form.
 */
import type { ReactNode } from 'react';

// `children` is the normal page.tsx. Every `@slot` folder next to this layout becomes one more prop
// with the same name. If a slot's name and the prop's name don't match, the slot is never rendered.
type OverviewLayoutProps = {
  children: ReactNode;
  stats: ReactNode;
  attendees: ReactNode;
  orders: ReactNode;
};

export default function OverviewLayout({
  children,
  stats,
  orders,
  attendees,
}: OverviewLayoutProps) {
  // The layout is only about POSITION: where each panel sits. The panels know nothing about each other.
  return (
    <div className="space-y-6">
      {/* A full-width row of tiles on top. */}
      <section>{stats}</section>
      {/* Below: orders take 2 of 3 columns on large screens, attendees the last one (stacked on phones). */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">{orders}</section>
        <aside>{attendees}</aside>
      </div>
      {/* The main content: the list of events (page.tsx of this folder). */}
      {children}
    </div>
  );
}
