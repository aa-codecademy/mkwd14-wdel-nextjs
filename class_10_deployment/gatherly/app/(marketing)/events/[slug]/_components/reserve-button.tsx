/**
 * ReserveButton — "N left" + a Reserve button, with an OPTIMISTIC update.
 *
 * A CLIENT component (it has state and an onClick). It calls the Server Action reserveTicket.
 *
 * THE PROBLEM: a server round trip takes a moment. If "5 left" only changes after the server answers,
 * the button feels slow. THE IDEA: update the screen IMMEDIATELY, as if it worked ("4 left"), and let
 * the real answer correct it. That's an OPTIMISTIC UPDATE.
 *
 *   click ──► show "4 left" right away ──► server runs reserveTicket ──► page data refreshes
 *                                              │
 *                                  success: the real number is also 4, nothing visibly changes
 *                                  failure: the optimistic value is dropped, and "5 left" returns
 *
 * The three hooks that make it work:
 *   useOptimistic(value, reducer)  -> [optimisticValue, addOptimistic]: a TEMPORARY copy of `remaining`.
 *                                     It shows the guess while a transition is running, and falls back
 *                                     to the real prop when the transition ends.
 *   useTransition()                -> [isPending, startTransition]: marks async work as a "transition" and
 *                                     tells us while it runs. Optimistic values only live inside one.
 *   useState                       -> the message ("Reserved", "Sold out") and the sign-in flag.
 */
'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Button } from '../../../../../components/ui/button';
import { usePathname } from 'next/navigation';
import { reserveTicket } from '../../../../actions/tickets';
import Link from 'next/link';

type ReserveButtonProps = {
  ticketTypeId: string;
  remaining: number;
};

// `remaining` comes from the SERVER (db/queries/tickets.ts) as a prop. It's the truth.
export function ReserveButton({ ticketTypeId, remaining }: ReserveButtonProps) {
  // `optimisticRemaining` starts equal to `remaining`. `reserveOne(1)` applies the reducer below
  // ("subtract 1") on top of it, until the transition ends.
  const [optimisticRemaining, reserveOne] = useOptimistic(
    remaining,
    (current: number, seats: number) => current - seats,
  );

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);

  // The current path, e.g. "/events/nextjs-conf": where to come back to after signing in.
  const pathname = usePathname();

  // Based on the OPTIMISTIC number: after the last seat is clicked, the button shows "Sold out" at once.
  const soldOut = optimisticRemaining <= 0;

  function reserve() {
    setMessage('');
    // An ASYNC transition (React 19). Everything inside counts as one transition: `isPending` is true
    // until the awaited action finishes, and the optimistic value lives exactly that long.
    startTransition(async () => {
      // 1. Show the guess immediately.
      reserveOne(1);
      // 2. Ask the server. It may say no (sold out, not signed in, ...).
      const result = await reserveTicket(ticketTypeId);
      // 3. Show the outcome. If it failed, the transition ends, the optimistic subtraction disappears
      //    and `remaining` (the real number) is shown again: the rollback needs no code of ours.
      setMessage(result.ok ? 'Reserved' : result.error);
      setNeedsSignIn(!result.ok && result.signIn === true);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {/* The count the user sees is the optimistic one. */}
      <span className="w-20 text-right text-sm text-muted-foreground">
        {soldOut ? 'Sold out' : `${optimisticRemaining} left`}
      </span>
      {/* Disabled while the action runs: no double clicks (and so no accidental second ticket). */}
      <Button disabled={isPending} onClick={reserve}>
        {isPending ? 'Reserving...' : 'Reserve'}
      </Button>

      {/* aria-live="polite": a screen reader announces the message when it changes. */}
      <span className="w-32 text-sm" aria-live="polite">
        {needsSignIn ? (
          // The same `?next=` return mechanism as the proxy and requireUser use (see safe-next.ts).
          <Link
            href={`/sign-in?next=${encodeURIComponent(pathname)}`}
            className="text-brand-500 underline"
          >
            Sign in to reserve
          </Link>
        ) : (
          message
        )}
      </span>
    </div>
  );
}
