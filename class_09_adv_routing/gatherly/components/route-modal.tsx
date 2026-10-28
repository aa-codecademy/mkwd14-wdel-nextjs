/**
 * RouteModal — a dialog whose OPEN STATE is the URL.
 *
 * A normal modal is `useState(false)` plus an `open` flag. A ROUTE modal has no state: it is open exactly when
 * the intercepting route is rendered (see app/(marketing)/@modal/(.)events/[slug]/tickets/page.tsx). That
 * means the URL is shareable, and the browser's Back button closes it, for free.
 *
 * Closing: when the user presses Escape, clicks the overlay or the X, the dialog asks to close
 * (`onOpenChange(false)`), and we answer with `router.back()`: go back to the previous URL. The
 * intercepting route no longer matches, `@modal` falls back to null, and the modal disappears.
 *
 * The Dialog (components/ui/dialog.tsx, from shadcn, built on Base UI) takes care of the accessibility:
 * focus is moved into the dialog and trapped there, Escape closes it, and the page behind is inert.
 * A client component: it uses a hook and handles events.
 */
'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import type { ReactNode } from 'react';

type RouteModalProps = {
  title: string;
  children: ReactNode;
};

export function RouteModal({ title, children }: RouteModalProps) {
  const router = useRouter();

  return (
    // `open` with no value = always open while this component is rendered. `onOpenChange` fires with the NEW
    // state: `!open && router.back()` means "if it's closing, navigate back".
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent className="sm:max-w-xl">
        {/* Every dialog needs a title: screen readers announce it when the dialog opens. */}
        <DialogTitle>{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
