/**
 * Field — a label + a control + its error messages, so every field in the form looks and
 * behaves the same. It's a small reusable "layout" component.
 *
 * It is a plain Server-compatible component (no state), but it's used inside a Client Component,
 * so it ends up running in the browser too. That's fine: a component with no 'use client' takes
 * on the environment of whoever imports it.
 */
import type { ReactNode } from 'react';
import { FieldErrors } from './field-errors';

// `children` is the actual control (an <Input>, <select>, <textarea>, ...) put between the tags.
type FieldProps = {
  label: string;
  name: string;
  errors?: string[];
  children: ReactNode;
};

export function Field({ label, name, errors, children }: FieldProps) {
  return (
    <div>
      {/* `htmlFor` must equal the control's `id`: that links the label to it (click the label to focus the field, and screen readers read it). */}
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      {children}
      {/*
       * Show the messages only when there are some. Gotcha: `errors?.length && <X />` would render a
       * stray "0" if the array were empty (React prints the number 0). It works today because
       * Zod never gives an empty list. `errors && errors.length > 0 &&` is the safer way to write it.
       */}
      {errors?.length && <FieldErrors name={name} errors={errors} />}
    </div>
  );
}
