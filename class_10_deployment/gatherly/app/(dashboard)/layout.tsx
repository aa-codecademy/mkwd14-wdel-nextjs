import Link from 'next/link';
import { type ReactNode } from 'react';

// LAYOUT of the (dashboard) ROUTE GROUP: the organizer app's chrome, a sidebar with no marketing
// header or footer. The group name in parentheses is not part of the URL, so this layout wraps
// /dashboard, /dashboard/events/new and /dashboard/check-in alike.
// Navigating between (marketing) and (dashboard) swaps the whole layout;
// navigating inside one keeps it mounted (the sidebar doesn't re-render or lose state).
// New in class 10: the "Check-in" link below, the door-scanning page for event day.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-brand-50 p-4">
        <Link href="/dashboard" className="text-lg font-bold text-brand-900">
          Gatherly <span className="text-sm font-normal text-muted-foreground">for organizers</span>
        </Link>
        {/* Plain <Link>s: client-side navigation, and Next prefetches them when they scroll into view. */}
        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="hover:text-brand-500">
            Your events
          </Link>
          <Link href="/dashboard/events/new" className="hover:text-brand-500">
            New event
          </Link>
          <Link href="/dashboard/check-in" className="hover:text-brand-500">
            Check-in
          </Link>
          <Link href="/" className="mt-8 text-muted-foreground hover:text-foreground">
            ← Back to the site
          </Link>
        </nav>
      </aside>
      {/* `children` is whichever page matches the URL, swapped in while the sidebar stays put. */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
