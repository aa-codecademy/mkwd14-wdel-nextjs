/**
 * loading.tsx of this SLOT — the skeleton shown while this panel's page.tsx is still fetching.
 *
 * Next.js wraps the slot's page in a <Suspense> with this file as the fallback, automatically. So
 * each panel streams in on its own: the stats can appear while the orders are still loading. The
 * skeleton has a fixed height (h-32) close to the real panel's, to avoid the page jumping.
 */
import { Skeleton } from '../../../../../components/ui/skeleton';

export default function Loading() {
  return <Skeleton className="h-32 w-full rounded-card" />;
}
