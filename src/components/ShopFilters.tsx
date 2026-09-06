/* ==========================================================================
   Shop filter bar.

   The old bar put every facet at tier one: four labelled groups, ten controls,
   two rows, for a catalogue of three products. The filter UI outweighed the
   thing being filtered. This splits it.

     Tier 1, no clicks     Concern, and the In stock toggle.
     Tier 2, one click     Pack and Price, behind labelled triggers.
     Always visible        The result count, the sort, and the way out.

   Concern earns tier one because it is the only facet that maps to why someone
   is shopping, and across three shots it is effectively the product picker.
   In stock earns it because it is a single toggle: putting one control behind
   a disclosure costs more than it saves. Pack and Price are three options each
   that most visits never touch, which is the definition of tier two.

   Mechanism: an anchored popover, not an accordion. An accordion would push
   the product grid down the page every time a filter opened, so the thing
   being filtered would move while you filtered it. The popover leaves the grid
   where it is. Below 768px it becomes a bottom sheet, because a popover
   anchored inside a wrapped row has nowhere good to go on a phone.

   Every option carries its own result count and options that would return
   nothing are disabled, so a dead end cannot be selected. That is the fix for
   the "drill to nothing" failure: the shopper learns a combination is empty
   before spending a click on it, not after.

   No SectionHead. This is a control bar inside the Shop page, under that
   page's own heading, not a section of its own.

   States built: nothing selected, some selected, a group fully selected, an
   option that would return zero, everything filtered out, a set restored from
   a shared URL, keyboard-only, touch, and reduced motion.
   ========================================================================== */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PRICE_BANDS,
  SORTS,
  activeCount,
  applyQuery,
  clearFacets,
  concernFacets,
  optionCounts,
  parseQuery,
  sizeFacets,
  toParams,
  toggle,
  toggleSize,
  totalCount,
} from "../lib/shopFilters";
import type { ShopQuery } from "../lib/shopFilters";
import type { Product } from "../lib/catalog";
import { CaretIcon, CloseIcon } from "./icons";
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

