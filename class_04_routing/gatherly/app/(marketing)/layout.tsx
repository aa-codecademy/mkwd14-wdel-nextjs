import type { ReactNode } from 'react';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
      <Footer />
    </div>
  );
}
