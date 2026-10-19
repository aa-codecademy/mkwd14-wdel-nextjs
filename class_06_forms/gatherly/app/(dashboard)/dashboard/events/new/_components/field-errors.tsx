/**
 * FieldErrors — the red messages under a field.
 *
 * Next to each wrong field the user sees WHAT is wrong, not just that something is. Zod produced
 * the messages (the `{ error: '...' }` texts in app/actions/events.ts), the Server Action returned
 * them, and this component displays them.
 *
 * Accessibility idea: give each message an id (`title-error`) and point the input's
 * `aria-describedby` at it, so a screen reader reads the error when the field is focused.
 * The ids exist here, but the inputs don't use `aria-describedby` yet. A good improvement.
 */
type FieldErrorsProps = {
  name: string;
  errors: string[];
};

export function FieldErrors({ name, errors }: FieldErrorsProps) {
  return (
    <div>
      {errors.map((error) => (
        // `key={error}`: fine here, since the messages of one field are different strings.
        // `text-destructive` is shadcn's red colour token.
        <p id={`${name}-error`} className="min-h-5 text-sm text-destructive" key={error}>
          {error}
        </p>
      ))}
    </div>
  );
}
