/* ==========================================================================
   Iteration one data, kept for the /previous archive page ONLY.

   IMPORTANT. Almost everything in this file was invented before the content
   audit. It is reproduced here because the archive page has to show the design
   as it actually was, and the design was built around these fields. It must
   never be imported by a live page. The real, sourced catalogue is in
   lib/catalog.ts.

   What is invented here, per brand/02-content-audit.md: the differentiator
   lines, the results horizons, the pack badges, every statistic, and the sample
   sizes and durations attached to the citations. The doses, prices and SKUs
   were correct then and are correct now.
   ========================================================================== */

import type { ThemeKey } from "./catalog";

export type LensKey = "skin" | "antioxidant" | "immunity" | "recovery";

export interface OldActive {
  name: string;
  dose: string;
  supports: string;
  studyDose?: string;
  marketDose?: string;
  citation?: number;
  lenses: Partial<Record<LensKey, number>>;
}

export interface OldPack {
  servings: number;
  price: number;
  compareAt: number | null;
  sku: string;
  days: number;
  recommended?: boolean;
  badge?: string;
}

export interface OldStat {
  value: string;
  label: string;
  design: string;
  n: string;
  duration: string;
  placeholder: boolean;
}

export interface OldCitation {
  id: number;
  title: string;
  source: string;
  design: string;
  n?: number;
  duration?: string;
}

export interface OldProduct {
  handle: string;
  name: string;
  shortName: string;
  theme: ThemeKey;
  concern: string;
  descriptor: string;
  flavour: string;
  differentiator: string;
  heroActive: string;
  heroDose: string;
  judgeAtDay: number;
  rating: number;
  reviewCount: number;
  actives: OldActive[];
  packs: OldPack[];
  citations: OldCitation[];
  stats: OldStat[];
  images: string[];
}

export const OLD_COMMERCE = {
  currency: "₹",
  freeShippingThreshold: 499,
  dispatchHours: "24 to 48 hours",
  codAvailable: true,
  prepaidNudge: "Pay by UPI and save ₹ 30",
  returnWindowDays: 30,
  paymentOrder: ["UPI", "Cards", "Net banking", "Cash on delivery"],
} as const;

export const oldMoney = (n: number) =>
  `${OLD_COMMERCE.currency} ${n.toLocaleString("en-IN")}`;

export const oldPerServing = (p: OldPack) => p.price / p.servings;

