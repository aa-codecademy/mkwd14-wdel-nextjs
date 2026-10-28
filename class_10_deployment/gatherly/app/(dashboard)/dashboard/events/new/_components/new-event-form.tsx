/**
 * NewEventForm — the form, connected to the Server Action with `useActionState`.
 *
 * Why a CLIENT component? `useActionState` is a React hook, and hooks only work in Client
 * Components. (The <form> itself would also work as a Server Component. The hook is what lets us
 * SHOW the action's result: errors, and the pending state.)
 *
 * HOW THE PIECES FIT, step by step:
 *   1. `useActionState(createEvent, initialState)` wraps our Server Action and gives us:
 *        state       -> what the action last RETURNED (the errors and the values)
 *        formAction  -> the function to put in <form action={...}>
 *        pending     -> true while the action is running
 *   2. The user presses submit. React collects the fields into a FormData and calls the action
 *      on the server: createEvent(previousState, formData).
 *   3. If validation fails, the action RETURNS { errors, values }. React stores it as the new
 *      `state` and re-renders this component. Each <Field> shows its errors, and every input
 *      starts from the value the user typed (`defaultValue`).
 *   4. If it succeeds, the action calls redirect() and the browser goes to /dashboard.
 *
 * Because it's a real <form> with an `action`, it also works before the JavaScript has loaded.
 * That's called progressive enhancement.
 */
'use client';

// The submit button lives in its own component, see the comment in that file for why.
import { SubmitButton } from '../../../../../../components/submit-button';
import { Input } from '../../../../../../components/ui/input';
import { Field } from './field';
import { FieldErrors } from './field-errors';
// Importing a Server Action into a Client Component is allowed: the import becomes a reference to
// an endpoint, and none of the server code is sent to the browser.
import { createEvent, type CreateEventState } from '../../../../../actions/events';
// useActionState comes from 'react' (older tutorials use `useFormState` from 'react-dom', renamed).
import { useActionState } from 'react';

// The state before the first submit: no errors, no values.
const initialState: CreateEventState = {};

type NewEventFormProps = {
  venues: { id: string; name: string; city: string }[];
  categories: {
    id: string;
    name: string;
  }[];
};

export function NewEventForm({ venues, categories }: NewEventFormProps) {
  // [current state, the function for <form action>, is-it-running?]
  const [state, formAction, pending] = useActionState(createEvent, initialState);

  // A small helper: "what did the user type in this field last time?" (or `undefined` at first).
  // Values are `string | string[]`, and a text input needs a string, hence the check.
  const value = (name: keyof NonNullable<CreateEventState['values']>) => {
    const v = state.values?.[name];
    return typeof v === 'string' ? v : undefined;
  };

  // The checkboxes that were ticked: an array of category ids.
  const selectedCategories = state.values?.categoryIds ?? [];

  return (
    // `action={formAction}` is the whole connection: submitting this form runs the Server Action.
    // No onSubmit, no fetch, no preventDefault. `aria-busy` tells assistive technology it's working.
    <form action={formAction} className="space-y-5" aria-busy={pending}>
      {/* A message about the whole form (not about one field). */}
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Field label="Title" name="title" errors={state.errors?.title}>
        {/*
         * `name` is the key in the FormData ("title"), and it must match the schema's field name.
         * `id` + the label's `htmlFor` (inside <Field>) connect the label to the input.
         * `defaultValue` (not `value`): the input is UNCONTROLLED. The browser owns the text while
         * the user types, and after a failed submit it starts from what they typed before.
         * React clears an uncontrolled form after its action runs, which is why we send the
         * values back from the action and use them here.
         */}
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

      {/*
       * Heads-up: this <Field> is named "venue", but the select's id is "venueId" and the errors
       * come from `venueId`. The label's `htmlFor` ("venue") therefore doesn't match the select's
       * id, so clicking the label won't focus the select. The `name` given to <Field> should equal
       * the control's `id`.
       *
       * Another gotcha: after a failed submit React may restore the option the <select> started
       * with instead of the one the user chose. A `key` that changes with the value
       * (`key={value('venueId')}`) makes React rebuild the element and fixes it.
       */}
      <Field label="Venue" name="venue" errors={state.errors?.venueId}>
        <select
          id="venueId"
          name="venueId"
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
          defaultValue={value('venueId')}
        >
          {/* `disabled` + empty value: a hint that can't be picked, so "no venue" fails validation. */}
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
            // type="datetime-local" = a native date and time picker. It submits "2027-03-12T09:00".
            type="datetime-local"
            defaultValue={value('startsAt')}
          />
        </Field>

        <Field label="Ends" name="endsAt" errors={state.errors?.endsAt}>
          <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={value('endsAt')} />
        </Field>
      </div>

      {/*
       * Checkboxes with the SAME name (`categoryIds`) send one entry each, and the action reads them
       * with `formData.getAll('categoryIds')`. <fieldset> + <legend> group related controls, and
       * screen readers announce the group name. Only ticked boxes are submitted.
       */}
      <fieldset>
        <legend className="text-sm font-medium">Categories</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                // `value` is what gets submitted when ticked: the category's id, not its name.
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
            // `min` and `step` only guide the browser UI (and can be bypassed). The REAL rules are
            // in the Zod schema on the server.
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

      {/* A submit button that disables itself and changes its text while the action runs. */}
      <SubmitButton size="lg" pendingText="Creating event...">
        Create Event
      </SubmitButton>
    </form>
  );
}
