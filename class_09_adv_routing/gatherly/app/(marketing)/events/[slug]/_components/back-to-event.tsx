import Link from 'next/link';

export async function BackToEvent({ params }: Pick<PageProps<'/events/[slug]/tickets'>, 'params'>) {
  const { slug } = await params;

  return (
    <Link href={`/events/${slug}`} className="mt-6 inline-block text-brand-500 hover:underline">
      ← Back to the event
    </Link>
  );
}
