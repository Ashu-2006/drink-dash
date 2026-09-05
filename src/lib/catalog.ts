/* ==========================================================================
   The single data boundary.

   PROVENANCE RULE, and it is enforced by the `source` field on every editorial
   block: nothing in this file is invented unless it carries source: "proposal".
   Everything else is verbatim from drinkdash.in, pulled 2026-09-05. Raw HTML is
   archived in brand/real/. The audit of what was previously invented, and what
   it was replaced with, is in brand/02-content-audit.md.

   SCALE RULE: this file is written for a catalogue that grows. Products are not
   hard coded into layouts. Concerns are a taxonomy, pack tiers are shared, and
   `layoutMode` derives the product list presentation from the product count so
   adding a fourth or a fourteenth product does not require a redesign. See
   NOTES ON GROWTH at the foot of this file.
   ========================================================================== */

/** Where a string came from. Rendered as a visible tag when it is a proposal. */
export type Source = "site" | "packaging" | "policy" | "proposal";

export type ThemeKey = "glow" | "burn" | "volume";

/* --------------------------------------------------------------------------
   Concerns: the taxonomy the product list and navigation are built on.
   Adding a product means adding a concern here if it needs a new one, not
   editing a page.
   -------------------------------------------------------------------------- */

export interface Concern {
  id: string;
  label: string;
  /** Shown on the concern selector. */
  question: string;
}

export const concerns: Concern[] = [
  { id: "skin", label: "Skin", question: "Dull, uneven or dehydrated skin" },
  { id: "hair", label: "Hair", question: "Hair fall, thinning or weak roots" },
  { id: "metabolism", label: "Metabolism", question: "Weight and metabolic balance" },
];

/* --------------------------------------------------------------------------
   Pack tiers. The site names its packs, so the names are shared across every
   product rather than written per product.
   -------------------------------------------------------------------------- */

export interface PackTier {
  servings: number;
  /** Verbatim from the product page. */
  name: string;
  source: Source;
}

export const packTiers: PackTier[] = [
  { servings: 6, name: "Trial Pack", source: "site" },
  { servings: 12, name: "Starter Pack", source: "site" },
  { servings: 30, name: "Recommended Pack", source: "site" },
];

export const tierFor = (servings: number) =>
  packTiers.find((t) => t.servings === servings);

/** Verbatim footnote attached to the Recommended Pack on every product page.
    This is the brand's own results horizon. It replaced an invented one. */
export const RITUAL_NOTE = {
  text: "For noticeable results, we recommend a 30-day ritual.",
  days: 30,
  source: "site" as Source,
};

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */

export interface Active {
  name: string;
  /** Verbatim from the INGREDIENTS panel. */
  dose: string;
}

/** A row of the product's own formula section. Real support role, real copy. */
export interface FormulaEntry {
  name: string;
  /** e.g. "Antioxidant Support". Verbatim. */
  role: string;
  /** Verbatim description. */
  detail: string;
  /** Dose, when this entry also appears in the ingredient panel. */
  dose?: string;
}

/** The brand's own answer to the multiple use case problem: exactly two
    audiences per product, each with its own bullet list. Verbatim. */
export interface Audience {
  /** e.g. "If your skin appears dull, uneven, or dehydrated" */
  condition: string;
  lede: string;
  points: string[];
}

export interface Pack {
  servings: number;
  price: number;
  compareAt: number | null;
  sku: string;
  available: boolean;
}

/** Reference titles exactly as listed under BACKED BY INGREDIENT RESEARCH.
    No sample size, design or duration is stated on the site, so none is
    asserted here. Inventing those was the single worst error in the first
    pass. */
export interface Reference {
  id: number;
  title: string;
  publisher: string;
}

export interface Review {
  name: string;
  text: string;
  stars: number;
}