/* -------------------------------------------------------------------------- */

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
  const counts = optionCounts(query);
  const total = totalCount();

  /* One open menu at a time. Two popovers open at once in a single row is a
     layout problem and a focus problem, and nobody wants both. */
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="filters">
      <div className="filters__bar">
        {/* Tier 1. Labelled for assistive tech; the labels read as a set
            visually without a legend above each one. */}
        <div className="filters__lead">
          <span className="t-label t-muted filters__legend" id="f-concern">
            Concern
          </span>
          <div className="filters__chips" role="group" aria-labelledby="f-concern">
            {concernsList.map((c) => (
              <Chip
                key={c.id}
                on={query.concern.includes(c.id)}
                count={counts.concern[c.id]}
                onClick={() => set(toggle(query, "concern", c.id))}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <span className="filters__rule" aria-hidden="true" />

        <FacetMenu
          label="Pack"
          id="pack"
          open={open}
          setOpen={setOpen}
          selected={query.size.length}
        >
          {sizes.map((s) => (
            <Option
              key={s.servings}
              name="pack"
              on={query.size.includes(s.servings)}
              count={counts.size[s.servings]}
              onChange={() => set(toggleSize(query, s.servings))}
            >
              {s.label}{" "}
              <span className="t-data filters__opt-meta">{s.servings}</span>
            </Option>
          ))}
        </FacetMenu>

        <FacetMenu
          label="Price"
          id="price"
          open={open}
          setOpen={setOpen}
          selected={query.price.length}
        >
          {PRICE_BANDS.map((b) => (
            <Option
              key={b.id}
              name="price"
              on={query.price.includes(b.id)}
              count={counts.price[b.id]}
              onChange={() => set(toggle(query, "price", b.id))}
            >
              {b.label}
            </Option>
          ))}
        </FacetMenu>

        {/* One control, so it stays a chip. A disclosure holding a single
            checkbox is a click that buys nothing. */}
        <Chip
          on={query.inStock}
          count={counts.inStock}
          onClick={() => set({ ...query, inStock: !query.inStock })}
        >
          In stock
        </Chip>

        <span className="filters__gap" />

        {/* The count is a live region: filtering with the keyboard otherwise
            changes the page silently. The key is what replays the digit
            animation. React remounting the node is the reflow, so the manual
            `void el.offsetWidth` trick is not needed. */}
        <p className="filters__count t-body-s" role="status" aria-live="polite">
          <span key={results.length} className="filters__count-n t-data">
            {results.length}
          </span>{" "}
          of {total} shots
        </p>

        <label className="filters__sort">
          <span className="t-label t-muted">Sort</span>
          <span className="filters__select">
            <select
              value={query.sort}
              /* Sort replaces rather than pushes: nobody wants four back
                 presses to undo cycling through a sort menu. */
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
            <CaretIcon size="1em" />
          </span>
        </label>

        {/* Occupies no space until there is something to clear, so the bar
            does not carry a permanently dead control. */}
        {n > 0 && (
          <button
            type="button"
            className="filters__clear"
            onClick={() => set(clearFacets(query))}
          >
            <CloseIcon size="0.9em" />
            Clear <span className="t-data">{n}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * A labelled disclosure holding one facet group.
 *
 * The trigger is labelled rather than an icon, and it carries the number of
 * values selected inside it, so the bar still says what is filtering the page
 * while the options are put away. A closed group that silently changed the
 * results would be the worst version of this pattern.
 */
function FacetMenu({
  label,
  id,
  open,
  setOpen,
  selected,
  children,
}: {
  label: string;
  id: string;
  open: string | null;
  setOpen: (v: string | null) => void;
  /** How many values inside are on. Drives the badge. */
  selected: number;
  children: React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = `${useId().replace(/:/g, "")}-${id}`;
  const isOpen = open === id;

  /* Held separately from `isOpen` so the close animation can finish before the
     panel is torn out of the DOM. Unmounting on the same tick would make the
     panel vanish rather than close. */
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(null);
      setClosing(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setClosing(false), CLOSE_MS);
      if (restoreFocus) trigger.current?.focus();
    },
    [setOpen]
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* Escape closes and hands focus back; a click anywhere else closes and
     leaves focus where the click landed. Both are listened for only while the
     menu is open, so a page with several of these is not carrying a document
     listener per menu at rest. */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [isOpen, close]);

  /* Tabbing past the last option closes the menu instead of leaving an open
     panel behind the focus ring. The options themselves are real checkboxes,
     so arrow and space behaviour inside is the browser's, not ours. */
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = wrap.current?.querySelectorAll<HTMLElement>("input");
    if (!focusable?.length) return;
    const last = focusable[focusable.length - 1];
    if (!e.shiftKey && document.activeElement === last) close(false);
  };

  return (
    <div className="filters__menu" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className={`filters__trigger${selected ? " filters__trigger--on" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={() => (isOpen ? close(true) : setOpen(id))}
      >
        {label}
        {selected > 0 && (
          <span className="filters__badge t-data" aria-hidden="true">
            {selected}
          </span>
        )}
        {selected > 0 && (
          <span className="visually-hidden">, {selected} selected</span>
        )}
        <CaretIcon size="0.9em" className="filters__caret" />
      </button>

      {(isOpen || closing) && (
        <div
          id={panelId}
          className={`filters__panel${isOpen ? " is-open" : " is-closing"}`}
          role="group"
          aria-label={label}
          onKeyDown={onPanelKeyDown}
        >
          <div className="filters__panel-head">
            <span className="t-label t-muted">{label}</span>
            <button
              type="button"
              className="filters__panel-close"
              onClick={() => close(true)}
              aria-label={`Close ${label}`}
            >
              <CloseIcon size="1em" />
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

/* Kept in step with --dur-1 in tokens.css, which is what the closing
   transition below uses. A shorter timeout would cut the animation off; a
   longer one leaves a dead panel catching clicks. */
const CLOSE_MS = 150;

/* -------------------------------------------------------------------------- */

/** One checkbox inside a facet menu. A real input, so the browser supplies the
    keyboard behaviour, the announcement and the checked semantics. */
function Option({
  name,
  on,
  count,
  onChange,
  children,
}: {
  name: string;
  on: boolean;
  count: number;
  onChange: () => void;
  children: React.ReactNode;
}) {
  /* An option that would return nothing is disabled rather than hidden.
     Hiding it would make the menu's contents change shape between visits,
     which is worse than showing that a combination is empty. Something
     already selected stays enabled, or there would be no way to switch it
     off again. */
  const dead = count === 0 && !on;

  return (
    <label className={`filters__opt${dead ? " filters__opt--dead" : ""}`}>
      <input
        type="checkbox"
        name={name}
        checked={on}
        disabled={dead}
        onChange={onChange}
      />
      <span className="filters__opt-label">{children}</span>
      <span className="t-data filters__opt-count" aria-hidden="true">
        {count}
      </span>
      <span className="visually-hidden">
        , {count} {count === 1 ? "shot" : "shots"}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */

function Chip({
  on,
  count,
  onClick,
  children,
}: {
  on: boolean;
  /** Result count if this were the selection. Zero disables the chip. */
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const dead = count === 0 && !on;
  return (
    <button
      type="button"
      className={`filters__chip${on ? " filters__chip--on" : ""}`}
      aria-pressed={on}
      disabled={dead}
      onClick={onClick}
    >
      {children}
      {count !== undefined && (
        <>
          <span className="t-data filters__chip-count" aria-hidden="true">
            {count}
          </span>
          <span className="visually-hidden">
            , {count} {count === 1 ? "shot" : "shots"}
          </span>
        </>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */

/** Shown in place of the product list when the facets exclude everything.

    With option counts in place this should now be unreachable by clicking: a
    combination that returns nothing is disabled before it can be chosen. It
    stays because a pasted URL can still carry one, and because an empty result
    is a screen, not a null branch. */
export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className="filters__none">
      <p className="t-heading-s">No shots match those filters</p>
      <p className="t-body-s t-muted">
        The catalogue is three shots, so narrow combinations run out quickly.
        Clearing the pack size usually brings results back.
      </p>
      <button type="button" className="chip" onClick={onClear}>
        Clear all filters
      </button>
    </div>
  );
}
