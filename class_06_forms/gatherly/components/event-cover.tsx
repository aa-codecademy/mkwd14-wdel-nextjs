/**
 * EventCover — an event's cover image, with a fallback when there is none.
 *
 * `events.coverImageUrl` is NULLABLE in the database (an organizer may not upload an image),
 * so the type is `string | null`. Instead of repeating "if there's no image, show a placeholder"
 * on every page, this component does it once.
 *
 * It must be placed inside a `relative` parent that has a size (see the aspect-ratio wrapper
 * in app/events/[slug]/page.tsx), because both the placeholder and <Image fill> position
 * themselves with `absolute`.
 */
import Image from 'next/image';

// Props are described with a `type`. `?` marks an optional prop.
type EventCoverProps = {
  src: string | null;
  alt: string;
  sizes: string;
  // Pass `preload` for the main image at the top of a page, so the browser fetches it first.
  preload?: boolean;
};

// Default values in the destructuring (`preload = false`) are used when the prop isn't passed.
export function EventCover({ src, alt = '', sizes = '', preload = false }: EventCoverProps) {
  // Early return: no image -> a plain coloured box in the brand colour.
  if (!src) return <div className="absolute inset-0 bg-brand-50" />;

  return (
    <Image src={src} alt={alt} fill preload={preload} sizes={sizes} className="object-cover" />
  );
}
