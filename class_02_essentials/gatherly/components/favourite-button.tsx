'use client';

import { HeartIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { cn } from 'cn';

export function FavouriteButton() {
  const [isFavourite, setIsFavourite] = useState(false);

  return (
    <Button
      className="border-none bg-transparent"
      variant="outline"
      size="icon"
      onClick={() => setIsFavourite((isFav) => !isFav)}
    >
      <HeartIcon className={cn(isFavourite && 'fill-red-500 text-red-500')} />
    </Button>
  );
}
