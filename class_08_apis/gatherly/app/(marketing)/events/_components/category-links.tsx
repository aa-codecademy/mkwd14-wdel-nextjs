/**
 * CategoryLinks — the "All / Conference / Meetup / ..." pills above the list.
 *
 * Each pill is a plain <Link> to a URL with ?category=<slug>, so this is a SERVER Component with
 * no state or JavaScript. Clicking a pill is just navigation: the URL changes, the server page
 * re-renders. The active pill is the one whose slug equals the current filter.
 *
 * `eventsHref` (lib/event-filters.ts) builds the URL while KEEPING the other filters (search, city,
 * ...). `page: 1` resets pagination, because page 3 of "all" is not page 3 of "meetups".
 */
import Link from 'next/link';
import type { Category } from '../../../../db/schema';
import { eventsHref, type EventFilters } from '../../../../lib/event-filters';
import { cn } from '../../../../lib/utils';

type CategoryLinksProps = {
  filters: EventFilters;
  categories: Category[];
};

// The "All" pill is a fake category with no slug (`undefined`), which means "no category filter".
export function CategoryLinks({ filters, categories }: CategoryLinksProps) {
  // Put "All" first, then every category from the database.
  const options = [{ slug: undefined, name: 'All' }, ...categories];

  return (
    <nav className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = filters.category === option.slug;

        return (
          <Link
            href={eventsHref(filters, { category: option.slug, page: 1 })}
            // `key` must be unique: the slug, or 'all' for the pill that has none.
            key={option.slug ?? 'all'}
            className={cn(
              // cn(base classes, conditional classes): the active pill gets the brand colours.
              'rounded-full border border-border px-3 py-1 text-sm',
              active ? 'border-brand-500 bg-brand-500 text-white' : 'hover:bg-muted',
            )}
          >
            {option.name}
          </Link>
        );
      })}
    </nav>
  );
}
