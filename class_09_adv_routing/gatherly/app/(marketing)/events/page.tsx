/**
 * ROUTE: /events   — the list of events, with SEARCH, FILTERS, SORTING and PAGINATION
 *
 * The URL is the single source of truth for everything the user can change:
 *
 *   /events                                  -> all published events, soonest first, page 1
 *   /events?q=next                           -> title contains "next"
 *   /events?category=meetup&city=Skopje      -> only meetups in Skopje
 *   /events?from=2027-03-01&sort=price       -> from that date on, cheapest first
 *   /events?page=2                           -> the second page of 6
 *
 * While the results load, a SKELETON (grey placeholder cards) is shown, thanks to <Suspense>.
 *
 * Four controls change the URL (they all live in ./_components/):
 *   <SearchBox />     text search: a Client Component that writes ?q= (after a short pause)
 *   <CategoryLinks /> "All / Meetup / ..." pills: plain <Link>s, one per category
 *   <FilterForm />    city, date and sort: a real <form> that submits as a GET (see its file)
 *   <Pagination />    Previous / Next links (inside <EventResults />)
 *
 * The flow, step by step:
 *   1. A control changes the URL, e.g. ?category=meetup.
 *   2. Next.js renders THIS page again on the server, now with that searchParams.
 *   3. parseEventFilters() validates and cleans the raw search params (lib/event-filters.ts).
 *   4. <EventResults /> asks the database for the matching page of events and renders the grid.
 *
 * Why keep all this in the URL instead of in React state? The page can be shared and
 * bookmarked, the Back button works, a refresh keeps the results, and the SERVER can read the
 * value, so it fetches only the matching rows.
 *
 * This page uses `searchParams`, so it's rendered per request (dynamic), not once at build time.
 * It's a Server Component; only <SearchBox /> runs in the browser.
 */
// `./_components/` is a PRIVATE FOLDER: a folder starting with an underscore is never a route,
// so `/events/_components/...` doesn't exist as a URL. It keeps the pieces that belong only to
// this page next to it (instead of the global components/ folder).
// The `../../../` paths go up out of `(marketing)/events/` to the project root.
import { CategoryLinks } from './_components/category-links';
import { EventResults } from './_components/event-results';
import { FilterForm } from './_components/filter-form';
import { SearchBox } from './_components/search-box';
import { getFilterOptions } from '../../../db/queries/events';
import { parseEventFilters } from '../../../lib/event-filters';
// NEW in class 06: <Suspense> + a skeleton, so the list can STREAM in. See the notes below.
import { Suspense } from 'react';
import { EventGridSkeleton } from '../../../components/event-grid-skeleton';

// `searchParams` is a Promise (like `params`), so the component is async and awaits it.
// Its raw type is { [key]: string | string[] | undefined }: the same key can appear many times
// (?q=a&q=b), and the user can type anything in the address bar.
export default async function EventsPage({ searchParams }: PageProps<'/events'>) {
  // Never trust the URL: parse it into a clean object, with defaults for anything missing or
  // invalid ({ q?, category?, city?, from?, sort: 'date', page: 1 }).
  const filters = parseEventFilters(await searchParams);
  // The dropdown/pill options come from the database too (cities and categories that exist).
  const { cities, categories } = await getFilterOptions();

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-900">Upcoming events</h1>
      {/*
       * `text-muted-foreground` (softer grey text) is a shadcn/ui colour token.
       * It works now because `shadcn init` added `--color-muted-foreground` to
       * app/globals.css. Before shadcn it silently did nothing.
       */}
      <p className="mt-1 mb-8 text-muted-foreground">Everything happening on Gatherly.</p>

      <div className="mb-8 space-y-4">
        {/* Client Component: needs the browser (typing, router). Everything else here stays on the server. */}
        <SearchBox />
        {/* These two are Server Components too: no JavaScript is sent to the browser for them. */}
        <CategoryLinks filters={filters} categories={categories} />
        <FilterForm filters={filters} cities={cities} />
      </div>

      {/*
       * STREAMING with <Suspense> (see class 02, /streaming). <EventResults> awaits the database,
       * so it "suspends". Everything outside this boundary (the heading, the search box, the
       * filters) is sent to the browser right away, the <EventGridSkeleton> shows in the
       * gap, and the real grid is streamed in when its query finishes.
       *
       * Why `key={JSON.stringify(filters)}`? A Suspense boundary shows its fallback only the FIRST
       * time. When the user changes a filter, React would keep showing the OLD results until the new
       * ones are ready, with no sign that anything is loading. A `key` that changes with the
       * filters tells React "this is a NEW boundary", so the skeleton appears for every search,
       * filter or page change.
       *
       * Server Component that queries the database. We pass the CLEAN filters, not the raw URL.
       */}
      <Suspense key={JSON.stringify(filters)} fallback={<EventGridSkeleton />}>
        <EventResults filters={filters} />
      </Suspense>
    </div>
  );
}