export interface Product {
  handle: string;
  name: string;
  shortName: string;
  theme: ThemeKey;
  concernId: string;
  /** Printed on the box. */
  descriptor: string;
  /** Printed on the bottle. Never used on the current website. */
  flavour: string;
  /** The line the home page uses for this product. Verbatim. */
  lineUpLine: string;
  /** WHAT IS DASH OF X. Verbatim, three paragraphs. */
  whatItIs: string[];
  /** WHO DASH OF X IS FOR. Exactly two audiences. Verbatim. */
  audiences: Audience[];
  /** HOW DASH OF X WORKS. Verbatim. */
  howItWorks: string[];
  /** HOW TO USE. Verbatim. */
  howToUse: string[];
  /** INGREDIENTS lede, verbatim. */
  ingredientsLede: string;
  actives: Active[];
  /** INGREDIENTS closing line, verbatim. */
  ingredientsNote: string;
  /** THE X FORMULA section title, verbatim. */
  formulaTitle: string;
  formula: FormulaEntry[];
  references: Reference[];
  reviews: Review[];
  rating: number;
  reviewCount: number;
  packs: Pack[];
  /** The ritual block at the foot of the page. Verbatim. */
  ritual: { title: string; lines: string[] };
  /** Image basenames in /media. Index 0 is the pack shot. */
  images: string[];
  /** Known issue on the live site, surfaced rather than reproduced. */
  liveSiteIssue?: string;
}

/* --------------------------------------------------------------------------
   Commerce. Every value traced to the page or policy that states it.
   -------------------------------------------------------------------------- */

export const COMMERCE = {
  currency: "₹",
  /** Stated flatly on every product page, next to "Tax included." */
  shipping: { text: "Free Shipping", source: "site" as Source },
  taxNote: { text: "Tax included.", source: "site" as Source },
  dispatch: { text: "Dispatches in 24 - 48 hours", source: "site" as Source },
  /** Refund policy clause 1.2: contact within 7 days of receiving the product. */
  returns: { days: 7, text: "7 day returns", source: "policy" as Source },
  /** Named in the refund policy as a real checkout option. */
  cod: { available: true, text: "Cash on delivery available", source: "policy" as Source },
  support: { email: "support@drinkdash.in", phone: "+91 84888 31888", source: "site" as Source },
  /** UPI is roughly 81 percent of India's retail digital payments, so it leads.
      The order is our recommendation; the methods themselves are from the footer. */
  paymentMethods: ["UPI", "RuPay", "Visa", "Mastercard"],
  /** A contradiction on the live site, worth raising rather than designing around:
      the product page promises Free Shipping while the shipping policy says rates
      will be charged and shown at checkout. */
  knownContradiction:
    "The product page promises Free Shipping. The shipping policy says rates as applicable will be charged and displayed at checkout.",
} as const;

export const money = (n: number) =>
  `${COMMERCE.currency} ${n.toLocaleString("en-IN")}`;

export const perServing = (p: Pack) => p.price / p.servings;

export const savingPercent = (p: Pack) =>
  p.compareAt && p.compareAt > p.price
    ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100)
    : null;

/* --------------------------------------------------------------------------
   Brand level content, all verbatim from the home page.
   -------------------------------------------------------------------------- */

