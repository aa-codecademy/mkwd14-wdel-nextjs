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

  const value = (name: keyof NonNullable<CreateEventState['values']>) => {
    const v = state.values?.[name];
    return typeof v === 'string' ? v : undefined;
  };

  const selectedCategories = state.values?.categoryIds ?? [];

  return (
    <form action={formAction} className="space-y-5" aria-busy={pending}>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Field label="Title" name="title" errors={state.errors?.title}>
        <Input id="title" name="title" placeholder="Event title" defaultValue={value('title')} />
      </Field>

      <Field label="Description" name="description" errors={state.errors?.description}>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={value('description')}
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
        />
      </Field>

      <Field label="Venue" name="venue" errors={state.errors?.venueId}>
        <select
          id="venueId"
          name="venueId"
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          defaultValue={value('venueId')}
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
        <Field label="Starts" name="startsAt" errors={state.errors?.startsAt}>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={value('startsAt')}
          />
        </Field>

        <Field label="Ends" name="endsAt" errors={state.errors?.endsAt}>
          <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={value('endsAt')} />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Categories</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={selectedCategories.includes(category.id)}
              />{' '}
              {category.name}
            </label>
          ))}
        </div>
        {state.errors?.categoryIds && (
          <FieldErrors name="categoryIds" errors={state.errors.categoryIds} />
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ticket price (€, 0 for free)" name="price" errors={state.errors?.price}>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={value('price')}
          />
        </Field>

        <Field label="Tickets available" name="quantity" errors={state.errors?.quantity}>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            defaultValue={value('quantity')}
          />
        </Field>
      </div>

      <SubmitButton size="lg" pendingText="Creating event...">
        Create Event
      </SubmitButton>
    </form>
  );
}
