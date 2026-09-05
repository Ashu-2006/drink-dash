/* ==========================================================================
   Media manifest.

   Every image in the app is named here once. Pages reference the key, not the
   path, so a renamed or missing file is a type error at build rather than a
   broken image nobody notices until it is in front of someone.

   Alt text lives here too, next to the picture it describes, because alt
   written at the call site drifts into "image" and "photo" the moment the
   same asset is used twice. `alt: ""` is deliberate and means decorative:
   the image repeats what adjacent text already says, so a screen reader
   should skip it rather than read a caption twice.

   Files are produced by tools/optimize-media.mjs from the originals in
   /public/images at the repo root. Re-run it when new sources land.
   ========================================================================== */

export type MediaKey = keyof typeof MEDIA;

type Entry = {
  /** Basename in /media, without extension. */
  file: string;
  /** Empty string means decorative. */
  alt: string;
  /** Intrinsic aspect ratio, for reserving layout space before load. */
  ratio: string;
  /** True when the source carries transparency and can sit on any ground. */
  cutout?: boolean;
};

export const MEDIA = {
  /* ---- transparent bottle cut-outs ------------------------------------- */
  "bottle-glow": {
    file: "bottle-glow",
    alt: "A bottle of Dash of Glow, peach passion fruit flavour",
    ratio: "1 / 1",
    cutout: true,
  },
  "bottle-burn": {
    file: "bottle-burn",
    alt: "A bottle of Dash of Burn, lemon ginger flavour",
    ratio: "1 / 1",
    cutout: true,
  },
  "bottle-volume": {
    file: "bottle-volume",
    alt: "A bottle of Dash of Volume, pineapple coconut flavour",
    ratio: "1 / 1",
    cutout: true,
  },

  /* ---- transparent ingredient cut-outs --------------------------------- */
  "ing-glutathione": {
    file: "ing-glutathione",
    alt: "",
    ratio: "956 / 625",
    cutout: true,
  },
  "ing-pea-sprout": {
    file: "ing-pea-sprout",
    alt: "",
    ratio: "956 / 625",
    cutout: true,
  },
  "ing-green-coffee": {
    file: "ing-green-coffee",
    alt: "",
    ratio: "956 / 625",
    cutout: true,
  },

  /* ---- the line-up ------------------------------------------------------ */
  "lineup-boxes": {
    file: "lineup-boxes",
    alt: "The three DASH cartons and bottles together: Burn, Glow and Volume",
    ratio: "3 / 2",
  },

  /* ---- single bottles on white ------------------------------------------ */
  "still-glow": { file: "still-glow", alt: "", ratio: "4 / 5" },
  "still-burn": { file: "still-burn", alt: "", ratio: "4 / 5" },
  "still-volume": { file: "still-volume", alt: "", ratio: "4 / 5" },

  /* ---- bottle plus carton ----------------------------------------------- */
  "pack-glow": {
    file: "pack-glow",
    alt: "Dash of Glow bottles beside their carton",
    ratio: "4 / 5",
  },
  "pack-burn": {
    file: "pack-burn",
    alt: "Dash of Burn bottles beside their carton",
    ratio: "4 / 5",
  },
  "pack-volume": {
    file: "pack-volume",
    alt: "Dash of Volume bottles beside their carton",
    ratio: "4 / 5",
  },

  /* ---- people ----------------------------------------------------------- */
  "people-sofa": {
    file: "people-sofa",
    alt: "Three friends on a sofa, each holding a different DASH shot",
    ratio: "2048 / 2012",
  },

  /* ---- Dash Life -------------------------------------------------------- */
  "life-banner": {
    file: "life-banner",
    alt: "",
    ratio: "6 / 1",
  },
  "life-scientist": {
    file: "life-scientist",
    alt: "A formulation scientist holding a flask above a tray of the three shots",
    ratio: "3 / 4",
  },
  "life-bench": {
    file: "life-bench",
    alt: "The three shots on a lab tray with a coconut, pineapple, lemon and passion fruit",
    ratio: "3 / 4",
  },
  "life-fridge": {
    file: "life-fridge",
    alt: "DASH bottles and cartons on a refrigerator shelf",
    ratio: "3 / 4",
  },
  "life-flask": { file: "life-flask", alt: "", ratio: "496 / 468", cutout: true },
  "life-data": { file: "life-data", alt: "", ratio: "1 / 1" },
  "life-desk": { file: "life-desk", alt: "", ratio: "4 / 5" },
} as const satisfies Record<string, Entry>;

