/* ==========================================================================
   Document title.

   Every route sets its own and restores the previous one on unmount. The
   restore is the point: /previous used to set a title and leave it set, so
   navigating away left the tab claiming to be the archived iteration. A
   set-without-restore is invisible on the page that sets it and wrong on every
   page after it.

   Titles matter more here than on a typical prototype because this is a shop:
   the tab strip and the browser history are both navigation surfaces, and
   three tabs all reading "DASH Wellness Shots" are three tabs nobody can tell
   apart.
   ========================================================================== */

import { useEffect } from "react";

export const SITE = "DASH Wellness Shots";

export function useTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${SITE}` : SITE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
