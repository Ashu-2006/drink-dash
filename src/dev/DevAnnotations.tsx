/* ==========================================================================
   Agentation, mounted for development only.

   It is a design review tool: click any element on the page, write a note, and
   it produces structured markdown carrying the CSS selector, the element path,
   the React component tree and the computed styles. That output goes straight
   to a coding agent, which can then grep for the exact selector instead of
   guessing what "the coral button near the top" refers to.

   WHY THE GATE MATTERS. Rendering <Agentation /> directly in App would put an
   annotation toolbar on the live storefront and add roughly 3.5MB of tooling to
   what visitors download. It is a devDependency and it must behave like one.

   HOW THE GATE WORKS. `import.meta.env.DEV` is replaced by Vite with a literal
   `false` at build time, so `false && ...` is dead code and the dynamic import
   is never reachable. The bundler drops the chunk rather than shipping it
   unused. There is a build check for exactly this in `npm run verify:prod`.

   The lazy import is what makes that possible: a static `import { Agentation }
   from "agentation"` at the top of a file is a hard dependency and would be
   bundled whatever the guard below said.
   ========================================================================== */

import { Suspense, lazy } from "react";

const Panel = import.meta.env.DEV
  ? lazy(async () => {
      const mod = await import("agentation");
      return { default: mod.Agentation };
    })
  : null;

export function DevAnnotations() {
  if (!Panel) return null;
  return (
    <Suspense fallback={null}>
      <Panel />
    </Suspense>
  );
}