/** The public URL for a manifest key. */
export const src = (key: MediaKey) => `/media/${MEDIA[key].file}.webp`;

/** Everything an <img> needs, spread straight onto the element. */
export function img(key: MediaKey) {
  const m = MEDIA[key];
  return {
    src: src(key),
    alt: m.alt,
    /* An empty alt is only correctly ignored when the element is also hidden
       from the tree; some screen readers still announce the filename. */
    ...(m.alt === "" ? { "aria-hidden": true as const } : {}),
  };
}

/* --------------------------------------------------------------------------
   Per-product lookups. Keyed by handle so adding a product is a data change.
   -------------------------------------------------------------------------- */

const BY_HANDLE: Record<
  string,
  { bottle: MediaKey; still: MediaKey; pack: MediaKey }
> = {
  "dash-of-glow": { bottle: "bottle-glow", still: "still-glow", pack: "pack-glow" },
  "dash-of-burn": { bottle: "bottle-burn", still: "still-burn", pack: "pack-burn" },
  "dash-of-volume": {
    bottle: "bottle-volume",
    still: "still-volume",
    pack: "pack-volume",
  },
};

export const bottleFor = (handle: string): MediaKey | null =>
  BY_HANDLE[handle]?.bottle ?? null;
export const stillFor = (handle: string): MediaKey | null =>
  BY_HANDLE[handle]?.still ?? null;
export const packFor = (handle: string): MediaKey | null =>
  BY_HANDLE[handle]?.pack ?? null;

/* --------------------------------------------------------------------------
   Ingredient art.

   Only three ingredients have photography, and they are the three the brand
   writes articles about. Matching is by name so a formula row picks up its
   picture without the catalogue having to know about the media folder, and a
   row with no match simply renders without one.
   -------------------------------------------------------------------------- */

const INGREDIENT_ART: [RegExp, MediaKey][] = [
  [/glutathione/i, "ing-glutathione"],
  [/pea\s*sprout|anagain/i, "ing-pea-sprout"],
  [/green\s*coffee/i, "ing-green-coffee"],
];

export const artForIngredient = (name: string): MediaKey | null =>
  INGREDIENT_ART.find(([re]) => re.test(name))?.[1] ?? null;

/* --------------------------------------------------------------------------
   Galleries.

   The product gallery mixes the new WebP renders with the existing JPEG
   photography, so it cannot be a list of basenames with one extension bolted
   on. This returns fully formed sources instead, new renders first, because
   they are the cleanest images in the set and the first frame is the one most
   people will ever see.
   -------------------------------------------------------------------------- */

export type GalleryShot = { src: string; alt: string; contain?: boolean };

export function galleryFor(handle: string, legacy: readonly string[]): GalleryShot[] {
  const set = BY_HANDLE[handle];
  const shots: GalleryShot[] = [];

  if (set) {
    /* The cut-out leads. It is the only frame with no background competing
       with the bottle, so it is the one that reads at thumbnail size. */
    shots.push({ src: src(set.bottle), alt: MEDIA[set.bottle].alt, contain: true });
    shots.push({ src: src(set.pack), alt: MEDIA[set.pack].alt });
    shots.push({ src: src(set.still), alt: MEDIA[set.still].alt });
  }

  /* The originals stay. They are real photography of the product in use and
     the gallery is the one place there is room for all of it. */
  for (const basename of legacy) {
    shots.push({ src: `/media/${basename}.jpg`, alt: "" });
  }
  return shots;
}
