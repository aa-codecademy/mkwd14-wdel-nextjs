/**
 * FavouriteButton — a heart that toggles on click. Our first Client Component
 * INSIDE the event cards.
 *
 * The rest of the card is a Server Component. Only this tiny button needs the
 * browser (state + click), so only this file is marked 'use client'. The
 * "interactive leaf" pattern: keep the 'use client' boundary as low as
 * possible so the page ships as little JavaScript as possible.
 *
 * Note: the state lives in the browser only. Refresh and the heart is empty
 * again. Saving favourites for real needs a database (class 03) and a Server
 * Action (later).
 */
'use client';

// lucide-react: the icon set shadcn chose (see `iconLibrary` in components.json).
// Each icon is a React component, and you size and colour it with Tailwind classes.
import { HeartIcon } from 'lucide-react';
// The shadcn Button. The file lives in OUR project (components/ui/button.tsx).
import { Button } from './ui/button';
import { useState } from 'react';
import { cn } from 'cn';

export function FavouriteButton() {
  // Updater form `(isFav) => !isFav` always flips the LATEST value.
  const [isFavourite, setIsFavourite] = useState(false);

  return (
    <Button
      // `variant` and `size` are props defined in button.tsx (see buttonVariants).
      // `className` is merged on top with cn(), so it can override the variant's styles.
      className="border-none bg-transparent"
      variant="outline"
      size="icon"
      onClick={() => setIsFavourite((isFav) => !isFav)}
    >
      {/* cn() adds the red fill only while isFavourite is true. */}
      <HeartIcon className={cn(isFavourite && 'fill-red-500 text-red-500')} />
    </Button>
  );
}
