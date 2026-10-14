import type { EventFilters } from '../lib/event-filters';
import Form from 'next/form';
import { Button } from './ui/button';

const fieldClasses = 'h-9 rounded-md border border-border bg-background px-2 text-sm';
const labelClasses = 'flex flex-col gap-1 text-sm';

type FilterFormProps = {
  filters: EventFilters;
  cities: string[];
};

export function FilterForm({ filters, cities }: FilterFormProps) {
  return (
    <Form action="/events" className="flex flex-wrap items-end gap-3">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.category && <input type="hidden" name="category" value={filters.category} />}

      <label className={labelClasses}>
        City
        <select name="city" defaultValue={filters.city} className={fieldClasses}>
          <option value="">Anywhere</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClasses}>
        From
        <input type="date" name="from" defaultValue={filters.from ?? ''} className={fieldClasses} />
      </label>

      <label className={labelClasses}>
        Sort by
        <select name="sort" defaultValue={filters.sort} className={fieldClasses}>
          <option value="date">Soonest</option>
          <option value="price">Cheapest</option>
          <option value="newest">Recently added</option>
        </select>
      </label>

      <Button type="submit" size="lg">
        Apply
      </Button>
    </Form>
  );
}
