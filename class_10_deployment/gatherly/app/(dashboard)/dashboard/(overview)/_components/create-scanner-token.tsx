'use client';

import { useActionState } from 'react';
import { Input } from '../../../../../components/ui/input';
import { SubmitButton } from '../../../../../components/submit-button';
import { createScannerToken } from '../../../../actions/api-tokens';

export default function CreateScannerToken() {
  const [state, formAction] = useActionState(createScannerToken, {});

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex gap-2">
        <Input name="label" placeholder="Front door tablet" aria-label="Token label" />
        <SubmitButton pendingText="Creating...">Create</SubmitButton>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.token && (
        <div className="rounded-card border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium">Copy this now — it won&apos;t be shown again:</p>
          <code className="mt-1 block font-mono break-all">{state.token}</code>
        </div>
      )}
    </div>
  );
}