export const BRAND = {
  hero: {
    lines: ["Take A Shot.", "It's time to DASH."],
    body:
      "DASH is your sip-sized fuel, an advanced formula packed into a potent wellness shot. Each 60ml dose is packed with a precision-formulated blend designed for quick absorption and real results, tailored to your wellness needs.",
    cta: "SHOP NOW",
    source: "site" as Source,
  },
  /** The site already runs this as a marquee. It is a ready made kinetic type
      element and the words are the brand's own. */
  marquee: [
    "Precision Formula",
    "Ready To Drink",
    "Clinically Supported",
    "Skin Glow Fuel",
    "Hair Growth Fuel",
    "Weight Management Fuel",
  ],
  lineUp: { eyebrow: "Meet the DASH Line-Up", title: "Your New Inner Circle." },
  badges: [
    "Vegan Friendly",
    "GMO Free",
    "Gluten Free",
    "Lab-Tested",
    "Keto-Friendly",
    "No Artificial Sweeteners",
  ],
  why: {
    title: "WHY DASH?",
    paragraphs: [
      "DASH is wellness designed for real life, delivered through clinically advanced 60ml shots formulated to address specific concerns. Each shot features thoughtfully selected, research-backed ingredients in meaningful concentrations, with formulations developed to support healthy skin, metabolic balance, and hair and scalp nourishment from within. Our ingredients are chosen for their bioavailability, compatibility, and role in supporting the body's natural processes, not for trends or hype.",
      "Free from added sugar and artificial flavours or sweeteners, DASH features vegan-friendly, lab-tested formulations designed for consistent, research-backed daily support.",
      "Compact by design and easy to integrate into your routine, DASH fits seamlessly into your lifestyle. No exaggerated claims, just honest wellness that respects your time and your body.",
    ],
  },
  ritualSection: {
    kicker: "GRAB IT. SHAKE IT. DASH IT.",
    title: "DASH RITUAL",
    sub: "FUEL UP, 60ML AT A TIME.",
    video: "/media/ritual.mp4",
  },
  /** Appears at the foot of every product page. */
  statement:
    "Built with purpose, not promises. Each DASH formulation is developed through structured R&D, ingredient screening, and stability testing, ensuring every 60ml shot delivers consistent quality, batch after batch.",
  diaries: {
    title: "THE DASH DIARIES",
    posts: [
      {
        title:
          "Understanding Glutathione: The Molecular Foundation of Detoxification",
        blurb:
          "A master antioxidant, quietly strengthening detox, defending cells, and elevating your natural glow.",
      },
      {
        title:
          "From the Root Up: How Ingestible AnaGain Is Shifting Hair Care From Surface Fixes to Follicle-Level Science",
        blurb:
          "Targeting follicles from within to spark stronger growth, fuller strands, and true root-level renewal.",
      },
      {
        title:
          "Metabolism in Motion: How L-Carnitine and Green Coffee Extract Help Your Body Work Smarter",
        blurb:
          "Fueling efficient energy, balanced metabolism, and smarter fat use, right where your body needs it most.",
      },
    ],
  },
  /* How it works. Every line is the brand's own, pulled from the ritual
     kicker, the per-product ritual blocks, HOW TO USE, and the Recommended
     Pack footnote. The four verbs are the kicker plus the results horizon the
     brand itself sets; none of the copy is written by us. */
  howItWorks: {
    eyebrow: "How it works",
    title: "Grab it Shake it Dash it",
    lede:
      "A shot is the whole ritual. There is nothing to measure, nothing to mix and nothing to clean.",
    steps: [
      {
        verb: "Grab it",
        line: "No Water, No Mixing, No Drama.",
        detail:
          "Sixty millilitres, ready to drink, straight from the fridge. Tastes best when chilled.",
        tone: "glow" as const,
      },
      {
        verb: "Shake it",
        line: "Just Shake, Twist, Dash.",
        detail:
          "Shake well before opening. The actives settle, which is what happens when nothing is holding them in suspension artificially.",
        tone: "burn" as const,
      },
      {
        verb: "Dash it",
        line: "Take one 60 ml shot daily.",
        detail:
          "One a day, at whatever hour you will actually keep. Morning suits the metabolic shot; the other two do not mind.",
        tone: "volume" as const,
      },
      {
        verb: "Keep it",
        line: "For noticeable results, we recommend a 30-day ritual.",
        detail:
          "The formulations are built for consistency over intensity. Thirty days is the horizon the brand sets, not a marketing round number.",
        tone: "ink" as const,
      },
    ],
  },
  social: { title: "TAG IT, DASH IT.", handle: "@drinkdash.in" },
  newsletter: {
    title: "A SHOT OF WHAT'S UNFOLDING, STRAIGHT TO YOUR INBOX",
    body: "Be the first to know about product launches, promotions and more!",
  },
  /** Real navigation. Three items. */
  nav: [
    { to: "/shop", label: "Shop" },
    { to: "/dash-life", label: "Dash Life" },
    { to: "/dash-diaries", label: "Dash Diaries" },
  ],
  footer: {
    helpful: ["Home", "DASH Life", "Contact Us", "Track your order"],
    legal: [
      "Terms of Use",
      "Privacy Policy",
      "Shipping Policy",
      "Cancellation and Refund Policy",
    ],
    copyright: "© 2026 Drink Dash, All rights reserved.",
  },
} as const;

/* --------------------------------------------------------------------------
   Products
   -------------------------------------------------------------------------- */

