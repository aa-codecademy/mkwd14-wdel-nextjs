import Link from 'next/link';
import { type ReactNode } from 'react';

// The organizer app's chrome: a sidebar, no marketing header or footer.
// Navigating between (marketing) and (dashboard) swaps the whole layout;
// navigating inside one keeps it mounted.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-brand-50 p-4">
        <Link href="/dashboard" className="text-lg font-bold text-brand-900">
          Gatherly <span className="text-sm font-normal text-muted-foreground">for organizers</span>
        </Link>
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
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
