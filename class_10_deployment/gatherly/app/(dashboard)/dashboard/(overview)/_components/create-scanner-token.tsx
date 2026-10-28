'use client';

/**
 * CreateScannerToken: the form that creates an API token for a check-in device.
 *
 * A CLIENT Component ('use client' above) because it uses a hook. `useActionState(action, initial)`
 * wires a Server Action to a form and gives back:
 *   state      -> whatever the action returned last time ({} at first)
 *   formAction -> what we pass to <form action>; React calls the Server Action with (previousState, formData)
 *
 * The action (app/actions/api-tokens.ts) returns either { error } or { token }. This is the ONE moment the
 * plain token exists: the server stores only a hash, so after this render it is gone for good. That's
 * why the box says "Copy this now". It lives in React state, so reloading the page makes it disappear.
 */
import { useActionState } from 'react';
import { Input } from '../../../../../components/ui/input';
import { SubmitButton } from '../../../../../components/submit-button';
import { createScannerToken } from '../../../../actions/api-tokens';

export default function CreateScannerToken() {
  // `{}` is the initial state: no token and no error yet.
  const [state, formAction] = useActionState(createScannerToken, {});

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex gap-2">
        <Input name="label" placeholder="Front door tablet" aria-label="Token label" />
        {/* SubmitButton reads the form's pending state (useFormStatus) to disable itself, preventing a double submit. */}
        <SubmitButton pendingText="Creating...">Create</SubmitButton>
      </form>
      {/* Show only one of these, depending on what the action returned. */}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.token && (
        <div className="rounded-card border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium">Copy this now — it won&apos;t be shown again:</p>
          {/* `break-all` because a 43+ character token has no spaces to wrap on. React escapes it, so it is safe to print. */}
          <code className="mt-1 block font-mono break-all">{state.token}</code>
        </div>
      )}
    </div>
  );
}
