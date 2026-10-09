import Link from 'next/link';

export default function EventNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">No such event.</h1>
      <p className="mt-2 text-muted-foreground">Event can not be found.</p>
      <Link href="/events" className="mt-6 inline-block text-brand-500 hover:underline">
        Browse all events
      </Link>
    </div>
  );
}
