/**
 * ROOT LAYOUT — the frame of every Gatherly page.
 *
 * In class 02 we moved the parts every page shares (header, footer, page width)
 * into the root layout. Each page now only renders its own content, which ends
 * up in `children` inside <main>.
 *
 * Because layouts stay mounted during navigation, <Header /> and <Footer /> are
 * NOT re-rendered when you go from / to /events. Only <main>'s content changes.
 */
import type { Metadata } from 'next';
// Inter replaced the Geist fonts from the create-next-app template.
import { Inter, Geist } from 'next/font/google';
import './globals.css';
// Shared components live in the top-level `components/` folder, outside `app/`.
// Files outside `app/` can never become routes, which keeps `app/` for URLs only.
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// `variable` exposes the font as the CSS variable --font-inter. globals.css maps
// it to Tailwind's `font-sans`, so `font-sans` on <body> uses Inter.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Default <title> and <meta name="description"> for every page.
// A page can export its own `metadata` to override them.
export const metadata: Metadata = {
  title: 'Gatherly',
  description: 'Find conferences, meetups, workshops and concerts near you - and get your ticket.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // The font variable has to be on <html> (or above where it's used) so
    // `var(--font-inter)` can be resolved everywhere.
    <html lang="en" className={cn("font-sans", geist.variable)}>
      {/*
       * "Sticky footer" layout: body is a full-height flex column, and <main>
       * has `flex-1`, so it grows to fill the space. The footer stays at the
       * bottom even when a page has little content.
       */}
      <body className="flex min-h-screen flex-col bg-white font-sans text-gray-900 antialiased">
        <Header />
        {/* `mx-auto max-w-5xl` centres the content and limits its width; `px-4` adds side padding. */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
