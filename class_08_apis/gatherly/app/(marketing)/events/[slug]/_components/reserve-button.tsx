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

export function ReserveButton({ ticketTypeId, remaining }: ReserveButtonProps) {
  const [optimisticRemaining, reserveOne] = useOptimistic(
    remaining,
    (current: number, seats: number) => current - seats,
  );

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const pathname = usePathname();

  const soldOut = optimisticRemaining <= 0;

  function reserve() {
    setMessage('');
    startTransition(async () => {
      reserveOne(1);
      const result = await reserveTicket(ticketTypeId);
      setMessage(result.ok ? 'Reserved' : result.error);
      setNeedsSignIn(!result.ok && result.signIn === true);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-sm text-muted-foreground">
        {soldOut ? 'Sold out' : `${optimisticRemaining} left`}
      </span>
      <Button disabled={isPending} onClick={reserve}>
        {isPending ? 'Reserving...' : 'Reserve'}
      </Button>

      <span className="w-32 text-sm" aria-live="polite">
        {needsSignIn ? (
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
