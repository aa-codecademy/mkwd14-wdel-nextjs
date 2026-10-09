import Image from 'next/image';

type EventCoverProps = {
  src: string | null;
  alt: string;
  sizes: string;
  preload?: boolean;
};

export function EventCover({ src, alt = '', sizes = '', preload = false }: EventCoverProps) {
  if (!src) return <div className="absolute inset-0 bg-brand-50" />;

  return (
    <Image src={src} alt={alt} fill preload={preload} sizes={sizes} className="object-cover" />
  );
}
