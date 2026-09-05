/* ==========================================================================
   The Dash Diaries.

   Article bodies are transcribed from the live posts at
   drinkdash.in/blogs/news. Superscript reference markers are kept because the
   articles cite real literature and stripping them would turn a referenced
   claim into a bare one. Em dashes are normalised to commas and full stops,
   which is the same convention the rest of catalog.ts follows.

   Nothing here is invented. Where the live post carries a figure, the figure
   is the post's own.
   ========================================================================== */

import type { ThemeKey } from "./catalog";

/** Slug generator, so a title and its URL can never drift apart. */
export const diarySlug = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export type DiaryBlock =
  | { kind: "text"; body: string }
  | { kind: "list"; items: string[] };

export type DiarySection = {
  heading?: string;
  blocks: DiaryBlock[];
};

export type Diary = {
  slug: string;
  title: string;
  /** The standfirst the blog index shows under the title. */
  dek: string;
  /** Publication date as printed on the live post. */
  date: string;
  /** ISO form, for <time datetime> and for sorting. */
  iso: string;
  readingMinutes: number;
  theme: ThemeKey;
  /** The shot the article is about, so an article can sell. */
  productHandle: string;
  /** Image basename in /media. Reuses product photography. */
  image: string;
  sections: DiarySection[];
};

/* -------------------------------------------------------------------------- */

const glutathione: Diary = {
  slug: "understanding-glutathione-the-molecular-foundation-of-detoxification",
  title: "Understanding Glutathione: The Molecular Foundation of Detoxification",
  dek: "A master antioxidant, quietly strengthening detox, defending cells, and elevating your natural glow.",
  date: "November 26, 2025",
  iso: "2025-11-26",
  readingMinutes: 4,
  theme: "glow",
  productHandle: "dash-of-glow",
  image: "glow-1",
  sections: [
    {
      blocks: [
        {
          kind: "text",
          body: "In the world of wellness trends and detox buzz words, one molecule quietly plays a leading role behind the scenes: glutathione. Often overlooked because it is not tied to flashy cleanses or overnight fixes, glutathione is in fact a cornerstone of the body's detoxification and antioxidant systems. In short, it matters more than many realise.",
        },
      ],
    },
    {
      heading: "What Glutathione Actually Does",
      blocks: [
        {
          kind: "text",
          body: "Glutathione (GSH) is a tripeptide composed of glutamate, cysteine and glycine¹. It is produced primarily in the liver and found in nearly every cell of the body². Often referred to as the master antioxidant, it plays a key role in maintaining redox balance, regenerating other antioxidants, and supporting enzymatic detoxification³.",
        },
        {
          kind: "text",
          body: "One of its central functions is conjugating toxins, pollutants and reactive intermediates, transforming them into water soluble compounds for excretion⁴. When glutathione levels fall, the body's ability to neutralize free radicals and clear environmental burdens such as pollutants, processed foods and stress induced oxidative species declines⁵.",
        },
      ],
    },
    {
      heading: "Why Glutathione Matters in Modern Wellness",
      blocks: [
        {
          kind: "text",
          body: "Modern lifestyles place continuous demands on the body's detox and repair systems. Chronic exposure to pollution, poor diet, ultraviolet radiation, alcohol consumption, and aging all deplete glutathione stores⁵. Reduced GSH availability impairs detoxification efficiency and contributes to oxidative damage, fatigue, and compromised immune response⁵.",
        },
        {
          kind: "text",
          body: "Supporting glutathione levels, whether through precursors like N acetyl cysteine or balanced nutrition, helps sustain resilience and cellular repair capacity.",
        },
      ],
    },
    {
      heading: "The Science Connecting Detox to Wellness",
      blocks: [
        {
          kind: "text",
          body: "Detoxification is not limited to liver function, it also manifests in skin health and overall vitality. Lower glutathione levels are associated with increased oxidative damage in skin cells, impaired elasticity and uneven tone⁶.",
        },
        {
          kind: "text",
          body: "Clinical and laboratory research suggests that supporting GSH can improve the skin's oxidative balance. Topical application of glutathione amino acid precursors has been shown to enhance the GSH/GSSG ratio in skin cells and protect against environmental stress⁷. A systematic review of clinical studies also found topical and oral glutathione significantly reduced melanin index and improved brightness compared with placebo⁸.",
        },
        {
          kind: "text",
          body: "Thus, glutathione's impact is both internal and external. Supporting detox pathways can reflect outwardly as a more radiant, resilient complexion.",
        },
      ],
    },
    {
      heading: "Why Supporting Glutathione Makes Sense",
      blocks: [
        {
          kind: "text",
          body: "Scientific evidence supports glutathione's role in supporting key physiological systems:",
        },
        {
          kind: "list",
          items: [
            "Antioxidant defense: GSH neutralizes reactive oxygen species and maintains redox homeostasis⁵.",
            "Detoxification: It binds to heavy metals and xenobiotics for safe elimination¹⁰.",
            "Mitochondrial support: By buffering oxidative stress, GSH helps preserve mitochondrial integrity and energy production⁵.",
          ],
        },
      ],
    },
  ],
};

