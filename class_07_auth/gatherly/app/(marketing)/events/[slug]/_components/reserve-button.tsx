'use client';

import { useTransition } from 'react';
import { Button } from '../../../../../components/ui/button';

type ReserveButtonProps = {
  ticketTypeId: string;
  remaining: number;
};

export function ReserveButton({}: ReserveButtonProps) {
  const [isPending, startTransition] = useTransition();

  const soldOut = false;

  function reserve() {
    startTransition(async () => {});
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-sm text-muted-foreground">
        {soldOut ? 'Sold out' : '10 left'}
      </span>
      <Button disabled={isPending}>{isPending ? 'Reserving...' : 'Reserve'}</Button>
    </div>
  );
}
