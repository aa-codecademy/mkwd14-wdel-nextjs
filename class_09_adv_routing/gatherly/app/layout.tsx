/**
 * ROOT LAYOUT — the one layout every page has. It must render <html> and <body>.
 *
 * In class 02 the header, footer and page width lived here. Now it is deliberately MINIMAL,
 * because the app has two different looks (see "route groups" in the class 06 README):
 *
 *   app/layout.tsx                  <html>, <body>, fonts, metadata      (this file, for everything)
 *   ├─ app/(marketing)/layout.tsx   public site: header + centred content + footer
 *   └─ app/(dashboard)/layout.tsx   organizer area: sidebar, no site header
 *
 * Each group adds its own frame inside `children`. Layouts stay mounted during navigation, so
 * moving between pages of the same group doesn't re-render its header or sidebar.
 */
import type { Metadata } from 'next';
// next/font downloads the font at BUILD time and serves it from our own domain: no request to
// Google from the visitor's browser, and no layout shift while it loads.
import { Inter } from 'next/font/google';
import './globals.css';

// `variable` exposes the font as a CSS variable (--font-sans) on <html>, see below.
// The name matters: Tailwind's `font-sans` class reads `--font-sans` (globals.css:
// `--font-sans: var(--font-sans)`, written by shadcn). With any other name (e.g. `--font-inter`)
// nothing would read it and the browser would fall back to its own default (serif) font.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Default <title> and <meta name="description"> for every page.
// A page can export its own `metadata` to override them.
export const metadata: Metadata = {
  title: 'Gatherly',
  description: 'Find conferences, meetups, workshops and concerts near you - and get your ticket.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // The font variable goes on <html> so `var(--font-sans)` can be resolved anywhere below it.
    <html lang="en" className={inter.variable}>
      {/* `min-h-screen`: at least the height of the window. `antialiased`: smoother text rendering. */}
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
