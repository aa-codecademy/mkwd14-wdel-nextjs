import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="rounded-card bg-brand-50 px-8 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
        Find your next event
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
        Conferences, meetups, workshops and concerts. Reserve a ticket in seconds and check in at
        the door with a QR code.
      </p>
      <Link
        className="mt-8 inline-block rounded-card bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-900"
        href="/events"
      >
        Browse events
      </Link>
    </section>
  );
}
