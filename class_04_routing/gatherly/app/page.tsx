/**
 * ROUTE: /   — the Gatherly landing page (a "hero" section)
 *
 * The header, footer and page width come from app/layout.tsx. This page only
 * renders what's unique to the home page.
 *
 * The `brand-*` colours and `rounded-card` are NOT built-in Tailwind classes.
 * They come from the design tokens in app/globals.css (`@theme`). If we
 * change a token there, every place that uses it updates.
 */
import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="rounded-card bg-brand-50 px-8 py-16 text-center">
      {/* Mobile-first: text-4xl by default, text-5xl from the `sm` breakpoint (640px) up. */}
      <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
        Find your next event
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
        Conferences, meetups, workshops and concerts. Reserve a ticket in seconds and check in at
        the door with a QR code.
      </p>
      {/*
       * <Link> styled as a button. It's still a link because it NAVIGATES.
       * Use <button> for actions (submit, open a dialog), and links for going
       * to another page.
       */}
      <Link
        className="mt-8 inline-block rounded-card bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-900"
        href="/events"
      >
        Browse events
      </Link>
    </section>
  );
}
