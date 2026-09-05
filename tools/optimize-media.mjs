/* ==========================================================================
   One-off media pipeline.

   The supplied images arrive at print sizes: 2048x2560 JPEGs of 700KB, and
   1000x1000 PNGs of 425KB, for cards that render 400px wide. Shipping them
   raw would cost several megabytes on a page whose largest contentful paint
   is a photograph.

   This runs at prep time, not build time, and never ships. Re-run it only
   when new source images land:

       node tools/optimize-media.mjs

   Output is WebP. It carries alpha, so the cut-outs and the photographs go
   through the same path, and support is universal in every browser this site
   targets. Sources stay untouched in /public/images at the repo root, so a
   different crop or size can always be regenerated from the original.
   ========================================================================== */

import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve("../public/images");
const OUT = path.resolve("public/media");

/* Widths are chosen from how each image is actually used, not from a generic
   ladder. A hero spans the viewport; an ingredient cut-out never exceeds a
   card. Anything wider is bytes nobody sees. */
const PLAN = [
  // ---- transparent bottle cut-outs: the highest-value new asset ----------
  ["DASH Wellness Shots – Drink Dash/imgi_3_Dash_of_Glow_2.png", "bottle-glow", 900],
  ["DASH Wellness Shots – Drink Dash/imgi_4_Dash_of_Burn_1_1f9389b4-7c47-4fb0-ab7e-7f10219d3b31.png", "bottle-burn", 900],
  ["DASH Wellness Shots – Drink Dash/imgi_5_Dash_of_Volume_1_98a6dea5-ea60-4deb-b47c-4261f2e33b6e.png", "bottle-volume", 900],

  // ---- transparent ingredient cut-outs ----------------------------------
  ["DASH Wellness Shots – Drink Dash/imgi_13_Untitled-3 1.png", "ing-glutathione", 760],
  ["DASH Wellness Shots – Drink Dash/imgi_14_Untitled-2 1.png", "ing-pea-sprout", 760],
  ["DASH Wellness Shots – Drink Dash/imgi_15_Untitled-1 1.png", "ing-green-coffee", 760],

  // ---- the line-up ------------------------------------------------------
  ["DASH Wellness Shots – Drink Dash/imgi_2_Hero_banner.jpg", "lineup-boxes", 1800],

  // ---- single bottles on white -----------------------------------------
  ["DASH Wellness Shots – Drink Dash/imgi_24_30_TEN--4_Revised.jpg_1.jpg", "still-glow", 1100],
  ["DASH Wellness Shots – Drink Dash/imgi_22_30TEN--5.jpg", "still-burn", 1100],
  ["DASH Wellness Shots – Drink Dash/imgi_26_30TEN--3.jpg", "still-volume", 1100],

  // ---- bottle plus carton sets -----------------------------------------
  ["DASH Wellness Shots – Drink Dash/imgi_25_30TEN_e773459f-db93-4be4-8598-92edc39dd234.jpg", "pack-glow", 1400],
  ["DASH Wellness Shots – Drink Dash/imgi_23_30TEN--2_c6c9fe96-41e9-4b18-8a8a-d3d8e998f20c.jpg", "pack-burn", 1400],
  ["DASH Wellness Shots – Drink Dash/imgi_27_30TEN-05818_c34a99bd-92aa-45ac-a461-1b8ccba6b2c6.jpg", "pack-volume", 1400],

  // ---- people. The only human photography in the set --------------------
  ["DASH Wellness Shots – Drink Dash/imgi_12_30_TEN--5.jpg", "people-sofa", 1600],

  // ---- Dash Life ---------------------------------------------------------
  ["About Us – Drink Dash/imgi_2_Dash_Life_1920x320px.jpg_2.jpg", "life-banner", 1920],
  ["About Us – Drink Dash/imgi_9_30_TEN_--11.jpg", "life-scientist", 1200],
  ["About Us – Drink Dash/imgi_6_30_TEN--13.jpg", "life-bench", 1300],
  ["About Us – Drink Dash/imgi_5_30_TEN_--3.jpg", "life-fridge", 1200],
  ["About Us – Drink Dash/imgi_8_ab1.webp", "life-flask", 800],
  ["About Us – Drink Dash/imgi_10_Tab_jpg.jpg", "life-data", 900],
  ["About Us – Drink Dash/imgi_16_30_TEN--8_2560x2048_crop_center.jpg", "life-desk", 1200],
];

const kb = (n) => `${Math.round(n / 1024)}KB`;

async function run() {
  if (!existsSync(SRC)) {
    console.error(`Source folder not found: ${SRC}`);
    process.exitCode = 1;
    return;
  }
  await mkdir(OUT, { recursive: true });

  let before = 0;
  let after = 0;
  const made = [];

  for (const [rel, name, width] of PLAN) {
    const from = path.join(SRC, rel);
    if (!existsSync(from)) {
      console.warn(`  MISSING  ${rel}`);
      continue;
    }
    const src = sharp(from);
    const meta = await src.metadata();
    const inBytes = (await stat(from)).size;

    /* Quality 82 is the point where the packaging gradients stop banding.
       Alpha images get a lower effort ceiling because they are flat art and
       compress hard regardless. */
    const buf = await src
      .resize({ width: Math.min(width, meta.width ?? width), withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, alphaQuality: 90 })
      .toBuffer();

    const to = path.join(OUT, `${name}.webp`);
    await writeFile(to, buf);

    before += inBytes;
    after += buf.length;
    made.push({ name, from: kb(inBytes), to: kb(buf.length), alpha: !!meta.hasAlpha });
    console.log(
      `  ${name.padEnd(18)} ${String(meta.width).padStart(5)}px -> ${String(
        Math.min(width, meta.width ?? width)
      ).padStart(5)}px   ${kb(inBytes).padStart(7)} -> ${kb(buf.length).padStart(7)}${
        meta.hasAlpha ? "   alpha" : ""
      }`
    );
  }

  console.log(
    `\n${made.length} images.  ${kb(before)} -> ${kb(after)}  (${Math.round(
      (1 - after / before) * 100
    )}% smaller)`
  );
}

run();
