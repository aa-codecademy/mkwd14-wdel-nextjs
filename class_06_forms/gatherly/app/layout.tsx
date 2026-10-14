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
// Two fonts are imported here:
//  - `Inter` — our own choice earlier in class 02,
//  - `Geist` — added by `shadcn init`, which sets up its own font.
// Only Geist is applied now (see <html> below).
import { Inter } from 'next/font/google';
import './globals.css';

// LEFTOVER: `inter` is created but no longer used, because <html> below uses
// `geist.variable`. ESLint reports this as an error ('assigned a value but never
// used'). Fix it by deleting these lines, or by switching the fonts back —
// e.g. `inter.variable` in <html> and `--font-inter` in globals.css.
// `variable` would expose the font as the CSS variable --font-inter.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Default <title> and <meta name="description"> for every page.
// A page can export its own `metadata` to override them.
export const metadata: Metadata = {
  title: 'Gatherly',
  description: 'Find conferences, meetups, workshops and concerts near you - and get your ticket.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
