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
import { Inter, Geist } from 'next/font/google';
import './globals.css';
// Shared components live in the top-level `components/` folder, outside `app/`.
// Files outside `app/` can never become routes, which keeps `app/` for URLs only.
import { Header } from '../components/header';
import { Footer } from '../components/footer';
// `cn` (lib/utils.ts) joins class names. Added by `shadcn init`.
import { cn } from "@/lib/utils";

// The shadcn font. Its CSS variable is named `--font-sans` — exactly the name
// the generated block in globals.css reads (`--font-sans: var(--font-sans)`),
// so Tailwind's `font-sans` class now means Geist.
const geist = Geist({subsets:['latin'],variable:'--font-sans'});


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
    // The font variable has to be on <html> (or above where it's used) so
    // `var(--font-sans)` can be resolved everywhere. `cn("font-sans", geist.variable)`
    // joins two classes: Tailwind's `font-sans` (use the sans font) and the class
    // next/font generated, which defines the `--font-sans` variable.
    <html lang="en" className={cn("font-sans", geist.variable)}>
      {/*
       * "Sticky footer" layout: body is a full-height flex column, and <main>
       * has `flex-1`, so it grows to fill the space. The footer stays at the
       * bottom even when a page has little content.
       */}
      {/*
       * shadcn's base styles (globals.css) already give <body> `bg-background text-foreground`.
       * Our `bg-white text-gray-900` classes here take priority, so the page
       * stays white even in dark mode. Switch to `bg-background text-foreground`
       * if you want the theme tokens to drive the page colours.
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
