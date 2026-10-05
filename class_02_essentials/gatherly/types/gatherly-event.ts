import type { Category } from './event-category';
import type { Organizer } from './event-organizer';
import type { EventStatus } from './event-status';
import type { Venue } from './event-venue';

export type GatherlyEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  startsAt: Date;
  endsAt: Date;
  status: EventStatus;
  city: string;
  minPriceCents: number;
  venue: Venue;
  categories: Category[];
  organizer: Organizer;
};
