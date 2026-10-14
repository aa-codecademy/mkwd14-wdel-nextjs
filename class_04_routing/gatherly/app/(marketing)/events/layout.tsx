/**
 * NESTED LAYOUT for everything under /events
 *
 * It wraps BOTH /events (the list) and /events/[slug] (the details), so the breadcrumb is
 * written once. The tree for /events/some-slug is:
 *
 *   RootLayout (app/layout.tsx: header + footer)
 *     └─ EventsLayout (this file: breadcrumb)
 *          └─ the page (app/events/[slug]/page.tsx)
 *
 * Layouts stay mounted while you move between the pages inside them, so this component is not
 * re-created when you open an event and come back. Only `children` changes.
 *
 * Folders do NOT have to be named after URLs only: a layout here affects only the routes below
 * `app/events/`. The home page (/) doesn't get the breadcrumb.
 */
import Link from 'next/link';

// `LayoutProps<'/events'>` = the generated global type for this layout's props (gives `children`).
export default function EventsLayout({ children }: LayoutProps<'/events'>) {
  return (
    <div>
      {/* aria-label tells screen readers what this <nav> is. We have more than one nav on the page. */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/events" className="hover:text-foreground">
          Events
        </Link>
      </nav>
      {children}
    </div>
  );
}
