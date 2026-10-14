/**
 * FilterForm — city, "from" date and sort order, as a real HTML <form>.
 *
 * Next.js's <Form> (from 'next/form') is a <form> that, for a GET form like this one, turns
 * submitting into a client-side NAVIGATION to `/events?city=...&from=...&sort=...`: no full page
 * reload, shared layouts stay mounted, and it works even without JavaScript. The fields' `name`s
 * become the query-string keys, so `name="city"` -> `?city=...`.
 *
 * Compare with <SearchBox>: that one needs a Client Component (to react while typing). This form
 * needs NO client JavaScript of its own, because nothing happens until the user presses "Apply".
 * This is a Server Component. Prefer the simplest tool that works.
 */
import type { EventFilters } from '../../../../lib/event-filters';
// <Form> from 'next/form': a <form> that navigates like a <Link> when it's submitted with GET.
import Form from 'next/form';
import { Button } from '../../../../components/ui/button';

// Shared Tailwind classes, so the fields look the same.
const fieldClasses = 'h-9 rounded-md border border-border bg-background px-2 text-sm';
const labelClasses = 'flex flex-col gap-1 text-sm';

type FilterFormProps = {
  filters: EventFilters;
  cities: string[];
};

export function FilterForm({ filters, cities }: FilterFormProps) {
  return (
    // `action` is the URL to navigate to. The form fields are appended as ?name=value.
    <Form action="/events" className="flex flex-wrap items-end gap-3">
      {/*
       * A GET form REPLACES the whole query string with just its own fields. To keep the search
       * text and the category when the user applies the city/date/sort, we send them along as
       * HIDDEN inputs. (`page` is left out on purpose: a new filter should start on page 1.)
       */}
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.category && <input type="hidden" name="category" value={filters.category} />}

      {/* Wrapping the control in its <label> connects them: clicking the text focuses the field, and screen readers announce it. */}
      <label className={labelClasses}>
        City
        {/* `defaultValue` (uncontrolled): shows the current filter, and the browser handles changes. */}
        <select name="city" defaultValue={filters.city} className={fieldClasses}>
          {/* An empty value = "no city filter". parseEventFilters turns the empty string into `undefined`. */}
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
        {/* type="date" gives a native date picker and submits as YYYY-MM-DD (z.iso.date() in the schema). */}
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

      {/* A shadcn Button used as a normal submit button. */}
      <Button type="submit" size="lg">
        Apply
      </Button>
    </Form>
  );
}
