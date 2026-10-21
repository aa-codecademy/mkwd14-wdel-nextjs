/**
 * Pagination — "← Previous   Page 2 of 5   Next →".
 *
 * Each link points at the same /events URL with a different `page`, built by `eventsHref`,
 * which keeps the current search, category, city, date and sort. The page number is just
 * another URL param, so every page of results has its own address (shareable, Back works).
 *
 * A Server Component: no state, only links.
 */
import Link from 'next/link';
import { eventsHref, type EventFilters } from '../../../../lib/event-filters';

// Shared classes for the two links.
const link = 'rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted';

type PaginationProps = {
  filters: EventFilters;
  pageCount: number;
};

export function Pagination({ filters, pageCount }: PaginationProps) {
  // One page or none: don't render any controls.
  if (pageCount <= 1) return null;

  const { page } = filters;

  return (
    <nav className="mt-8 flex items-center justify-center gap-4">
      {/* On the first page there's no "Previous": an empty <span> of the same width keeps the layout steady. */}
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
