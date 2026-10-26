import type { ReactNode } from 'react';

type OverviewLayoutProps = {
  children: ReactNode;
  stats: ReactNode;
  attendees: ReactNode;
  orders: ReactNode;
};

export default function OverviewLayout({
  children,
  stats,
  orders,
  attendees,
}: OverviewLayoutProps) {
  return (
    <div className="space-y-6">
      <section>{stats}</section>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">{orders}</section>
        <aside>{attendees}</aside>
      </div>
      {children}
    </div>
  );
}
