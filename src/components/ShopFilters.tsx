/* ==========================================================================
   Shop filter bar.

   Chips, not a sidebar. The catalogue is small enough that every facet fits on
   one line at desktop width, and a sidebar would spend a quarter of the page
   on four controls. If the facet count grows past what one wrapped row can
   hold, this becomes a drawer on mobile and a rail on desktop; the state model
   in lib/shopFilters.ts does not change either way.

   States built: none selected, some selected, everything filtered out,
   and a filter set restored from a shared URL.
   ========================================================================== */

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PRICE_BANDS,
  SORTS,
  activeCount,
  applyQuery,
  concernFacets,
  parseQuery,
  sizeFacets,
  toParams,
  toggle,
  toggleSize,
} from "../lib/shopFilters";
import type { ShopQuery } from "../lib/shopFilters";
import type { Product } from "../lib/catalog";
import "./shopfilters.css";

export function useShopQuery(): {
  query: ShopQuery;
  results: Product[];
  set: (next: ShopQuery, replace?: boolean) => void;
} {
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => parseQuery(params), [params]);
  const results = useMemo(() => applyQuery(query), [query]);

  const set = (next: ShopQuery, replace = false) =>
    setParams(toParams(next), { replace, preventScrollReset: true });

  return { query, results, set };
}

export function ShopFilters({
  query,
  results,
  set,
}: {
  query: ShopQuery;
  results: Product[];
  set: (next: ShopQuery, replace?: boolean) => void;
}) {
  const n = activeCount(query);
  const sizes = sizeFacets();
  const concernsList = concernFacets();

  return (
    <div className="filters">
      <div className="filters__groups">
        <Group label="Concern">
          {concernsList.map((c) => (
            <Chip
              key={c.id}
              on={query.concern.includes(c.id)}
              onClick={() => set(toggle(query, "concern", c.id))}
            >
              {c.label}
            </Chip>
          ))}
        </Group>

        <Group label="Pack">
          {sizes.map((s) => (
            <Chip
              key={s.servings}
              on={query.size.includes(s.servings)}
              onClick={() => set(toggleSize(query, s.servings))}
            >
              {s.label} <span className="t-data">{s.servings}</span>
            </Chip>
          ))}
        </Group>

        <Group label="Price">
          {PRICE_BANDS.map((b) => (
            <Chip
              key={b.id}
              on={query.price.includes(b.id)}
              onClick={() => set(toggle(query, "price", b.id))}
            >
              {b.label}
            </Chip>
          ))}
        </Group>

        {/* Availability is not a price band. Grouping it under Price read as a
            fourth price tier. */}
        <Group label="Availability">
          <Chip
            on={query.inStock}
            onClick={() => set({ ...query, inStock: !query.inStock })}
          >
            In stock
          </Chip>
        </Group>
      </div>

      <div className="filters__end">
        {/* The count is a live region: filtering with the keyboard otherwise
            changes the page silently. */}
        <p className="t-body-s filters__count" role="status" aria-live="polite">
          {results.length} of {concernsList.reduce((t, c) => t + c.count, 0)} shots
        </p>

        <label className="filters__sort t-body-s">
          <span className="t-label t-muted">Sort</span>
          <select
            value={query.sort}
            /* Sort replaces rather than pushes: nobody wants four back presses
               to undo cycling through a sort menu. */
            onChange={(e) =>
              set({ ...query, sort: e.target.value as ShopQuery["sort"] }, true)
            }
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {n > 0 && (
          <button
            className="chip chip--outline"
            onClick={() => set({ ...query, concern: [], size: [], price: [], inStock: false })}
          >
            Clear {n}
          </button>
        )}
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="filters__group">
      <legend className="t-label t-muted">{label}</legend>
      <div className="filters__chips">{children}</div>
    </fieldset>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`chip${on ? " chip--active" : " chip--outline"}`}
      aria-pressed={on}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Shown in place of the product list when the facets exclude everything. It
    offers the way out rather than only reporting the dead end. */
export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className="filters__none">
      <p className="t-heading-s">No shots match those filters</p>
      <p className="t-body-s t-muted">
        The catalogue is three shots, so narrow combinations run out quickly.
        Clearing the pack size usually brings results back.
      </p>
      <button className="chip" onClick={onClear}>
        Clear all filters
      </button>
    </div>
  );
}