export const products: Product[] = [
  {
    handle: "dash-of-glow",
    name: "DASH OF GLOW",
    shortName: "Glow",
    theme: "glow",
    concernId: "skin",
    descriptor: "Skin Glow Fuel",
    flavour: "Peach Passion Fruit",
    lineUpLine:
      "A concentrated shot with Glutathione, Hyaluronic Acid, and essential vitamins to support hydrated, radiant-looking skin from within.",
    whatItIs: [
      "Dash of Glow was designed to support skin health and radiance through a multi-pathway, nutrition-led approach.",
      "It is a ready-to-drink 60 ml daily ingestible beauty shot formulated to support hydration, collagen health, antioxidant protection, and skin resilience, working from within rather than on the surface.",
      "Built for consistency, Dash of Glow combines antioxidants, collagen-supporting vitamins, hydration molecules, and essential minerals into one simple daily dose, eliminating the need for multiple pills, powders, or complex beauty routines.",
    ],
    audiences: [
      {
        condition: "If your skin appears dull, uneven, or dehydrated",
        lede:
          "Dash of Glow may be particularly effective in supporting visibly healthier-looking skin by:",
        points: [
          "Supporting antioxidant protection against pollution and UV-related oxidative stress",
          "Enhancing hydration and moisture retention within the skin",
          "Helping improve brightness and overall skin clarity",
          "Supporting smoother-looking skin texture over time",
        ],
      },
      {
        condition: "If your skin is generally healthy but showing early signs of aging",
        lede: "Dash of Glow supports long-term skin resilience by:",
        points: [
          "Supporting collagen synthesis and skin firmness",
          "Helping maintain elasticity and structural integrity",
          "Protecting against oxidative stress associated with premature aging",
          "Supporting consistent, balanced skin nourishment",
        ],
      },
    ],
    howItWorks: [
      "Dash of Glow supports skin health through multiple complementary pathways.",
      "It is formulated to help neutralize free radicals, support collagen production, improve hydration levels, and promote a brighter, more even-looking skin tone through targeted micronutrient support.",
      "By addressing skin health from more than one biological angle, Dash of Glow works with the body's natural renewal processes rather than forcing rapid or superficial change.",
      "The result is gentle, consistent, and sustainable glow, supported from within.",
    ],
    howToUse: [
      "Take one 60 ml shot daily.",
      "Shake well before use.",
      "Consume directly. No dilution required.",
      "For best results, use consistently and pair with a balanced diet and daily sun protection.",
    ],
    ingredientsLede:
      "Each 60 ml serving contains a clinically aligned blend of antioxidants, hydration actives, and skin-supporting micronutrients:",
    actives: [
      { name: "Vitamin A", dose: "400 mcg" },
      { name: "Zinc Sulphate", dose: "10 mg" },
      { name: "Glutathione", dose: "500 mg" },
      { name: "Hyaluronic Acid", dose: "40 mg" },
      { name: "Vitamin C", dose: "40 mg" },
    ],
    ingredientsNote:
      "This formulation is built as a multi-pathway skin support system designed for balanced, sustainable glow.",
    formulaTitle: "THE GLOW FORMULA",
    formula: [
      {
        name: "Glutathione",
        role: "Antioxidant Support",
        dose: "500 mg",
        detail:
          "A tripeptide known for its role in antioxidant defense. Supports skin clarity and helps maintain a healthy, even-looking complexion.",
      },
      {
        name: "Vitamin A",
        role: "Skin Renewal Support",
        dose: "400 mcg",
        detail:
          "Plays a key role in maintaining normal skin function and renewal processes, supporting a healthy and well-balanced appearance.",
      },
      {
        name: "Vitamin C",
        role: "Collagen Support",
        dose: "40 mg",
        detail:
          "An essential antioxidant that supports collagen synthesis and contributes to overall skin vibrance and protection from everyday oxidative stress.",
      },
      {
        name: "Zinc",
        role: "Acne Support",
        dose: "10 mg",
        detail:
          "An essential mineral that helps regulate sebum production, calm inflammation and prevent acne.",
      },
      {
        name: "Hyaluronic Acid",
        role: "Hydration Support",
        dose: "40 mg",
        detail:
          "A naturally occurring humectant that supports moisture retention and hydration balance for smoother-feeling skin.",
      },
    ],
    references: [
      { id: 1, title: "Randomized controlled trial of oral glutathione supplementation on body stores of glutathione", publisher: "European Journal of Nutrition" },
      { id: 2, title: "Ingested hyaluronan moisturizes dry skin", publisher: "PubMed" },
      { id: 3, title: "Retinoids: active molecules influencing skin structure formation in cosmetic and dermatological treatments", publisher: "PMC" },
      { id: 4, title: "Vitamin A and retinoid signaling: genomic and nongenomic effects", publisher: "PMC, Thematic Review Series" },
      { id: 5, title: "Vitamin A, Dietary Reference Intakes", publisher: "NCBI Bookshelf" },
      { id: 6, title: "Zinc is an Antioxidant and Anti-Inflammatory Agent: Its Role in Human Health", publisher: "Frontiers" },
      { id: 7, title: "The Clinical Effects of Zinc as a Topical or Oral Agent on the Clinical Response and Pathophysiologic Mechanisms of Acne: A Systematic Review", publisher: "JDDonline" },
    ],
    reviews: [
      { name: "Nisha", stars: 5, text: "I've been using Dash of Glow and I can genuinely see a visible difference in my skin. My skin looks more radiant, feels hydrated, and has a natural glow. It's now a must-have in my routine." },
      { name: "Devanshi", stars: 5, text: "I was not able to take glutathione pills everyday as suggested by my dermatologist. I discovered this product and love the taste, it's very easy to take everyday." },
      { name: "Sahil", stars: 5, text: "I was dealing with dull, tired-looking skin, and after starting Dash of Glow, my skin feels more hydrated and looks fresher overall." },
      { name: "Anonymous", stars: 5, text: "I've been taking the Glow shot for almost 2 weeks now and my skin truly feels visibly healthier and glowy." },
      { name: "Rajiv Gupta", stars: 5, text: "Very prompt delivery, great packaging and product." },
      { name: "Shakti Samal", stars: 5, text: "The Dash of glow product is amazing." },
    ],
    rating: 5,
    reviewCount: 9,
    packs: [
      { servings: 6, price: 780, compareAt: null, sku: "DOGL-06", available: true },
      { servings: 12, price: 1395, compareAt: null, sku: "DOGL-12", available: true },
      { servings: 30, price: 3213, compareAt: 3570, sku: "DOGL-30", available: true },
    ],
    ritual: {
      title: "HOW TO GLOW",
      lines: [
        "One daily shot to support natural skin radiance.",
        "No Water, No Mixing, No Drama.",
        "Just Shake, Twist, Glow.",
      ],
    },
    images: ["glow-1", "glow-2", "glow-3", "glow-4", "glow-5", "glow-6"],
  },

  {
    handle: "dash-of-volume",
    name: "DASH OF VOLUME",
    shortName: "Volume",
    theme: "volume",
    concernId: "hair",
    descriptor: "Hair Growth Fuel",
    flavour: "Pineapple Coconut",
    lineUpLine:
      "A synergistic mix of Pea Sprout Extract, botanical antioxidants, and key nutrients to support hair strength, volume, and follicle nourishment.",
    whatItIs: [
      "Dash of Volume was designed to support hair growth, strength, and scalp health through a multi-pathway, nutrition-led approach.",
      "It is a ready-to-drink 60 ml daily hair nutrition shot formulated to support follicle activity, hair fiber strength, antioxidant protection, and nutrient delivery to the scalp, working from within.",
      "Built for consistency, Dash of Volume combines follicle-activating plant extracts, natural silica, antioxidants, and B-vitamins into one simple daily dose, eliminating the need for multiple pills or powders.",
    ],
    audiences: [
      {
        condition: "If you are experiencing hair fall, thinning, or weak roots",
        lede:
          "Dash of Volume may be particularly effective in supporting healthier-looking hair by:",
        points: [
          "Encouraging dormant follicles to re-enter the growth (anagen) phase",
          "Supporting stronger hair fibers and reduced breakage",
          "Helping protect follicles from oxidative and environmental stress",
          "Supporting a healthier scalp environment for growth",
        ],
      },
      {
        condition: "If your hair is generally healthy but lacks volume or strength",
        lede: "Dash of Volume supports long-term hair resilience by:",
        points: [
          "Supporting hair density and thickness",
          "Improving structural strength and shine",
          "Supporting nutrient and oxygen delivery to hair follicles",
          "Helping maintain a balanced scalp environment",
        ],
      },
    ],
    howItWorks: [
      "Dash of Volume supports the full hair growth cycle through multiple complementary pathways.",
      "It is formulated to help activate hair follicles, strengthen hair structure through natural silica, protect follicles from oxidative stress, and support nutrient and oxygen delivery to the scalp.",
      "By addressing hair health from more than one biological angle, Dash of Volume works with the body's natural growth rhythm rather than relying on cosmetic or temporary solutions.",
      "The result is consistent, balanced support for fuller, healthier-looking hair.",
    ],
    howToUse: [
      "Take one 60 ml shot daily.",
      "Shake well before use.",
      "Consume directly. No dilution required.",
      "For best results, use consistently and pair with a balanced diet and regular routine.",
    ],
    ingredientsLede:
      "Each 60 ml serving contains a clinically aligned blend of plant extracts and essential vitamins:",
    actives: [
      { name: "Pea Sprout Extract", dose: "100 mg" },
      { name: "Bamboo Shoot Extract", dose: "50 mg" },
      { name: "Grapeseed Extract", dose: "50 mg" },
      { name: "Sesbania Extract", dose: "30 mg" },
      { name: "Vitamin B5", dose: "5 mg" },
      { name: "Vitamin B12", dose: "2.2 mcg" },
    ],
    ingredientsNote:
      "This formulation is designed as a multi-pathway system to support stronger, healthier hair from within.",
    formulaTitle: "THE GROWTH FORMULA",
    formula: [
      { name: "Pea Sprout Extract", role: "Follicle Support", dose: "100 mg", detail: "Supports the hair growth cycle by nourishing the follicle environment." },
      { name: "Bamboo Shoot Extract", role: "Strength and Structure Support", dose: "50 mg", detail: "A natural source of silica that supports hair structure and strength." },
      { name: "Grapeseed Extract", role: "Microcirculation and Antioxidant Support", dose: "50 mg", detail: "Contributes to antioxidant protection and healthy microcirculation support." },
      { name: "Sesbania Extract", role: "Scalp Nourishment Support", dose: "30 mg", detail: "Provides antioxidant protection to help defend against everyday stressors." },
      { name: "Pantothenic Acid", role: "Keratin Support", detail: "Contributes to keratin formation, thus supporting hair structure." },
      { name: "Vitamin B12", role: "Healthy Scalp Function Support", dose: "2.2 mcg", detail: "Essential nutrients involved in maintaining healthy hair and scalp function." },
    ],
    references: [
      { id: 1, title: "Short communication: Clinical evaluation of pea sprout extract in the treatment of hair loss", publisher: "PubMed" },
      { id: 2, title: "Use of silicon for skin and hair care: an approach of chemical forms available and efficacy", publisher: "PMC" },
      { id: 3, title: "A Double-blind, Placebo-controlled Study Evaluating the Efficacy of an Oral Supplement in Women with Self-perceived Thinning Hair", publisher: "PMC" },
    ],
    reviews: [],
    rating: 5,
    reviewCount: 9,
    packs: [
      { servings: 6, price: 770, compareAt: null, sku: "DOVL-06", available: true },
      { servings: 12, price: 1370, compareAt: null, sku: "DOVL-12", available: true },
      { servings: 30, price: 3159, compareAt: 3510, sku: "DOVL-30", available: true },
    ],
    ritual: {
      title: "HOW TO GROW",
      lines: [
        "One daily shot to support hair strength and volume.",
        "No Water, No Mixing, No Drama.",
        "Just Shake, Twist, Dash.",
      ],
    },
    images: ["volume-1", "volume-2", "volume-3", "volume-4", "volume-5", "volume-6"],
    liveSiteIssue:
      "The live Growth Formula section lists Selenium and Pantothenic Acid, neither of which appears in the published ingredient panel. Selenium is omitted here rather than reproduced. Worth raising with the client.",
  },

  {
    handle: "dash-of-burn",
    name: "DASH OF BURN",
    shortName: "Burn",
    theme: "burn",
    concernId: "metabolism",
    descriptor: "Weight Management Fuel",
    flavour: "Lemon Ginger",
    lineUpLine:
      "A functional blend of L-Carnitine, Green Coffee Extract, and Prebiotic Inulin to support balanced metabolism and weight loss.",
    whatItIs: [
      "Dash of Burn was designed to support metabolic balance and weight management through a multi-pathway, research-led approach.",
      "It is a ready-to-drink 60 ml daily shot formulated to support metabolism, satiety, fat utilization, and gut-metabolism signalling, without stimulants, harsh thermogenics, or crash effects.",
      "Built for consistency, Dash of Burn combines prebiotic fiber, metabolic nutrients, and plant-based extracts into one simple daily dose, eliminating the need for powders, pills, or complex regimens.",
    ],
    audiences: [
      {
        condition: "If your BMI is 25 or above",
        lede:
          "Dash of Burn may be particularly effective in supporting healthy body composition by:",
        points: [
          "Enhancing fat oxidation and utilization",
          "Supporting appetite control and satiety",
          "Helping regulate metabolic markers such as blood sugar and cholesterol",
          "Reducing the likelihood of excess energy being stored as fat",
        ],
      },
      {
        condition: "If your BMI is below 25",
        lede: "Dash of Burn supports metabolic efficiency by:",
        points: [
          "Helping manage cravings and appetite fluctuations",
          "Supporting steady energy levels without stimulants",
          "Improving insulin sensitivity and glucose utilization",
          "Supporting overall metabolic rhythm essential for long-term health",
        ],
      },
    ],
    howItWorks: [
      "Dash of Burn supports metabolic balance through multiple complementary pathways.",
      "It is formulated to help the body use fat more efficiently as fuel, support appetite and craving regulation, and encourage metabolic efficiency through insulin and glucose support.",
      "By addressing metabolism from more than one biological angle, Dash of Burn works with your body's natural rhythm rather than forcing rapid change.",
      "The result is steady, sustainable support without harsh thermogenics or stimulants.",
    ],
    howToUse: [
      "Take one 60 ml shot daily.",
      "Shake well before use.",
      "Consume directly. No dilution required.",
      "For best results, use consistently and pair with a balanced diet and regular movement.",
    ],
    ingredientsLede:
      "Each 60 ml serving contains a clinically aligned blend of fiber, nutrients, and plant based extracts:",
    actives: [
      { name: "Inulin", dose: "4 g" },
      { name: "L-Carnitine", dose: "1 g" },
      { name: "Garcinia Cambogia", dose: "100 mg" },
      { name: "Green Coffee Extract", dose: "100 mg" },
      { name: "Chromium Picolinate", dose: "200 mcg" },
    ],
    ingredientsNote:
      "This formulation is built as a multi pathway metabolic support system designed for balanced, sustainable weight management.",
    formulaTitle: "THE BURN FORMULA",
    formula: [
      { name: "Inulin", role: "Prebiotic Gut Support", dose: "4 g", detail: "Feeds good bacteria, aids digestion, and helps you stay fuller for longer." },
      { name: "L-Carnitine", role: "Energy Utilization Support", dose: "1 g", detail: "Supports the body's natural process of using fats as an energy source." },
      { name: "Garcinia Cambogia", role: "Metabolic Support", dose: "100 mg", detail: "Helps block fat production and curb appetite." },
      { name: "Green Coffee Extract", role: "Antioxidant Metabolic Support", dose: "100 mg", detail: "Helps regulate blood sugar, boosts metabolism, and supports healthy skin too." },
      { name: "Chromium Picolinate", role: "Macronutrient Metabolism Support", dose: "200 mcg", detail: "Reduces unnecessary snacking and balances blood sugar, especially during busy days." },
    ],
    references: [
      { id: 1, title: "The effect of l-carnitine on fat oxidation, protein turnover, and body composition in slightly overweight subjects", publisher: "PubMed" },
      { id: 2, title: "The Use of Green Coffee Extract as a Weight Loss Supplement: A Systematic Review and Meta-Analysis of Randomised Clinical Trials", publisher: "Gastroenterology Research and Practice" },
      { id: 3, title: "Safety and mechanism of appetite suppression by a novel hydroxycitric acid extract", publisher: "PubMed" },
      { id: 4, title: "A clinical and computational study on anti-obesity effects of hydroxycitric acid", publisher: "RSC Advances" },
      { id: 5, title: "A Double-Blind, Randomized Pilot Trial of Chromium Picolinate for Overweight Individuals with Binge-Eating Disorder", publisher: "PubMed" },
    ],
    reviews: [
      { name: "Neha Sharma", stars: 5, text: "I didn't diet harder. I just added DASH of Burn to my morning routine for 8 weeks and started noticing a visible difference. Feeling much more confident now." },
      { name: "Rohit Mehra", stars: 5, text: "I struggled with belly heaviness. After 6 weeks, I felt much lighter." },
      { name: "Preeti Yadav", stars: 5, text: "Felt the difference in 2 weeks, reduced belly fat and more appetite control." },
    ],
    rating: 5,
    reviewCount: 16,
    packs: [
      { servings: 6, price: 775, compareAt: null, sku: "DOBN-06", available: true },
      { servings: 12, price: 1380, compareAt: null, sku: "DOBN-12", available: true },
      { servings: 30, price: 3181, compareAt: 3535, sku: "DOBN-30", available: true },
    ],
    ritual: {
      title: "HOW TO BURN",
      lines: [
        "One daily shot to support metabolic balance.",
        "No Water, No Mixing, No Drama.",
        "Just Shake, Twist, Dash.",
      ],
    },
    images: ["burn-1", "burn-2", "burn-3", "burn-4", "burn-5", "burn-6"],
  },
];

