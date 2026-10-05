/**
 * Site footer — rendered once in app/layout.tsx.
 *
 * `new Date().getFullYear()` runs on the SERVER. Our pages are static
 * (prerendered at build time), so in production the year is the year of the
 * last build. That's fine for a copyright line, but it's a good example of
 * "this code ran once, at build time, not on every visit".
 */
export function Footer() {
  return (
    <footer className="border-t border-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Gatherly · Built in the Avenga Academy Next.js elective
      </div>
    </footer>
  );
}
