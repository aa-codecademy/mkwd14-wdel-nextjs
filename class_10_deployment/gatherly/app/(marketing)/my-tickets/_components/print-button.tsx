'use client';

/**
 * PrintButton — opens the browser's print dialog.
 *
 * It must be a Client Component: `window` (and `window.print()`) exist only in the browser, and the
 * `onClick` handler needs JavaScript there. It's a tiny leaf, so the rest of the print page stays on the server.
 */

import { Button } from '../../../../components/ui/button';

export function PrintButton() {
  return <Button onClick={() => window.print()}>Print</Button>;
}