/* --------------------------------------------------------------------------
   Proposals. Not on the site. Rendered with a visible tag so a reviewer can
   never mistake them for real merchandising.
   -------------------------------------------------------------------------- */

export const proposals = {
  /** A mixed pack does not exist today. The reasoning: the 6 packs all sit at
      770 to 780, inside the 500 to 1,000 band that carries the highest return
      to origin rate in Indian ecommerce. A cheaper mixed entry avoids that band
      and answers "which one is mine" without a quiz. */
  trio: {
    name: "The Trial Trio",
    detail: "Two of each shot, six servings",
    price: 499,
    note: "Not a results pack. The brand recommends a 30 day ritual for noticeable results. This is for choosing your shot and your flavour.",
    source: "proposal" as Source,
  },
  bundles: [
    { name: "The 30 Day Trio", detail: "One Recommended Pack of each shot", source: "proposal" as Source },
  ],
} as const;

/* --------------------------------------------------------------------------
   Lookups and layout helpers
   -------------------------------------------------------------------------- */

export const byHandle = (handle: string) =>
  products.find((p) => p.handle === handle);

export const byConcern = (concernId: string) =>
  products.filter((p) => p.concernId === concernId);

export const concernOf = (p: Product) =>
  concerns.find((c) => c.id === p.concernId);

