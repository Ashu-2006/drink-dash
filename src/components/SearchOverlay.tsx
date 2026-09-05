/* ==========================================================================
   Search overlay.

   A top sheet rather than a route. Search is a lookup inside the session, not
   a destination: the shopper wants to jump somewhere and keep their place if
   they change their mind. A /search route would put a dead end in the back
   button for every abandoned query.

   States built: idle (no query, shows Quick Shop), typing with results,
   typing with no results, keyboard navigation. The list is a listbox, so the
   input keeps focus while the arrow keys move a highlight and a screen reader
   is told what is active.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearch } from "../lib/search";
import { fromPrice, money, products } from "../lib/catalog";
import { diaries } from "../lib/diaries";
import "./search.css";

const KIND_LABEL: Record<string, string> = {
  product: "Shot",
  concern: "Concern",
  article: "Diaries",
  page: "Page",
};

export function SearchOverlay() {
  const { open, setOpen, query, setQuery, results } = useSearch();
  const input = useRef<HTMLInputElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();

  /* Cmd/Ctrl-K from anywhere. Registered once, and only while nothing else has
     claimed the keystroke inside a text field. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    /* Focus after the transition starts, not before: focusing an element
       inside a visibility:hidden panel is a no-op in Safari. */
    const t = window.setTimeout(() => input.current?.focus(), 60);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = prev;
      restoreTo.current?.focus?.();
    };
  }, [open]);

  /* A new query invalidates the highlight. Without this, typing a second word
     can leave the cursor pointing past the end of a now-shorter list. */
  useEffect(() => setCursor(0), [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[cursor];
      if (hit) {
        navigate(hit.doc.to);
        setOpen(false);
      }
    }
  };

  const idle = query.trim().length === 0;
  const nothing = !idle && results.length === 0;

  return (
    <>
      <div
        className={`scrim${open ? " scrim--on" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`srch${open ? " srch--on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        aria-hidden={!open}
      >
        <div className="shell srch__inner">
          <div className="srch__bar">
            <label htmlFor="site-search" className="visually-hidden">
              Search shots, ingredients and articles
            </label>
            <input
              id="site-search"
              ref={input}
              className="srch__input"
              type="search"
              autoComplete="off"
              placeholder="Search shots, ingredients, articles"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              tabIndex={open ? 0 : -1}
              role="combobox"
              aria-expanded={!idle}
              aria-controls="search-results"
              aria-activedescendant={
                results[cursor] ? `sr-${results[cursor].doc.id}` : undefined
              }
            />
            <button
              className="chip chip--outline"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              Close
            </button>
          </div>
          <p className="t-label t-muted srch__hint">Press Esc to close</p>

          {idle && (
            <div className="srch__quick">
              <p className="t-label t-muted">Quick shop</p>
              <ul className="srch__grid">
                {products.map((p) => (
                  <li key={p.handle} className={`theme-${p.theme}`}>
                    <Link
                      to={`/products/${p.handle}`}
                      className="srch__card"
                      onClick={() => setOpen(false)}
                      tabIndex={open ? 0 : -1}
                    >
                      <img src={`/media/${p.images[0]}.jpg`} alt="" loading="lazy" />
                      <span className="t-heading-s">{p.name}</span>
                      <span className="t-data t-muted">
                        from {money(fromPrice(p))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="t-label t-muted srch__quick-head">From the Diaries</p>
              <ul className="srch__links">
                {diaries.map((d) => (
                  <li key={d.slug}>
                    <Link
                      to={`/dash-diaries/${d.slug}`}
                      className="t-body-s"
                      onClick={() => setOpen(false)}
                      tabIndex={open ? 0 : -1}
                    >
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {nothing && (
            <div className="srch__none">
              <p className="t-heading-s">No matches for &ldquo;{query}&rdquo;</p>
              <p className="t-body-s t-muted">
                Try a shot name, a concern like skin or hair, or an ingredient
                such as glutathione or carnitine.
              </p>
            </div>
          )}

          {!idle && results.length > 0 && (
            <ul className="srch__results" id="search-results" role="listbox">
              {results.map((r, i) => (
                <li
                  key={r.doc.id}
                  id={`sr-${r.doc.id}`}
                  role="option"
                  aria-selected={i === cursor}
                  className={`srch__row${i === cursor ? " srch__row--on" : ""}${
                    r.doc.theme ? ` theme-${r.doc.theme}` : ""
                  }`}
                >
                  <Link
                    to={r.doc.to}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setCursor(i)}
                    tabIndex={open ? 0 : -1}
                  >
                    {r.doc.image ? (
                      <img src={`/media/${r.doc.image}.jpg`} alt="" loading="lazy" />
                    ) : (
                      <span className="srch__dot" aria-hidden="true" />
                    )}
                    <span className="srch__text">
                      <span className="t-heading-s">{r.doc.title}</span>
                      <span className="t-body-s t-muted">{r.doc.subtitle}</span>
                    </span>
                    <span className="t-label t-muted srch__kind">
                      {KIND_LABEL[r.doc.kind]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
