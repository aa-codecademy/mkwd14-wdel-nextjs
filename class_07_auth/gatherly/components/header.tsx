/**
 * Site header — rendered once in app/layout.tsx, so it shows on every page.
 *
 * A Server Component that only shows links. The one interactive piece, <AccountMenu />, is a Client
 * Component INSIDE it: a server component can render client components, and only that small part
 * ships JavaScript to the browser.
 *
 * Named export (`export function Header`) instead of a default export.
 * Only Next.js special files (page, layout, error, ...) need `export default`.
 */
import Link from 'next/link';
import { AccountMenu } from './account-menu';

export function Header() {
  return (
    <header className="border-b border-gray-200">
      {/* Same `max-w-5xl mx-auto px-4` as <main>, so the header lines up with the page content. */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        {/* The logo links home. <Link> navigates on the client, without a full reload. */}
        <Link href="/" className="text-xl font-bold text-brand-900">
          Gatherly
        </Link>
        {/* <nav> tells screen readers "this is the main navigation". */}
        {/* Events and About for everyone. <AccountMenu> adds Sign in, or the user's name, Dashboard (organizers) and Sign out. */}
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/events" className="hover:text-brand-500">
            Events
          </Link>
          <Link href="/about" className="hover:text-brand-500">
            About
          </Link>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
