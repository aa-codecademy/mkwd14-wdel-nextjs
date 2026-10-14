import Link from 'next/link';
import type { Category } from '../../../../db/schema';
import { eventsHref, type EventFilters } from '../../../../lib/event-filters';
import { cn } from '../../../../lib/utils';

type CategoryLinksProps = {
  filters: EventFilters;
  categories: Category[];
};

export function CategoryLinks({ filters, categories }: CategoryLinksProps) {
  const options = [{ slug: undefined, name: 'All' }, ...categories];

  return (
    <nav className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = filters.category === option.slug;

        return (
          <Link
            href={eventsHref(filters, { category: option.slug, page: 1 })}
            key={option.slug ?? 'all'}
            className={cn(
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
