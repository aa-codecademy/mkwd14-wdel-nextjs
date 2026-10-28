/**
 * SERVER ACTIONS for events — code that runs ON THE SERVER when a form is submitted.
 *
 * THE BIG IDEA. Until now a page only READ data. To CHANGE data (create an event) we need:
 *   1. a <form> in the browser,
 *   2. code on the server that receives the form data, checks it, and writes to the database.
 * Before Server Actions you had to build an API route (`/api/events`), write a `fetch()` call, and
 * wire both together by hand. A Server Action is just an `async` function marked "use server":
 * you pass it to `<form action={...}>`, and Next.js does the networking for you.
 *
 *   browser                                   server
 *   ───────                                   ──────
 *   <form action={formAction}>   ── POST ──►  createEvent(prevState, formData)
 *   user presses "Create Event"                 1. read the form data
 *                                               2. validate it with Zod
 *                                               3. save it in PostgreSQL
 *   page updates                 ◄─ result ──   4. redirect, or return the errors
 *
 * RULES FOR THIS FILE
 * - `'use server'` (the first line) makes EVERY exported function a Server Action. So every export
 *   must be an `async` function. (Exporting TYPES is fine, they disappear when compiled.)
 * - ⚠️ A Server Action is a PUBLIC HTTP ENDPOINT. Anybody can call it with any data, not only
 *   through our form (for example with curl, or with DevTools). So the function must NEVER
 *   trust its input: validate everything, and check who is calling. The `required` and `min`
 *   attributes on the inputs are just a convenience for the user, not security.
 * - The order inside an action is always: authenticate -> validate -> authorize -> change data ->
 *   revalidate -> redirect or return. You'll find each step marked below.
 */
'use server';
import { z } from 'zod';
// `db` is marked `server-only`. That's fine here: this file only ever runs on the server.
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { eventCategories, events, ticketTypes, venues } from '../../db/schema';
// The real session now (class 9): the demo-user file is gone. `getCurrentUser()` returns the signed-in user, or null.
// (`requireOrganizer()` would also check the role, see the note in step 1 below.)
// redirect(): send the browser to another page. See the end of createEvent.
import { redirect } from 'next/navigation';
// revalidatePath(): tell Next.js that a page's data is out of date. See the end of createEvent.
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '../../lib/session';

// STEP 1 of the design: describe what a VALID form looks like, once, as a Zod schema.
// Every value in a FormData is a STRING (or a File), so most fields use `z.coerce.*` to convert
// first and check second. `{ error: '...' }` is the message shown to the user when a rule fails.
// (Zod 4 syntax. Old Zod 3 tutorials use `{ message: '...' }`: that's the wrong version.)
const CreateEvent = z
  .object({
    title: z.string().trim().min(3, { error: 'Title must be at least 3 characters long' }).max(120),
    description: z.string().trim().min(20, { error: 'Give attendees a real description' }),
    // `z.uuid()`: the <select> sends the venue's id. We check it LOOKS like an id here, and later
    // that the venue really EXISTS (anyone can submit a made-up id).
    venueId: z.uuid({ error: 'Pick a venue' }),
    // A <input type="datetime-local"> sends text like "2027-03-12T09:00". `z.coerce.date()` turns
    // it into a Date. ⚠️ That text has no time zone, so it's read in the SERVER's time zone (your
    // laptop now, probably UTC once deployed). Real apps store the organizer's zone as well.
    startsAt: z.coerce.date({ error: 'Pick a start date and time' }),
    endsAt: z.coerce.date({ error: 'Pick an end date and time' }),
    // Several checkboxes with the same name -> an ARRAY of ids (see `getAll` below).
    categoryIds: z.array(z.uuid()).min(1, { error: 'Pick at least one category' }),
    // The user types euros ("12.50"). `z.coerce.number()` converts the text to a number.
    // ⚠️ Gotcha: an EMPTY field is converted to 0, so an empty price silently means "free" and
    // the 'Enter a price' message can't appear. Real forms often check for "" first.
    price: z.coerce
      .number({ error: 'Enter a price ' })
      .min(0, { error: "Price can't be a negative number" }),
    // `.int()`: whole numbers only. (An empty field becomes 0, so `.min(1)` rejects it.)
    quantity: z.coerce.number().int().min(1, { error: 'At least one ticket' }),
  })
  // A rule that compares TWO fields can't live on either field, so it goes in `.refine()` after
  // the object. `path: ['endsAt']` decides which field gets the error message.
  .refine((event) => event.endsAt > event.startsAt, {
    error: 'Event must end after it starts',
    path: ['endsAt'],
  });

