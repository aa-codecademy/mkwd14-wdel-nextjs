export function Footer() {
  return (
    <footer className="border-t border-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Gatherly · Built in the Avenga Academy Next.js elective
      </div>
    </footer>
  );
}
