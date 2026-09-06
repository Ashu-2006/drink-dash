/* ==========================================================================
   Shop filters and sort.

   State lives in the URL, not in a component. A filtered shop is a thing
   people paste into a chat, and query params make that free: back and forward
   walk the filter history, and a reload keeps the view. The cost is that every
   change is a navigation, which is why the sort and facet writes replace the
   current entry when only the sort changes and push when the facets do.

   The facets are derived from the catalogue rather than declared, so adding a
   product with a new concern or a new pack size makes it filterable without
   touching this file. Only the price bands are authored, because a band is a
   merchandising decision, not a fact about the data.
   ========================================================================== */

import {
  byConcern,
  concerns,
  fromPrice,
  packTiers,
  products,
} from "./catalog";
import type { Product } from "./catalog";

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price, low to high" },
  { key: "price-desc", label: "Price, high to low" },
  { key: "rating", label: "Best rated" },
];

export type ShopQuery = {
  concern: string[];
  /** Pack sizes in servings. */
  size: number[];
  /** Price band ids. */
  price: string[];
  inStock: boolean;
  sort: SortKey;
};

export const EMPTY_QUERY: ShopQuery = {
  concern: [],
  size: [],
  price: [],
  inStock: false,
  sort: "featured",
};

/* Authored, unlike the other facets. The bands sit either side of the 500 to
   1,000 range that carries the highest return-to-origin rate in Indian
   ecommerce, which is the same reasoning behind the Trial Trio being priced
   where it is. */
export const PRICE_BANDS = [
  { id: "under-1000", label: "Under 1,000", min: 0, max: 999 },
  { id: "1000-2000", label: "1,000 to 2,000", min: 1000, max: 2000 },
  { id: "over-2000", label: "Over 2,000", min: 2001, max: Infinity },
];

/* -------------------------------------------------------------------------- */

/** Every pack size present in the catalogue, in tier order. */
export const sizeFacets = () => {
  const present = new Set(products.flatMap((p) => p.packs.map((k) => k.servings)));
  return packTiers
    .filter((t) => present.has(t.servings))
    .map((t) => ({ servings: t.servings, label: t.name }));
};

export const concernFacets = () =>
  concerns
    .filter((c) => byConcern(c.id).length > 0)
    .map((c) => ({ id: c.id, label: c.label, count: byConcern(c.id).length }));

/* -------------------------------------------------------------------------- */

const inBand = (price: number, id: string) => {
  const band = PRICE_BANDS.find((b) => b.id === id);
  return band ? price >= band.min && price <= band.max : true;
};

/** A product matches a facet group if it matches ANY value within the group,
    and it must match EVERY group that has a value. Standard ecommerce faceting:
    OR inside a facet, AND across facets. Anything else surprises people. */
export function matches(p: Product, q: ShopQuery): boolean {
  if (q.concern.length && !q.concern.includes(p.concernId)) return false;

  const packs = q.inStock ? p.packs.filter((k) => k.available) : p.packs;
  if (q.inStock && packs.length === 0) return false;

  if (q.size.length && !packs.some((k) => q.size.includes(k.servings)))
    return false;

  if (q.price.length) {
    /* Price filters against the packs that survived the other filters, so
       "30 servings" plus "under 1,000" correctly returns nothing rather than
       matching on a trial pack the shopper has already excluded. */
    const eligible = q.size.length
      ? packs.filter((k) => q.size.includes(k.servings))
      : packs;
    if (!eligible.some((k) => q.price.some((id) => inBand(k.price, id))))
      return false;
  }
  return true;
}

