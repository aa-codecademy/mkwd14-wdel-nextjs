/**
 * LAYOUT of the (dashboard) ROUTE GROUP — the organizer area, with a sidebar.
 *
 * Same idea as (marketing): the folder name in parentheses is not part of the URL, so
 *   app/(dashboard)/dashboard/page.tsx  ->  /dashboard
 * but all pages of this group share THIS layout (a sidebar, no site header or footer).
 *
 * This is the whole point of route groups: one app, several page "shells", clean URLs.
 * Because this group has its own layout and the root layout is minimal, nothing from the
 * public header leaks in here.
 *
 * The folder is `(dashboard)/dashboard/` because the group name never shows in the URL.
 * The inner `dashboard` folder is what gives us `/dashboard`.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // `flex min-h-screen`: sidebar and content side by side, full height.
  return (
    <div className="flex min-h-screen">
      {/* <aside> = content related to the main content (a sidebar). `shrink-0` stops it from being squeezed. */}
      <aside className="w-56 shrink-0 border-r border-border bg-brand-50 p-4">
        <Link href="/dashboard" className="text-lg font-bold text-brand-900">
          Gatherly <span className="text-sm font-normal text-muted-foreground">for organizers</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="hover:text-brand-500">
            Overview
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