const anagain: Diary = {
  slug: "from-the-root-up-how-ingestible-anagain-is-shifting-hair-care",
  title:
    "From the Root Up: How Ingestible AnaGain Is Shifting Hair Care From Surface Fixes to Follicle-Level Science",
  dek: "Targeting follicles from within to spark stronger growth, fuller strands, and true root-level renewal.",
  date: "November 26, 2025",
  iso: "2025-11-26",
  readingMinutes: 5,
  theme: "volume",
  productHandle: "dash-of-volume",
  image: "volume-1",
  sections: [
    {
      blocks: [
        {
          kind: "text",
          body: "Most hair serums promise visible results from the outside. They may coat the hair shaft, reduce frizz, or add shine, but they rarely address the real origin of healthy hair: the follicle itself.",
        },
        {
          kind: "text",
          body: "AnaGain, a clinically studied extract derived from organic pea sprouts (Pisum sativum), is changing that perspective. Once used only in topical serums, AnaGain is now available in an ingestible format through Dash of Volume, a liquid wellness shot formulated to promote stronger, thicker hair from within. This evolution moves hair care from surface-level promises to root-level science, making it one of the most forward-thinking approaches in modern beauty wellness.",
        },
      ],
    },
    {
      heading: "What Is AnaGain and How Does It Work",
      blocks: [
        {
          kind: "text",
          body: "AnaGain is standardized to deliver phytonutrients that activate dormant hair follicles¹. These compounds influence dermal papilla cells, which lie at the follicle base and regulate hair cycle transitions.",
        },
        {
          kind: "text",
          body: "Clinical research demonstrates that AnaGain significantly boosts two essential signaling proteins: FGF7 (fibroblast growth factor 7) and Noggin, both key to initiating the shift from the resting (telogen) phase to the growth (anagen) phase². In a 2020 Phytotherapy Research trial, participants using pea sprout extract for eight weeks saw FGF7 increase by 56 percent and Noggin by 85 percent² ³. The study also recorded a meaningful reduction in hair loss (p < 0.002).",
        },
      ],
    },
    {
      heading: "Why Ingestible AnaGain Is Different",
      blocks: [
        {
          kind: "text",
          body: "Hair health depends on much more than scalp care. Internal factors such as nutrient status, oxidative stress, hormonal shifts and microcirculation directly affect follicular vitality⁴.",
        },
        {
          kind: "text",
          body: "Topical products act locally, but ingestible AnaGain works systemically. Once absorbed, its active molecules circulate through the bloodstream to reach the follicles⁵. This route allows the extract to influence dermal papilla cells directly, complementing topical care and nourishing the roots from within.",
        },
        {
          kind: "text",
          body: "Emerging evidence supports the value of ingestible botanicals for hair. Reviews in Frontiers in Pharmacology and Nutrients report that bioavailable plant peptides and polyphenols improve scalp microcirculation, redox balance and follicular activity when consumed orally⁶ ⁷.",
        },
      ],
    },
    {
      heading: "Nutrients That Complete The Hair Growth Equation",
      blocks: [
        {
          kind: "text",
          body: "While AnaGain is the hero ingredient, Dash of Volume combines it with complementary nutrients addressing structure, protection and renewal:",
        },
        {
          kind: "list",
          items: [
            "Bamboo Shoot Extract, naturally rich in silica, reinforces keratin networks and enhances strength and elasticity⁸.",
            "Grape Seed Extract, abundant in proanthocyanidins, supports scalp blood flow and protects against oxidative stress⁹.",
            "B Vitamins (B5 and B12) and Selenium fuel keratin production and cellular metabolism essential for a healthy scalp¹⁰ ¹¹.",
          ],
        },
        {
          kind: "text",
          body: "Together, these components create a synergistic formula that supports the full ecosystem behind resilient hair, from nutrient delivery and follicle stimulation to strand integrity.",
        },
      ],
    },
    {
      heading: "The Future Of Hair Care: From External to Internal",
      blocks: [
        {
          kind: "text",
          body: "Consumers are moving beyond quick fix cosmetics toward clinically grounded wellness that nurtures beauty from the inside out. Hair health follows the same principle: true improvement comes from restoring biological balance rather than masking surface symptoms.",
        },
        {
          kind: "text",
          body: "Dash of Volume represents this shift by offering a plant-based, scientifically supported formulation that connects internal resilience with visible vitality. Consistent use helps strengthen strands, improve density and promote long term follicular wellness.",
        },
        {
          kind: "text",
          body: "Healthy, radiant hair begins beneath the surface. By targeting growth at the cellular level, ingestible AnaGain transforms the future of beauty, proving that real strength grows from the root up.",
        },
      ],
    },
  ],
};