export const oldProducts: OldProduct[] = [
  {
    handle: "dash-of-glow",
    name: "Dash of Glow",
    shortName: "Glow",
    theme: "glow",
    concern: "Skin",
    descriptor: "Skin Glow Fuel",
    flavour: "Peach Passion Fruit",
    differentiator: "Made to be drunk, not applied.",
    heroActive: "Glutathione",
    heroDose: "500mg",
    judgeAtDay: 21,
    rating: 5,
    reviewCount: 6,
    images: ["glow-1", "glow-2", "glow-5", "glow-6"],
    actives: [
      {
        name: "Glutathione",
        dose: "500mg",
        supports: "Supports the body's antioxidant defence and normal detoxification.",
        studyDose: "500mg daily",
        marketDose: "250mg typical",
        citation: 1,
        lenses: { skin: 0.8, antioxidant: 1, immunity: 0.5, recovery: 0.9 },
      },
      {
        name: "Hyaluronic Acid",
        dose: "40mg",
        supports: "Supports skin hydration and suppleness.",
        studyDose: "120mg daily",
        marketDose: "50mg typical",
        citation: 2,
        lenses: { skin: 1, antioxidant: 0, immunity: 0, recovery: 0.2 },
      },
      {
        name: "Vitamin C",
        dose: "40mg",
        supports: "Contributes to normal collagen formation and protects cells from oxidative stress.",
        studyDose: "40mg RDA",
        marketDose: "40mg typical",
        citation: 3,
        lenses: { skin: 0.9, antioxidant: 0.8, immunity: 0.9, recovery: 0.4 },
      },
      {
        name: "Zinc",
        dose: "10mg",
        supports: "Contributes to the maintenance of normal skin and to normal immune function.",
        studyDose: "12mg RDA",
        marketDose: "10mg typical",
        citation: 4,
        lenses: { skin: 0.7, antioxidant: 0.7, immunity: 1, recovery: 0.5 },
      },
      {
        name: "Vitamin A",
        dose: "400mcg",
        supports: "Contributes to the maintenance of normal skin and mucous membranes.",
        studyDose: "600mcg RDA",
        marketDose: "400mcg typical",
        citation: 5,
        lenses: { skin: 0.8, antioxidant: 0.3, immunity: 0.6, recovery: 0.8 },
      },
    ],
    packs: [
      { servings: 6, price: 780, compareAt: null, sku: "DOGL-06", days: 6, badge: "Six days. Not long enough to judge." },
      { servings: 12, price: 1395, compareAt: null, sku: "DOGL-12", days: 12, recommended: true, badge: "Saves ₹ 14 a shot" },
      { servings: 30, price: 3213, compareAt: 3570, sku: "DOGL-30", days: 30, badge: "Covers the full 21 days" },
    ],
    citations: [
      { id: 1, title: "Effects of oral glutathione supplementation on body stores of glutathione", source: "European Journal of Nutrition", design: "Randomised, double blind, placebo controlled", n: 54, duration: "6 months" },
      { id: 2, title: "Oral hyaluronan relieves dry skin and improves skin moisture", source: "Clinical, Cosmetic and Investigational Dermatology", design: "Randomised, double blind, placebo controlled", n: 60, duration: "6 weeks" },
      { id: 3, title: "Vitamin C and skin health", source: "Oregon State University, Linus Pauling Institute", design: "Narrative review" },
      { id: 4, title: "Zinc is an antioxidant and anti inflammatory agent", source: "Journal of Trace Elements in Medicine and Biology", design: "Review" },
      { id: 5, title: "Vitamin A and retinoid signaling", source: "Journal of Lipid Research", design: "Thematic review" },
    ],
    stats: [
      { value: "500mg", label: "Glutathione per 60ml shot", design: "Label declared dose", n: "per serving", duration: "every shot", placeholder: false },
      { value: "82%", label: "reported skin felt more hydrated", design: "Single arm, self reported", n: "n = 40", duration: "28 days", placeholder: true },
      { value: "2x", label: "the glutathione dose of a typical Indian shot", design: "Label comparison across 6 products", n: "6 products", duration: "surveyed 2026", placeholder: true },
    ],
  },
  {
    handle: "dash-of-volume",
    name: "Dash of Volume",
    shortName: "Volume",
    theme: "volume",
    concern: "Hair",
    descriptor: "Hair Growth Fuel",
    flavour: "Pineapple Coconut",
    differentiator: "Feeds the follicle, not the strand.",
    heroActive: "AnaGain pea sprout",
    heroDose: "100mg",
    judgeAtDay: 90,
    rating: 5,
    reviewCount: 9,
    images: ["volume-1", "volume-2", "volume-5", "volume-6"],
    actives: [
      { name: "Pea Sprout Extract", dose: "100mg", supports: "Supports the hair follicle's normal growth phase.", studyDose: "100mg daily", marketDose: "50mg typical", citation: 1, lenses: { skin: 0.2, antioxidant: 0.4, immunity: 0.2, recovery: 0.6 } },
      { name: "Bamboo Shoot Extract", dose: "50mg", supports: "A natural source of silica, which supports keratin structure.", lenses: { skin: 0.5, antioxidant: 0.3, immunity: 0.1, recovery: 0.4 } },
      { name: "Grapeseed Extract", dose: "50mg", supports: "Provides proanthocyanidins that support antioxidant defence.", lenses: { skin: 0.4, antioxidant: 0.9, immunity: 0.3, recovery: 0.5 } },
      { name: "Sesbania Extract", dose: "30mg", supports: "A plant source of iron, which contributes to normal oxygen transport.", lenses: { skin: 0.2, antioxidant: 0.3, immunity: 0.4, recovery: 0.7 } },
      { name: "Vitamin B5", dose: "5mg", supports: "Contributes to normal energy yielding metabolism.", lenses: { skin: 0.4, antioxidant: 0.1, immunity: 0.2, recovery: 0.8 } },
      { name: "Vitamin B12", dose: "2.2mcg", supports: "Contributes to the reduction of tiredness and fatigue.", lenses: { skin: 0.1, antioxidant: 0.1, immunity: 0.4, recovery: 0.9 } },
    ],
    packs: [
      { servings: 6, price: 770, compareAt: null, sku: "DOVL-06", days: 6, badge: "Six days. Not long enough to judge." },
      { servings: 12, price: 1370, compareAt: null, sku: "DOVL-12", days: 12, recommended: true, badge: "Saves ₹ 14 a shot" },
      { servings: 30, price: 3159, compareAt: 3510, sku: "DOVL-30", days: 30, badge: "One month of the three it takes" },
    ],
    citations: [
      { id: 1, title: "Effect of a pea sprout extract in the treatment of hair loss", source: "PubMed", design: "Randomised, placebo controlled", n: 40, duration: "3 months" },
    ],
    stats: [
      { value: "100mg", label: "pea sprout extract per shot", design: "Label declared dose", n: "per serving", duration: "every shot", placeholder: false },
      { value: "78%", label: "reported less shedding", design: "Single arm, self reported", n: "n = 36", duration: "90 days", placeholder: true },
      { value: "90", label: "days is one full hair cycle", design: "Follicle biology, not a claim", n: "anagen phase", duration: "typical", placeholder: false },
    ],
  },
  {
    handle: "dash-of-burn",
    name: "Dash of Burn",
    shortName: "Burn",
    theme: "burn",
    concern: "Metabolism",
    descriptor: "Weight Management Fuel",
    flavour: "Lemon Ginger",
    differentiator: "Four grams of prebiotic fibre, before anything else.",
    heroActive: "Prebiotic inulin",
    heroDose: "4g",
    judgeAtDay: 28,
    rating: 5,
    reviewCount: 16,
    images: ["burn-1", "burn-2", "burn-5", "burn-6"],
    actives: [
      { name: "Inulin", dose: "4g", supports: "A prebiotic fibre that supports normal gut function.", studyDose: "5g daily", marketDose: "2g typical", lenses: { skin: 0.2, antioxidant: 0.2, immunity: 0.7, recovery: 0.8 } },
      { name: "L-Carnitine", dose: "1g", supports: "Supports the transport of fatty acids for energy metabolism.", studyDose: "2g daily", marketDose: "500mg typical", lenses: { skin: 0.1, antioxidant: 0.3, immunity: 0.1, recovery: 0.9 } },
      { name: "Garcinia Cambogia", dose: "100mg", supports: "Traditionally used to support appetite regulation.", lenses: { skin: 0, antioxidant: 0.2, immunity: 0.1, recovery: 0.5 } },
      { name: "Green Coffee Extract", dose: "100mg", supports: "Provides chlorogenic acids that support normal glucose metabolism.", studyDose: "200mg daily", marketDose: "100mg typical", citation: 1, lenses: { skin: 0.2, antioxidant: 0.8, immunity: 0.2, recovery: 0.6 } },
      { name: "Chromium Picolinate", dose: "200mcg", supports: "Contributes to the maintenance of normal blood glucose levels.", lenses: { skin: 0, antioxidant: 0.2, immunity: 0.2, recovery: 0.7 } },
    ],
    packs: [
      { servings: 6, price: 775, compareAt: null, sku: "DOBN-06", days: 6, badge: "Six days. Not long enough to judge." },
      { servings: 12, price: 1380, compareAt: null, sku: "DOBN-12", days: 12, recommended: true, badge: "Saves ₹ 14 a shot" },
      { servings: 30, price: 3181, compareAt: 3535, sku: "DOBN-30", days: 30, badge: "Covers the full 28 days" },
    ],
    citations: [
      { id: 1, title: "Green coffee extract as a weight loss supplement: a systematic review and meta analysis of randomised clinical trials", source: "Gastroenterology Research and Practice", design: "Systematic review and meta analysis", n: 3, duration: "pooled trials" },
    ],
    stats: [
      { value: "4g", label: "prebiotic inulin per shot", design: "Label declared dose", n: "per serving", duration: "every shot", placeholder: false },
      { value: "71%", label: "reported feeling less bloated", design: "Single arm, self reported", n: "n = 44", duration: "28 days", placeholder: true },
      { value: "2x", label: "the inulin of a typical Indian shot", design: "Label comparison across 6 products", n: "6 products", duration: "surveyed 2026", placeholder: true },
    ],
  },
];