// `z.input<...>` = the shape of the data BEFORE parsing (strings). `keyof` = its field names:
// 'title' | 'description' | ... So `Field` can only ever be a real form field.
type Field = keyof z.input<typeof CreateEvent>;

// THE STATE this action returns. The form component shows it (components/.../new-event-form.tsx).
//   errors  -> one list of messages per field:  { title: ['Title must be at least 3 ...'] }
//   message -> an error about the whole form (not used yet)
//   values  -> what the user typed, sent BACK so the form can show it again. React clears an
//              uncontrolled form after its action runs, so without this the user would lose
//              everything they typed whenever one field is wrong.
// On SUCCESS there's no state to return: we redirect instead.
export type CreateEventState = {
  errors?: Partial<Record<Field, string[]>>;
  message?: string;
  values?: Partial<Record<Field, string | string[]>>;
};

// THE ACTION. Signature for use with `useActionState`: (previous state, form data) -> new state.
//   _prev     -> the state returned by the previous submit. We don't need it, so the name starts
//                with `_` (that tells ESLint "unused on purpose").
//   formData  -> the browser's `FormData` object: everything in the form, keyed by each field's
//                `name` attribute.
export async function createEvent(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  // 1. AUTHENTICATE: who is asking? The session says so. The owner of the new event is THIS user, taken from
  //    the server (never from a form field). A page-level check never covers an action: the proxy and the
  //    page protect the PAGE, and this function is its own public endpoint, so it checks by itself.
  //    ⚠️ Two gaps remain: it only checks that SOMEONE is signed in, not their ROLE (a signed-in attendee
  //    could post here directly), and a missing user THROWS, which shows the error page. The stronger
  //    version is `const organizer = await requireOrganizer('/dashboard/events/new');` (role + redirect).
  const organizer = await getCurrentUser();

  if (!organizer) {
    throw new Error('Issue while creating an Event');
  }

  // 2. READ the form data into a plain object.
  // Object.fromEntries keeps only the LAST value of a repeated field, so the
  // category checkboxes are read with getAll().
  const raw = {
    ...Object.fromEntries(formData),
    categoryIds: formData.getAll('categoryIds'),
  };

  // What the user typed, as plain strings, to send back if something is wrong.
  // (`Array.isArray`: the checkboxes are an array, every other field a string.)
  const values = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String) : String(value),
    ]),
  );

  // 3. VALIDATE. `safeParse` never throws: it returns { success: true, data } or
  //    { success: false, error }. (`parse` would throw, and an error here would crash the request.)
  const parsed = CreateEvent.safeParse(raw);

  if (!parsed.success) {
    // `flattenError(...).fieldErrors` turns Zod's error into { fieldName: ['message', ...] },
    // exactly the shape of `errors` in our state. Returning it (instead of throwing) is what makes
    // the form show a message next to each wrong field.
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  // From here on `parsed.data` is CLEAN and TYPED: real Date objects, real numbers, real arrays.
  // Split off the pieces that don't go into the `events` table as they are.
  // `price` and `quantity` become the event's first TICKET TYPE (inserted below, in the transaction).
  // The `events` row itself only keeps the lowest price (`minPriceCents`).
  const { price, quantity, categoryIds, ...input } = parsed.data;

  // 4. AUTHORIZE / CHECK THE WORLD: the shape of `venueId` is valid, but does that venue exist?
  //    Validation checks the SHAPE of the data; here we check it against the DATABASE.
  const venue = await db.query.venues.findFirst({ where: eq(venues.id, input.venueId) });

  if (!venue) return { errors: { venueId: ["That venue doesn't exist"] }, values };

  // Money is stored as whole CENTS. `12.50 * 100` can come out as 1249.9999999999998 in floating
  // point, so we round to the nearest whole number.
  const priceCents = Math.round(price * 100);

  // 5. CHANGE DATA, inside a TRANSACTION (all or nothing, like in the seed script): the event and
  //    its category links are created together. If the second insert fails, the event is not
  //    left behind without categories.
  await db.transaction(async (tx) => {
    const [insertedEvent] = await tx
      .insert(events)
      .values({
        // `input` still holds title, description, venueId, startsAt and endsAt.
        ...input,
        slug: await uniqueSlug(input.title),
        // The organizer comes from the SESSION (server side), NEVER from a form field. A field
        // like <input name="organizerId"> could be edited by anyone, so we'd be trusting the user.
        organizerId: organizer.id,
        // Copied from the venue so the list page can filter by city without a JOIN.
        city: venue.city,
        minPriceCents: priceCents,
        // New events always start as drafts. The organizer publishes them from the dashboard.
        status: 'draft',
      })
      // `.returning(...)` gives back the id PostgreSQL generated, which the next insert needs.
      .returning({ id: events.id });

    // With `noUncheckedIndexedAccess`, `[insertedEvent]` may be undefined. Throwing inside a
    // transaction makes it roll back.
    if (!insertedEvent) throw new Error('Issue while creating event');

    // A single default ticket type, built from the form's price and quantity, so the event can sell tickets right
    // away (the Reserve buttons from class 7 read these rows). Inside the same transaction: the event, its ticket
    // type and its categories are created together or not at all.
    await tx
      .insert(ticketTypes)
      .values({ eventId: insertedEvent.id, name: 'General admission', priceCents, quantity });
    await tx
      .insert(eventCategories)
      .values(categoryIds.map((categoryId) => ({ eventId: insertedEvent.id, categoryId })));
  });

  // 6. REVALIDATE: the dashboard shows a list of events, and we just added one. Next.js may
  //    remember ("cache") the rendered dashboard, so we say "this page's data changed, render it
  //    again next time". Forget this line and the new event might not show up.
  revalidatePath('/dashboard');

  // 7. REDIRECT to the list. ⚠️ `redirect()` works by THROWING a special error that Next.js
  //    understands, so code after it never runs, and it must NOT be inside a try/catch (the catch
  //    would swallow it). That's also why this function has no `return` on success.
  redirect('/dashboard');
}

// Builds a URL-friendly slug from a title: "Next.js Conf 2027!" -> "next-js-conf-2027".

// Slugs must be unique (db/schema.ts), so if the slug is taken we add a short random suffix.
// This helper is NOT exported, so it's not a Server Action and not an endpoint: it can only be
// called from inside this file.
async function uniqueSlug(title: string) {
  const base = title
    // lower-case; `normalize('NFKD')` splits "é" into "e" + an accent mark, which the next line removes
    .toLowerCase()
    .normalize('NFKD')
    // every run of characters that aren't a-z or 0-9 becomes ONE dash
    .replace(/[^a-z0-9]+/g, '-')
    // no dash at the start or the end
    .replace(/^-+|-+$/g, '')
    // keep URLs short
    .slice(0, 60);

  // Is there already an event with this slug? (Two people can submit at the same moment, so this
  // check can be wrong. The UNIQUE constraint in the database is the real guard: the second
  // insert would fail. A more robust version catches that error and tries again.)
  const taken = await db.query.events.findFirst({
    where: eq(events.slug, base),
    columns: { id: true },
  });

  // `crypto.randomUUID()` is built into Node.js and the browser; the first 6 characters are plenty.
  return taken ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base;
}
