/**
 * EventGridSkeleton — the loading placeholder for <EventGrid>.
 *
 * It is the fallback of the <Suspense> in app/(marketing)/events/page.tsx. A good skeleton has
 * the SAME SHAPE as what it replaces: the same grid, and per card an image (16:9), a title line
 * and a smaller line. Then nothing jumps around when the real cards arrive ("layout shift").
 *
 * No data, no state: a Server Component.
 */
// `@/` = the project root (alias from tsconfig.json).
import { Skeleton } from '@/components/ui/skeleton';

export function EventGridSkeleton() {
  return (
    // Same grid classes as <EventGrid>. `aria-busy="true"` tells assistive technology that this
    // area is still loading.
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {/* 6 placeholders = PAGE_SIZE in db/queries/events.ts (keep the two numbers in step). */}
      {Array.from({ length: 6 }, (_, i) => (
        // Using the array index as `key` is fine HERE: the list is static and never reordered.
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
