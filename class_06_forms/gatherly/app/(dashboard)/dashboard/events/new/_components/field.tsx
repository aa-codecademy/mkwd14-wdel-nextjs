import type { ReactNode } from 'react';
import { FieldErrors } from './field-errors';

type FieldProps = {
  label: string;
  name: string;
  errors?: string[];
  children: ReactNode;
};

export function Field({ label, name, errors, children }: FieldProps) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      {children}
      {errors?.length && <FieldErrors name={name} errors={errors} />}
    </div>
  );
}
