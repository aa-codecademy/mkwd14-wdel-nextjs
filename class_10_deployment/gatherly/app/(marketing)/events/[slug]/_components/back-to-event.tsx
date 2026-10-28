// "← Back to the event" link for the full tickets page. An async Server Component that awaits the `params`
// Promise itself, so its parent can wrap it in <Suspense> instead of waiting for it.
// (`Pick<PageProps<...>, 'params'>` = "just the `params` part of the page props".)
import Link from 'next/link';

export async function BackToEvent({ params }: Pick<PageProps<'/events/[slug]/tickets'>, 'params'>) {
  const { slug } = await params;

  return (
    <Link href={`/events/${slug}`} className="mt-6 inline-block text-brand-500 hover:underline">
      ← Back to the event
    </Link>
  );
}