export function applyQuery(q: ShopQuery): Product[] {
  const list = products.filter((p) => matches(p, q));
  switch (q.sort) {
    case "price-asc":
      return [...list].sort((a, b) => fromPrice(a) - fromPrice(b));
    case "price-desc":
      return [...list].sort((a, b) => fromPrice(b) - fromPrice(a));
    case "rating":
      return [...list].sort(
        (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount
      );
    case "featured":
    default:
      /* Featured is catalogue order. It is a decision someone made, so it is
         preserved rather than silently becoming alphabetical. */
      return list;
  }
}

/* --------------------------------------------------------------------------
   Option counts.

   Every option carries the number of shots it would return. This is the fix
   for the worst thing a filter can do, which is let someone select a value
   that empties the page: a count of zero is visible before the click, and the
   control is disabled, so the dead end is never reachable rather than being
   apologised for afterwards.

   Semantics are the ecommerce standard. A count is measured with that option
   as the only selection in its OWN group, while every other group stays
   applied. Because values inside a group are ORed, a count is a lower bound
   once something in the same group is already selected: adding a second
   concern can only widen the result. Showing the lower bound is right, since
   the number then never promises more than it delivers.
   -------------------------------------------------------------------------- */

export type FacetCounts = {
  concern: Record<string, number>;
  size: Record<number, number>;
  price: Record<string, number>;
  inStock: number;
};

export function optionCounts(q: ShopQuery): FacetCounts {
  const count = (patch: Partial<ShopQuery>) =>
    products.filter((p) => matches(p, { ...q, ...patch })).length;

  const concern: Record<string, number> = {};
  for (const c of concernFacets()) concern[c.id] = count({ concern: [c.id] });

  const size: Record<number, number> = {};
  for (const s of sizeFacets()) size[s.servings] = count({ size: [s.servings] });

  const price: Record<string, number> = {};
  for (const b of PRICE_BANDS) price[b.id] = count({ price: [b.id] });

  return { concern, size, price, inStock: count({ inStock: true }) };
}

/** Total catalogue size, for the "n of m" readout. */
export const totalCount = () => products.length;

/** Clears the facets and keeps the sort. Sort is a view preference, not a
    filter, so a clear-all that reset it would be destroying something the
    shopper did not ask to undo. */
export const clearFacets = (q: ShopQuery): ShopQuery => ({
  ...EMPTY_QUERY,
  sort: q.sort,
});

export const activeCount = (q: ShopQuery) =>
  q.concern.length + q.size.length + q.price.length + (q.inStock ? 1 : 0);

/* -------------------------------------------------------------------------- */

const isSort = (v: string): v is SortKey => SORTS.some((s) => s.key === v);

/** Read the query out of a URLSearchParams. Unknown values are dropped rather
    than trusted: the string comes from the address bar. */
export function parseQuery(params: URLSearchParams): ShopQuery {
  const list = (key: string) =>
    (params.get(key) ?? "").split(",").filter(Boolean);

  const validConcerns = new Set(concerns.map((c) => c.id));
  const validSizes = new Set(sizeFacets().map((s) => s.servings));
  const validBands = new Set(PRICE_BANDS.map((b) => b.id));
  const sort = params.get("sort") ?? "";

  return {
    concern: list("concern").filter((c) => validConcerns.has(c)),
    size: list("size")
      .map(Number)
      .filter((n) => validSizes.has(n)),
    price: list("price").filter((p) => validBands.has(p)),
    inStock: params.get("stock") === "1",
    sort: isSort(sort) ? sort : "featured",
  };
}

/** Serialise back to params, omitting defaults so a clean shop URL stays
    clean rather than carrying ?concern=&size=&sort=featured. */
export function toParams(q: ShopQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.concern.length) p.set("concern", q.concern.join(","));
  if (q.size.length) p.set("size", q.size.join(","));
  if (q.price.length) p.set("price", q.price.join(","));
  if (q.inStock) p.set("stock", "1");
  if (q.sort !== "featured") p.set("sort", q.sort);
  return p;
}

/** Toggle one value inside one facet group. */
export function toggle<K extends "concern" | "price">(
  q: ShopQuery,
  key: K,
  value: string
): ShopQuery {
  const has = q[key].includes(value);
  return {
    ...q,
    [key]: has ? q[key].filter((v) => v !== value) : [...q[key], value],
  };
}

export function toggleSize(q: ShopQuery, servings: number): ShopQuery {
  const has = q.size.includes(servings);
  return {
    ...q,
    size: has ? q.size.filter((v) => v !== servings) : [...q.size, servings],
  };
}
