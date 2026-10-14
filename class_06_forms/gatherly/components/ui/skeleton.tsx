/**
 * shadcn/ui Skeleton — added in class 06 with `npx shadcn@latest add skeleton`.
 *
 * A grey, softly pulsing box (`animate-pulse` is a Tailwind animation, `bg-muted` the theme's
 * grey) that stands in for content while it loads. You size it with `className`, e.g.
 * `<Skeleton className="h-5 w-3/4" />` is a line of text that's 75% wide.
 * It's a plain <div>, so there's no 'use client' and it can be used in Server Components.
 */
import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
