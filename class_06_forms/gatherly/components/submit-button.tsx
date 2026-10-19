/**
 * SubmitButton — a submit button that knows when its form is being submitted.
 *
 * `useFormStatus()` (from 'react-dom') reports the status of the NEAREST PARENT <form>:
 * `pending` is true from the moment the form is submitted until the Server Action finishes.
 * We use it to disable the button, which PREVENTS DOUBLE SUBMITS (two clicks = two events),
 * and to show "Creating event..." so the user knows something is happening.
 *
 * ⚠️ Two rules for useFormStatus:
 *   1. It must be called in a component rendered INSIDE the <form>, not in the component that
 *      renders the <form> itself. That's why this is a separate component, and the reason it
 *      isn't just written inline in new-event-form.tsx. (There the form's own `pending` comes
 *      from useActionState instead.)
 *   2. It's a hook, so it needs a Client Component. This file has no 'use client' line, and it
 *      works only because it's imported from a file that has one. Adding 'use client' at the top
 *      here would make that explicit and safer if someone imports it from a Server Component.
 */
// Note: useFormStatus comes from 'react-dom', while useActionState comes from 'react'.
import { useFormStatus } from 'react-dom';
import { Button } from './ui/button';
import type { ComponentProps } from 'react';

// `ComponentProps<typeof Button>` = every prop a <Button> accepts (variant, size, ...), plus our own
// `pendingText`. `...props` passes the rest on to the Button, so <SubmitButton size="lg"> works.
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<typeof Button> & { pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    // `type="submit"`: pressing it (or Enter in a field) submits the form it's inside.
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
