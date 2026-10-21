type IcsEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  url: string;
};

const toIcsDate = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

const escape = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// RFC 5545: lines longer than 75 octets must be folded with CRLF + a single space
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

export function buildIcs(event: IcsEvent, generatedAt: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gatherly//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
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

  return lines.map(fold).join('\r\n') + '\r\n';
}
