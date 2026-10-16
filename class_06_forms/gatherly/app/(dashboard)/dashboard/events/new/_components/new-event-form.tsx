'use client';

import { SubmitButton } from '../../../../../../components/submit-button';
import { Input } from '../../../../../../components/ui/input';
import { Field } from './field';
import { FieldErrors } from './field-errors';
import { createEvent, type CreateEventState } from '../../../../../actions/events';
import { useActionState } from 'react';

const initialState: CreateEventState = {};

type NewEventFormProps = {
  venues: { id: string; name: string; city: string }[];
  categories: {
    id: string;
    name: string;
  }[];
};

export function NewEventForm({ venues, categories }: NewEventFormProps) {
  const [state, formAction, pending] = useActionState(createEvent, initialState);

  return (
    <form action={formAction} className="space-y-5" aria-busy={pending}>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Field label="Title" name="title">
        <Input id="title" name="title" placeholder="Event title" />
      </Field>

      <Field label="Description" name="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
        />
      </Field>

      <Field label="Venue" name="venue">
        <select
          id="venueId"
          name="venueId"
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Choose a venue...
          </option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}, {venue.city}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" name="startsAt">
          <Input id="startsAt" name="startsAt" type="datetime-local" />
        </Field>

        <Field label="Ends" name="endsAt">
          <Input id="endsAt" name="endsAt" type="datetime-local" />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Categories</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="categoryIds" value={category.id} /> {category.name}
            </label>
          ))}
        </div>
        <FieldErrors name="categoryIds" errors={[]} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ticket price (€, 0 for free)" name="price">
          <Input id="price" name="price" type="number" min="0" step="0.01" />
        </Field>

        <Field label="Tickets available" name="quantity">
          <Input id="quantity" name="quantity" type="number" min="1" />
        </Field>
      </div>

      <SubmitButton size="lg" pendingText="Creating event...">
        Create Event
      </SubmitButton>
    </form>
  );
}
