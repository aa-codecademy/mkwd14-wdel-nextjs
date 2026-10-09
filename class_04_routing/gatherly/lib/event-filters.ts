import z from 'zod';

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const one = <T extends z.ZodType>(schema: T) => z.preprocess(first, schema);

const filterSchema = z.object({
  q: one(z.string().trim().min(1).optional()).catch(undefined),
});

export function parseEventFilters(searchParams: Record<string, string | string[] | undefined>) {
  return filterSchema.parse(searchParams);
}

export type EventFilters = z.infer<typeof filterSchema>;