const metabolism: Diary = {
  slug: "metabolism-in-motion-l-carnitine-and-green-coffee-extract",
  title:
    "Metabolism in Motion: How L-Carnitine and Green Coffee Extract Help Your Body Work Smarter",
  dek: "Fueling efficient energy, balanced metabolism, and smarter fat use, right where your body needs it most.",
  date: "November 26, 2025",
  iso: "2025-11-26",
  readingMinutes: 5,
  theme: "burn",
  productHandle: "dash-of-burn",
  image: "burn-1",
  sections: [
    {
      heading: "What Is Metabolic Balance and Why Does It Matter",
      blocks: [
        {
          kind: "text",
          body: "Metabolism is the body's engine. It converts the food you eat into energy that powers every cell, organ, and function. When this system is in sync, your body efficiently balances energy intake, fat burning, and blood sugar regulation. This optimal state is known as metabolic balance.",
        },
        {
          kind: "text",
          body: "However, daily stress, poor diet, lack of sleep, and aging can disrupt this balance. That is why targeted nutritional support has become an important part of modern wellness routines. Formulated with clinically studied ingredients, Dash of Burn is a liquid wellness shot designed to support natural energy production and fat metabolism without harsh stimulants.",
        },
      ],
    },
    {
      heading: "L-Carnitine: A Key Driver of Fat Metabolism",
      blocks: [
        {
          kind: "text",
          body: "L-Carnitine is a naturally occurring amino acid derivative that plays a critical role in fat metabolism. Its primary function is to transport long chain fatty acids into the mitochondria of cells, where they are converted into usable energy¹.",
        },
        {
          kind: "text",
          body: "This fat to fuel conversion is particularly important during exercise, fasting, or when metabolism slows with age. Clinical studies show that L-Carnitine supplementation can increase fat oxidation, enhance endurance, and improve metabolic flexibility² ³. In one study, 750 milligrams of L-Carnitine significantly increased fat oxidation during post exercise recovery without affecting total energy expenditure⁴.",
        },
        {
          kind: "text",
          body: "In simple terms, L-Carnitine acts as an internal shuttle system, moving stored fat into the mitochondria so it can be efficiently used as fuel.",
        },
      ],
    },
    {
      heading: "Green Coffee Extract: Natural Support for Blood Sugar and Fat Use",
      blocks: [
        {
          kind: "text",
          body: "Green Coffee Extract is derived from unroasted coffee beans and is rich in chlorogenic acids (CGAs), powerful antioxidant compounds that help regulate blood sugar, support liver fat metabolism, and provide mild thermogenic activity⁵.",
        },
        {
          kind: "text",
          body: "Because green coffee contains less caffeine than roasted coffee, it provides smoother energy support without overstimulation⁶. Clinical evidence suggests that CGA rich green coffee extract can improve body composition and metabolic markers. A 2023 systematic review found that daily supplementation with 500 milligrams of CGAs reduced body weight and improved insulin sensitivity⁷.",
        },
        {
          kind: "text",
          body: "When used consistently, green coffee extract helps the body respond more efficiently to carbohydrates and fats, promoting steadier energy and balanced metabolism.",
        },
      ],
    },
    {
      heading: "How They Work Better Together",
      blocks: [
        {
          kind: "text",
          body: "The effects of L-Carnitine and green coffee extract are complementary. L-Carnitine enhances fat oxidation and energy production, while green coffee extract supports glucose metabolism and mild thermogenesis.",
        },
        {
          kind: "text",
          body: "In a liquid shot format like Dash of Burn, these nutrients are absorbed quickly and distributed through the bloodstream. This allows the active compounds to be available when the body needs them most, such as in the morning or during physical activity.",
        },
      ],
    },
    {
      heading: "Added Ingredients That Reinforce Results",
      blocks: [
        {
          kind: "text",
          body: "Metabolism is a whole body system, which is why Dash of Burn includes additional support nutrients:",
        },
        {
          kind: "list",
          items: [
            "Inulin, a prebiotic fiber that supports gut health and overall metabolic function⁸.",
            "Chromium Picolinate, which helps stabilize blood sugar and may reduce sugar cravings⁹.",
            "Garcinia Cambogia Extract, traditionally used to support appetite control and limit fat accumulation¹⁰.",
          ],
        },
        {
          kind: "text",
          body: "Together, these nutrients create a comprehensive metabolic support formula that aligns with the body's natural energy systems.",
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */

export const diaries: Diary[] = [glutathione, anagain, metabolism];

export const diaryBySlug = (slug: string) => diaries.find((d) => d.slug === slug);

/** Everything except the one being read, newest first. */
export const otherDiaries = (slug: string) => diaries.filter((d) => d.slug !== slug);
