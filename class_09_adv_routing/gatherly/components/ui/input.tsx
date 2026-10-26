/**
 * shadcn/ui Input — added in class 04 with `npx shadcn@latest add input` for the search box.
 * Same recipe as button.tsx: a Base UI primitive (accessible behaviour) + Tailwind classes,
 * merged with the caller's `className` by cn(). The long class list covers the states:
 * focus ring, disabled, invalid (`aria-invalid`), placeholder colour and dark mode.
 *
 * It takes all the normal <input> props (`type`, `name`, `defaultValue`, `onChange`, ...),
 * which is why <SearchBox> can use it like a regular input.
 */
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
