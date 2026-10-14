import Link from 'next/link';
import { eventsHref, type EventFilters } from '../lib/event-filters';

const link = 'rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted';

type PaginationProps = {
  filters: EventFilters;
  pageCount: number;
};

export function Pagination({ filters, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null;

  const { page } = filters;

  return (
    <nav className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={eventsHref(filters, { page: page - 1 })} className={link}>
          ← Previous
        </Link>
      ) : (
        <span className="w-24" />
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={eventsHref(filters, { page: page + 1 })} className={link}>
          Next →
        </Link>
      ) : (
        <span className="w-24" />
      )}
    </nav>
  );
}
