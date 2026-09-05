/* ==========================================================================
   Stamp type: parameters.

   Tracks, timings and constants are as supplied. Only the worlds are changed:
   a piece running on the DASH site should say DASH words, and its three colour
   values must come out of the DASH palette.

   The palette rule is enforced, not eyeballed: field and bar are far apart in
   both hue and value, and ink is near-black or near-cream. Every field/bar pair
   below clears 5:1, and the ink on bar pair clears it too. A low contrast
   pairing reads as a stain rather than a poster.
   ========================================================================== */

export const TICK_MS = 50;

export const STEP = 2;

export const STAMP_TTL = 16;

export const PARK_IN = 28;

export const PARK_OUT = 76;

export const PASS_END = 93;

export const PARK_FRAMES = 48;

export const PASS_OVERLAP = 12;

export const FIELD_SWAP = 5;

export interface World {
  bg: string;
  bar: string;
  ink: string;
  lines: [string, string, string, string];
}

/* Four lines per world, all from the brand's own copy.

   World 1 is verbatim from the product pages: "No Water, No Mixing, No Drama."
   and "Just Shake, Twist, Glow." That copy was written to be read this way and
   it is the best thing on the live site.

   Contrast, measured: ink #231f1a on coral #ff836b 6.79, on olive #94bd43 7.50,
   on gold #e59c06 7.09. Cream #fffdf6 on ink #231f1a 16.09. */
export const WORLDS: World[] = [
  {
    // ink field, coral bars, ink type knocked out of the bar
    bg: "#231f1a",
    bar: "#ff836b",
    ink: "#231f1a",
    lines: ["No water.", "No mixing.", "No drama.", "Just shake."],
  },
  {
    // coral field, ink bars, cream type
    bg: "#ff836b",
    bar: "#231f1a",
    ink: "#fffdf6",
    lines: ["Take a shot.", "Sixty ml.", "One a day.", "That is it."],
  },
  {
    // olive field, ink bars, cream type
    bg: "#94bd43",
    bar: "#231f1a",
    ink: "#fffdf6",
    lines: ["Five actives.", "Named doses.", "On every", "single bottle."],
  },
  {
    // gold field, ink bars, cream type
    bg: "#e59c06",
    bar: "#231f1a",
    ink: "#fffdf6",
    lines: ["No added", "sugar.", "No artificial", "sweeteners."],
  },
  {
    // cream field, ink bars, cream type
    bg: "#fffdf6",
    bar: "#231f1a",
    ink: "#fffdf6",
    lines: ["Thirty days", "is the ritual.", "Six days", "is a taste test."],
  },
];

export const HEADLINE = 71 / 600;

export const BAR_PAD_X = 10 / 600;
export const BAR_PAD_TOP = 11 / 600;
export const BAR_PAD_BOTTOM = 8 / 600;
export const BAR_RADIUS = 11 / 600;
export const BAR_STROKE = 16 / 600;

export const LINE_RIGHT_MARGIN = 24 / 600;

export const CONDENSE_MIN = 0.72;

export type Track = [number, number, number][];

export const TRACKS: Track[] = [
  [[1, 181, -100], [3, 181, 11], [6, 165, 16], [7, 128, 16], [10, 110, 16],
    [11, 72, 16], [13, 69, 38], [15, 70, 90], [16, 70, 94], [17, 97, 94],
    [19, 165, 94], [20, 170, 94], [21, 154, 94], [23, 117, 94], [24, 114, 94],
    [25, 114, 115], [27, 114, 168], [28, 114, 172], [76, 114, 172], [77, 114, 142],
    [79, 114, 66], [82, 96, 61], [84, 47, 61], [86, 108, 61], [88, 195, 61],
    [91, 195, -120]],

  [[12, -540, 273], [15, 16, 273], [18, 20, 267], [20, 20, 251], [22, 29, 251],
    [24, 53, 251], [28, 53, 240], [76, 53, 240], [80, 31, 240], [82, 31, 225],
    [84, 31, 184], [86, 0, 184], [88, 37, 264], [90, 76, 264], [93, -560, 264]],

  [[8, 640, 375], [11, 97, 375], [14, 90, 365], [15, 90, 343], [18, 85, 341],
    [19, 72, 341], [22, 71, 332], [24, 71, 308], [28, 49, 308], [76, 49, 308],
    [80, 49, 297], [84, 49, 319], [87, 49, 266], [88, 49, 264], [90, 88, 263],
    [93, 660, 263]],

  [[4, 620, 498], [7, 118, 498], [8, 104, 498], [12, 104, 487], [13, 77, 487],
    [15, 9, 487], [16, 4, 487], [17, 4, 469], [19, 4, 424], [22, 20, 420],
    [23, 58, 420], [26, 61, 408], [28, 61, 376], [76, 61, 376], [80, 31, 376],
    [83, 84, 376], [85, 63, 376], [87, 4, 376], [90, 0, 376], [93, -540, 376]],
];
