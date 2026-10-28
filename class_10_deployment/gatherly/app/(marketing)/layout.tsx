/**
 * LAYOUT of the (marketing) ROUTE GROUP — the public website: header, content, footer.
 *
 * `(marketing)` in parentheses is a ROUTE GROUP: the folder name is NOT part of the URL.
 *   app/(marketing)/events/page.tsx   ->  /events        (not /marketing/events)
 *   app/(marketing)/about/page.tsx    ->  /about
 *
 * Why group? Pages inside a group share a layout, WITHOUT changing their URLs. Here the public
 * pages get the site header and footer, while the dashboard (another group) gets a sidebar.
 *
 * The "sticky footer" trick: a full-height flex column whose <main> has `flex-1`, so <main>
 * grows to fill the free space and pushes the footer to the bottom, even on short pages.
 */
import type { ReactNode } from 'react';
// Shared components live in the top-level `components/` folder, outside `app/`, so they
// can never become routes.
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';

// (`children` = the normal page, `modal` = the slot. Both are rendered at the same time.)
// Props typed by hand here. `modal` is the PARALLEL ROUTE slot from the `@modal` folder:
// every `@folder` next to this layout arrives as a prop with that name, and the layout must
// render it, or whatever the slot matches (the intercepted tickets modal) is never shown.
export default function MarketingLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* `mx-auto max-w-5xl` centres the content and limits its width; `px-4` adds side padding. */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
      <Footer />
      {/* The slot goes last, outside <main>: when a modal is open it overlays the page; otherwise it's null. */}
      {modal}
    </div>
  );
}
