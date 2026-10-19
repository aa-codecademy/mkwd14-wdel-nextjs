/**
 * ROUTE: /about   — a plain static page.
 *
 * It lives in the (marketing) group, so it gets the site header and footer from
 * app/(marketing)/layout.tsx. It uses no database, cookies or search params, so Next.js
 * prerenders it ONCE at build time (○ Static in the `npm run build` output).
 * `max-w-prose` limits the line length to a comfortable reading width.
 */
export default function AboutPage() {
  return (
    <article className="max-w-prose space-y-4">
      <h1 className="text-3xl font-bold text-brand-900">About Gatherly</h1>
      <p className="text-lg">
        Gatherly helps organizers publish conferences, meetups, workshops and concerts, and helps
        attendees find them, reserve a ticket and check in at the door with a QR code.
      </p>
      <p className="text-muted-foreground">
        It is built step by step during the Avenga Academy Next.js elective — one feature per class.
      </p>
    </article>
  );
}
