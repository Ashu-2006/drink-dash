/* ==========================================================================
   Search.

   The catalogue is three products, a handful of packs, three concerns and
   three articles. That is small enough that the right index is an array built
   once at module load and scanned on every keystroke: no library, no worker,
   no debounce theatre. If the catalogue reaches the hundreds this file is
   where the trade changes, and the note at the bottom says what to do then.

   Matching is token-prefix, not substring. "gluta" should find Glutathione;
   "tathione" should not, because nobody types the middle of a word and
   substring matching is what makes a search box return nonsense. Fields carry
   weights so a product name outranks a mention of the same word buried in an
   ingredient note.
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  concerns,
  fromPrice,
  products,
  tierFor,
} from "./catalog";
import { diaries } from "./diaries";

export type ResultKind = "product" | "concern" | "article" | "page";

export type SearchDoc = {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  to: string;
  image: string | null;
  theme: string | null;
  /** [text, weight] pairs. Higher weight wins ties. */
  fields: [string, number][];
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    /* Strip combining marks so "AnaGain™" and "anagain" are the same word, and
       punctuation so "L-Carnitine" is findable as "carnitine". */
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokens = (s: string) => (norm(s) ? norm(s).split(" ") : []);

/* -------------------------------------------------------------------------- */

function buildIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const p of products) {
    const concern = concerns.find((c) => c.id === p.concernId);
    docs.push({
      id: `product:${p.handle}`,
      kind: "product",
      title: p.name,
      subtitle: `${p.descriptor} · from ${fromPrice(p)}`,
      to: `/products/${p.handle}`,
      image: p.images[0] ?? null,
      theme: p.theme,
      fields: [
        [p.name, 10],
        [p.shortName, 9],
        [p.descriptor, 6],
        [p.flavour, 5],
        [concern?.label ?? "", 5],
        [concern?.question ?? "", 3],
        [p.actives.map((a) => a.name).join(" "), 6],
        [p.formula.map((f) => f.name).join(" "), 6],
        [p.lineUpLine, 2],
        [p.packs.map((k) => tierFor(k.servings)?.name ?? "").join(" "), 2],
      ],
    });
  }

  for (const c of concerns) {
    docs.push({
      id: `concern:${c.id}`,
      kind: "concern",
      title: c.label,
      subtitle: c.question,
      to: `/shop#concern-${c.id}`,
      image: null,
      theme: null,
      fields: [
        [c.label, 10],
        [c.question, 5],
      ],
    });
  }

  for (const d of diaries) {
    docs.push({
      id: `article:${d.slug}`,
      kind: "article",
      title: d.title,
      subtitle: d.dek,
      to: `/dash-diaries/${d.slug}`,
      image: d.image,
      theme: d.theme,
      fields: [
        [d.title, 9],
        [d.dek, 4],
        /* Section headings are the article's own table of contents, which is
           the cheapest useful body signal without indexing whole paragraphs. */
        [d.sections.map((sec) => sec.heading ?? "").join(" "), 5],
      ],
    });
  }

  docs.push(
    {
      id: "page:dash-life",
      kind: "page",
      title: "Dash Life",
      subtitle: "Why DASH exists, and how the formulations are made",
      to: "/dash-life",
      image: null,
      theme: null,
      fields: [
        ["Dash Life about us story", 8],
        ["formulation research science testing GMP ingredients", 4],
      ],
    },
    {
      id: "page:shop",
      kind: "page",
      title: "Shop",
      subtitle: "All three shots, every pack size",
      to: "/shop",
      image: null,
      theme: null,
      fields: [["shop all products packs buy", 8]],
    }
  );

  return docs;
}

const INDEX = buildIndex();

/* Pre-tokenise once. Doing it per keystroke would re-normalise the whole
   catalogue on every character typed. */
const TOKENISED = INDEX.map((doc) => ({
  doc,
  fields: doc.fields.map(([text, weight]) => ({ tokens: tokens(text), weight })),
}));

export type SearchResult = { doc: SearchDoc; score: number };

export function searchAll(query: string, limit = 8): SearchResult[] {
  const qs = tokens(query);
  if (!qs.length) return [];

  const hits: SearchResult[] = [];
  for (const entry of TOKENISED) {
    let score = 0;
    /* Every query token must hit something, so "glow pack" does not match a
       document that only knows about "glow". */
    const matchedAll = qs.every((q) => {
      let best = 0;
      for (const field of entry.fields) {
        for (const t of field.tokens) {
          if (t === q) best = Math.max(best, field.weight * 2);
          else if (t.startsWith(q)) best = Math.max(best, field.weight);
        }
      }
      score += best;
      return best > 0;
    });
    if (matchedAll) hits.push({ doc: entry.doc, score });
  }

  /* This is a shop, so a buyable thing outranks a piece of writing about it.
     Applied as a multiplier rather than a tie-break: "gluta" hits the word in
     an article title (a high-weight field) and in a product's ingredient list
     (a lower-weight one), so a pure score sort puts the article first and the
     shot the article is selling second. The multiplier is small enough that a
     genuinely better article match still wins. */
  const kindWeight: Record<ResultKind, number> = {
    product: 1.4,
    concern: 1.1,
    page: 0.95,
    article: 0.9,
  };
  const order: Record<ResultKind, number> = {
    product: 0,
    concern: 1,
    page: 2,
    article: 3,
  };
  return hits
    .map((h) => ({ ...h, score: h.score * kindWeight[h.doc.kind] }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        order[a.doc.kind] - order[b.doc.kind] ||
        a.doc.title.localeCompare(b.doc.title)
    )
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */

type SearchApi = {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
};

const SearchContext = createContext<SearchApi | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [query, setQuery] = useState("");

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    /* Closing clears the query. Reopening onto a stale search reads as a bug,
       and the result list is cheap enough to rebuild. */
    if (!next) setQuery("");
  }, []);

  const results = useMemo(() => searchAll(query), [query]);

  const value = useMemo(
    () => ({ open, setOpen, query, setQuery, results }),
    [open, setOpen, query, results]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchApi {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}

/* --------------------------------------------------------------------------
   WHEN THIS STOPS BEING THE RIGHT ANSWER

   A linear scan over a pre-tokenised array is fine to roughly a thousand
   documents on a mid-range phone. Past that, the fix is not a bigger loop: it
   is an inverted index (token to document ids) built at module load, which
   turns the scan into a set intersection. That is about forty lines and no
   dependency. Reach for a library only when the requirement becomes fuzzy
   matching or typo tolerance, which is a genuinely different problem.
   -------------------------------------------------------------------------- */
