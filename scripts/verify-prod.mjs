/* ==========================================================================
   Production bundle guard.

   Agentation is a design review tool. It is a devDependency and it must never
   reach the storefront: it would put an annotation toolbar in front of paying
   visitors and add megabytes to what they download.

   The gate that prevents that is a single `import.meta.env.DEV` check in
   src/dev/DevAnnotations.tsx, which Vite replaces with a literal false so the
   dynamic import becomes unreachable and the chunk is dropped. That is easy to
   break by accident: one static import of the package anywhere in src, or one
   refactor that moves the guard, and it silently ships. Nothing would fail, the
   toolbar would simply appear on the live site.

   So this asserts the outcome rather than trusting the mechanism.

   Run: npm run verify:prod
   ========================================================================== */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DIST = "dist";

/** Packages that must not appear in the shipped bundle, with the reason. */
const FORBIDDEN = [
  { needle: "agentation", why: "dev annotation toolbar, devDependency" },
  { needle: "Agentation", why: "dev annotation toolbar, exported component" },
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

console.log("Building for production...");
execSync("npm run build", { stdio: "inherit" });

if (!fs.existsSync(DIST)) {
  console.error("FAIL: no dist directory after build.");
  process.exit(1);
}

// Only text assets can carry the code. Images and fonts cannot.
const TEXT = new Set([".js", ".mjs", ".css", ".html", ".map", ".json", ".svg"]);
const files = walk(DIST).filter((f) => TEXT.has(path.extname(f)));

let failed = false;
for (const { needle, why } of FORBIDDEN) {
  const hits = files.filter((f) =>
    fs.readFileSync(f, "utf8").includes(needle)
  );
  if (hits.length) {
    failed = true;
    console.error(`\nFAIL: "${needle}" found in the production bundle (${why}).`);
    for (const h of hits.slice(0, 5)) console.error(`   ${h}`);
    console.error(
      "   The DEV gate in src/dev/DevAnnotations.tsx is not doing its job.\n" +
        "   Check for a static `import ... from \"agentation\"` anywhere in src."
    );
  } else {
    console.log(`OK: "${needle}" absent from ${files.length} shipped text assets.`);
  }
}

if (failed) process.exit(1);
console.log("\nProduction bundle is clean.");
