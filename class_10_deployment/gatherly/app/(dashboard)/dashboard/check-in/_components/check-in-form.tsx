'use client';

/**
 * CheckInForm: one input and a button. The organizer types a ticket code, the Server Action decides.
 *
 * A CLIENT Component ('use client') because of `useActionState`: it hands us the last RESULT of the action
 * ({ ok } or { error }) so we can show a green or red message without writing any fetch() code.
 * Hiding this form for non-organizers is only convenience: the real check is in checkInTicket (a Server
 * Action is a public endpoint, anyone can call it directly).
 */
import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { checkInTicket, type CheckInState } from '../../../../actions/check-in';

export function CheckInForm() {
  // `{} as CheckInState`: the initial state is empty (no message yet), cast so TypeScript knows its shape.
  const [state, formAction] = useActionState(checkInTicket, {} as CheckInState);

  // React clears the input after each submit — ready for the next attendee.
  return (
    <div className="space-y-4">
      <form action={formAction} className="flex gap-2">
        {/* `name="code"` is the key the action reads with formData.get('code'). autoFocus + autoComplete="off"
            keep the keyboard ready for the next scan and stop the browser from suggesting old codes. */}
        <Input name="code" aria-label="Ticket code" autoFocus autoComplete="off" />
        <SubmitButton pendingText="Checking…">Check in</SubmitButton>
      </form>
      {/* aria-live="polite": screen readers announce the result when it changes, without interrupting. */}
      <div aria-live="polite">
        {state.ok && (
          <p className="rounded-card border border-green-300 bg-green-50 p-3 text-sm text-green-900">
            ✓ Welcome in: {state.ok}
          </p>
        )}
        {state.error && (
          <p className="rounded-card border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            ✗ {state.error}
          </p>
        )}
      </div>
    </div>
  );
}
