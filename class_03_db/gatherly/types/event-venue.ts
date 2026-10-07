// The place where an event happens. Several events can share one venue.
export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
};
