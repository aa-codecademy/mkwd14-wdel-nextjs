/**
 * ROUTE: /dashboard   — the organizer dashboard (a placeholder for now).
 *
 * It shows how the same app can have a totally different layout with the same URL scheme: this
 * page is wrapped by app/(dashboard)/layout.tsx (sidebar), not by the public header/footer.
 *
 * Anyone can open it today. Sign-in and protecting this page come later, and the real
 * dashboard (stats, orders, attendees) after that, as the text on the page says.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Organizer dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        A different layout, same app, no change to any URL. Sign-in arrives in class 06; the real
        dashboard — stats, orders, attendees — in class 09.
      </p>
    </div>
  );
}
