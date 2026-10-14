import Link from 'next/link';
import { Button, buttonVariants } from '../../../components/ui/button';
import { formatEventDate } from '../../../lib/format';
import { Badge } from '../../../components/ui/badge';
import { getOrganizerEvents } from '../../../db/queries/dashboard';

export default async function DashboardPage() {
  const events = await getOrganizerEvents('');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Your events</h1>
          <p className="text-sm text-muted-foreground">Signed in as JohnDoe</p>
        </div>
        <Link href="/dashboard/events/new" className={buttonVariants()}>
          New event
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-border rounded-card border border-border bg-background">
        {events.map((event) => {
          const isPublished = event.status === 'published';

          return (
            <li key={event.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium">
                  {isPublished ? (
                    <Link href={`/events/${event.slug}`} className="hover:underline">
                      {event.title}
                    </Link>
                  ) : (
                    event.title
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatEventDate(event.startsAt)} | {event.city}
                </p>
              </div>
              <Badge variant={isPublished ? 'default' : 'secondary'}>{event.status}</Badge>
              <form action="">
                <Button variant="outline" size="sm" type="submit">
                  {isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