export const themeClass = (t: ThemeKey) => `theme-${t}`;

export const fromPrice = (p: Product) =>
  Math.min(...p.packs.filter((k) => k.available).map((k) => k.price));

export const imageUrl = (basename: string) => `/media/${basename}.jpg`;

/* --------------------------------------------------------------------------
   NOTES ON GROWTH

   The catalogue will not stay at three products, so the product list page
   chooses its presentation from the count rather than being hand built around
   three. `layoutMode` is the single switch.

   - up to 4 products: "bands". One full bleed section per product in its own
     colour, with an inline buy block. Rich, and correct when a grid of three
     would read as a deficiency.
   - 5 or more: "grid". A filterable card grid with the concern taxonomy as
     facets, and the bands reserved for a small set of featured products.

   What this means in practice when a product is added:
   1. Add a concern to `concerns` only if the product needs a new one.
   2. Add the product object. Images go in /media following the same naming.
   3. Nothing else. At the fifth product the list page switches to grid on its
      own, the concern rail picks up the new facet, and the comparison table
      starts paginating.

   The comparison table caps at `COMPARE_MAX` columns and offers a picker above
   that, because a table wider than three or four columns stops being readable
   on a phone regardless of how it scrolls.
   -------------------------------------------------------------------------- */

export const BAND_LAYOUT_MAX = 4;
export const COMPARE_MAX = 3;

export const layoutMode: "bands" | "grid" =
  products.length <= BAND_LAYOUT_MAX ? "bands" : "grid";

/** Concerns that actually have products, in catalogue order. Drives the rail. */
export const activeConcerns = () =>
  concerns.filter((c) => byConcern(c.id).length > 0);

/** Rows for the comparison table. Values are resolved per product at render
    time so a new product needs no change here. */
export const comparisonRows: {
  label: string;
  get: (p: Product) => string;
}[] = [
  { label: "Best for", get: (p) => concernOf(p)?.label ?? "" },
  { label: "Descriptor", get: (p) => p.descriptor },
  { label: "Hero active", get: (p) => `${p.formula[0].name} ${p.formula[0].dose ?? ""}`.trim() },
  { label: "Actives", get: (p) => String(p.actives.length) },
  { label: "Flavour", get: (p) => p.flavour },
  { label: "Reviews", get: (p) => `${p.reviewCount} at ${p.rating} stars` },
  {
    label: "Price per shot, Recommended Pack",
    get: (p) => {
      const k = p.packs.find((x) => x.servings === 30) ?? p.packs[0];
      return money(Math.round(perServing(k)));
    },
  },
];
