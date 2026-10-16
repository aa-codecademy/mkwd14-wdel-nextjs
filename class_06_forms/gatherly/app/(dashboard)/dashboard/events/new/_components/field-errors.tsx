type FieldErrorsProps = {
  name: string;
  errors: string[];
};

export function FieldErrors({ name, errors }: FieldErrorsProps) {
  return (
    <div>
      {errors.map((error) => (
        <p id={`${name}-error`} className="min-h-5 text-sm text-destructive" key={error}>
          {error}
        </p>
      ))}
    </div>
  );
}
