'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { checkInTicket, type CheckInState } from '../../../../actions/check-in';

export function CheckInForm() {
  const [state, formAction] = useActionState(checkInTicket, {} as CheckInState);

  // React clears the input after each submit — ready for the next attendee.
  return (
    <div className="space-y-4">
      <form action={formAction} className="flex gap-2">
        <Input name="code" aria-label="Ticket code" autoFocus autoComplete="off" />
        <SubmitButton pendingText="Checking…">Check in</SubmitButton>
      </form>
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
