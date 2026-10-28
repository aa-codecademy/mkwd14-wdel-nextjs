import type { ReactNode } from 'react';

// LAYOUT with PARALLEL ROUTES: the /dashboard overview is assembled from independent panels.
// (Full explanation in class 09: each `@folder` is a slot with its own page, loading and error files.)
//
//   (overview)/
//   ├── page.tsx        -> `children`: the events list and the scanner tokens section
//   ├── @stats/         -> the `stats` prop      (the number tiles, now including "Checked in")
//   ├── @orders/        -> the `orders` prop     (recent orders)
//   └── @attendees/     -> the `attendees` prop  (recent attendees)
//
// `@stats` is not part of the URL. The `(overview)` route group scopes these panels to /dashboard only,
// so /dashboard/check-in (a sibling route) does not get them around it.
// If a slot's folder name and its prop name don't match, that slot is never rendered.
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
  // The layout only decides POSITION; the panels load in parallel and know nothing about each other.
  return (
    <div className="space-y-6">
      {/* Full-width row of tiles on top. */}
      <section>{stats}</section>
      {/* Orders take 2 of 3 columns on large screens, attendees the last one (stacked on phones). */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">{orders}</section>
        <aside>{attendees}</aside>
      </div>
      {/* The main content: page.tsx of this folder. */}
      {children}
    </div>
  );
}