export const oldTrialTrio = {
  handle: "trial-trio",
  name: "The Trial Trio",
  servings: 6,
  price: 499,
  composition: "Two of each shot",
  purpose: "Find your shot and your flavour",
  notFor:
    "Six days is not long enough to judge a result. This pack is for choosing, not for proving.",
  limit: "One per customer",
  placeholder: true,
} as const;

export const oldBundles = [
  {
    handle: "glow-90",
    name: "The 90 day Glow",
    detail: "Three 30 packs of Dash of Glow",
    price: 8990,
    compareAt: 9639,
    note: "The only pack that covers a full skin cycle",
    placeholder: true,
  },
  {
    handle: "glow-volume-pair",
    name: "Glow and Volume",
    detail: "One 30 pack of each",
    price: 5990,
    compareAt: 6372,
    note: "Skin and hair share four of their actives",
    placeholder: true,
  },
] as const;

export const oldFaq = [
  {
    q: "What does it taste like",
    a: "Dash of Glow is peach passion fruit. Volume is pineapple coconut and Burn is lemon ginger. No added sugar and no artificial sweeteners, so they taste of the fruit rather than of syrup.",
  },
  {
    q: "How long before I see anything",
    a: "Give it 21 days before you judge skin. The pack maths section on this page shows which pack sizes actually cover that, and which do not.",
  },
  {
    q: "Is it safe to take every day",
    a: "Every active is at or below its recommended daily amount. It is a food supplement, not a medicine, and it is meant to be taken once a day with or without food.",
  },
  {
    q: "Can I take it with my other supplements",
    a: "Usually yes. Check the doses on this page against anything else you take so you do not double up on zinc or vitamin A, and speak to a doctor if you are on medication.",
  },
  {
    q: "Does it replace my skincare",
    a: "No. This works from the inside and your serum works on the surface. They are doing different jobs and neither substitutes for the other.",
  },
];

export const oldHowItWorks = [
  { n: "01", title: "Shake", body: "Give the bottle a proper shake. The actives settle." },
  { n: "02", title: "Drink", body: "Sixty millilitres, straight down. No water, no mixing." },
  { n: "03", title: "Repeat", body: "Once a day, at whatever time you will actually remember." },
  { n: "04", title: "Judge at day 21", body: "Not before. Skin turns over on its own schedule." },
];

export const oldReviews = [
  { name: "Nisha", days: 34, stars: 5, text: "My skin looks more radiant and feels hydrated. It is a must have in my routine now." },
  { name: "Devanshi", days: 21, stars: 5, text: "I could not take glutathione pills every day. I love the taste of this, so I actually keep it up." },
  { name: "Sahil", days: 14, stars: 5, text: "I was dealing with dull, tired looking skin. It feels more hydrated and looks fresher overall." },
  { name: "Anonymous", days: 12, stars: 5, text: "Almost two weeks in and my skin truly feels visibly healthier." },
  { name: "Rajiv", days: 6, stars: 5, text: "Very prompt delivery, great packaging and product." },
  { name: "Shakti", days: 4, stars: 5, text: "The Dash of Glow product is amazing." },
];
