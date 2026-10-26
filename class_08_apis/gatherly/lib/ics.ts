/**
 * Builds an iCalendar (.ics) file for one event.
 *
 * ".ics" is a plain-text standard (RFC 5545) that Google Calendar, Apple Calendar and Outlook all read.
 * It looks like this, and every line has strict rules, which is what the helpers below take care of:
 *
 *   BEGIN:VCALENDAR
 *   ...
 *   BEGIN:VEVENT
 *   SUMMARY:Next.js Conf Skopje
 *   DTSTART:20270312T080000Z
 *   END:VEVENT
 *   END:VCALENDAR
 *
 * Pure function: a plain TypeScript module, no Next.js, no database. It's easy to test by hand: call
 * buildIcs(...) and look at the string.
 */
type IcsEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  url: string;
};

// The format is YYYYMMDDTHHMMSSZ in UTC: `toISOString()` gives "2027-03-12T08:00:00.000Z", we drop the
// dashes, the colons and the milliseconds. The final Z means UTC, so every calendar converts it to the
// user's own time zone.
const toIcsDate = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

// Some characters mean something in the format, so inside a TEXT value they must be escaped with a
// backslash: \\ \; \, and a line break becomes a literal \n. (Without it, a comma or a semicolon in a
// title would split the value apart.) The order matters: the backslash is escaped first.
const escape = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// RFC 5545: lines longer than 75 octets must be folded with CRLF + a single space
// ("octets" = BYTES, not characters: a Cyrillic or emoji character takes 2-4 bytes, so the code counts
// the UTF-8 length with TextEncoder instead of `.length`.)
const fold = (line: string) => {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
};

// `generatedAt` is passed in (not read with `new Date()` inside), which keeps the function pure and
// predictable: the same input always gives the same output.
export function buildIcs(event: IcsEvent, generatedAt: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gatherly//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    // A STABLE unique id: importing the file again UPDATES the same calendar entry instead of duplicating it.
    `UID:${event.id}@gatherly`,
    `DTSTAMP:${toIcsDate(generatedAt)}`,
    `DTSTART:${toIcsDate(event.startsAt)}`,
    `DTEND:${toIcsDate(event.endsAt)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description)}`,
    `LOCATION:${escape(event.location)}`,
    `URL:${event.url}`,
    `END:VEVENT`,
    'END:VCALENDAR',
  ];

  // The standard demands CRLF (\r\n) line endings, including after the last line.
  return lines.map(fold).join('\r\n') + '\r\n';
}
