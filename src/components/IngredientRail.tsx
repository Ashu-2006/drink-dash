/* ==========================================================================
   Ingredient rail.

   A horizontal rail of tilted cards, one per formula row. Drag to scroll,
   arrows at the head, and a card straightens and lifts when you point at it.

   Why a rail rather than the stacked list it replaces: the formula is the
   argument the product page makes, and six long paragraphs stacked vertically
   get read by nobody. Laid out sideways, the whole formula reads as a set at
   a glance and the depth is one gesture away.

   The tilt is deterministic, not random. A random angle per render means the
   cards move every time React re-renders, which reads as a glitch rather than
   as craft. The angles cycle through a fixed sequence keyed by index, so a
   card sits at the same angle for the life of the page.

   Card grounds cycle too, and for the same reason: a four step sequence keyed
   by :nth-child in CSS, so the deck reads polychrome without a single colour
   being picked at random. The cycle is the page theme, a sibling hue, the
   page theme at pale, then the other sibling hue. Every ground carries an
   accent whose contrast against it clears AA: the three soft tints take their
   own deep, and the pale card takes ink, because deep on pale measures 3.7
   and fails. See ingredientrail.css for the table.

   Scrolling is native overflow, not a transform track. Native scroll keeps
   the trackpad, the scrollbar, keyboard paging, and screen-reader focus
   scrolling all working for free; a transform carousel has to reimplement
   every one of those and usually reimplements about half.

   States built: at the start, mid-rail, at the end, hover, keyboard focus,
   dragging, a row with artwork, a row without, reduced motion, and narrow
   screens where the arrows are dropped for the thumb.
   ========================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import { artForIngredient, img } from "../lib/media";
import type { FormulaEntry, ThemeKey } from "../lib/catalog";
import "./ingredientrail.css";

/* Degrees. Cycled by index so the fan looks hand-dealt but never moves. */
const TILT = [-2.4, 1.6, -1.2, 2.2, -1.8, 1.1];

/* Pointer travel, in px, past which a drag stops counting as a click. Below
   this a shaky press on a card still activates it. */
const DRAG_SLOP = 6;

/* Anything outside a word character or a space. Degular Display has no
   punctuation glyphs in this cut, so a dose containing one is set in the body
   face rather than letting the browser resolve that single glyph out of a
   fallback and mix two faces inside one number. */
const PUNCTUATION = /[^\w\s]/;

export function IngredientRail({
  entries,
  theme,
  label,
}: {
  entries: FormulaEntry[];
  theme: ThemeKey;
  /** Names the rail for assistive tech, e.g. "The Glow Formula". */
  label: string;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);

  /* Drag bookkeeping lives in a ref, not state: it changes on every pointer
     move and re-rendering the whole rail at pointer rate would be absurd. */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    /* A 1px tolerance, because fractional device pixels mean scrollLeft often
       lands at max - 0.5 and the end arrow would never disable. */
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure, entries.length]);

  /** Scroll by one card plus its gap, read off the DOM rather than hardcoded,
      so the arrows stay right when the card width changes at a breakpoint. */
  const page = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".ingr__card");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({
      left: step * dir,
      behavior: prefersReduced() ? "auto" : "smooth",
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    /* Mouse only. Touch already drags natively, and hijacking it here would
       fight the browser's own momentum and rubber-banding. */
    if (e.pointerType === "touch" || !rail.current) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: rail.current.scrollLeft,
      moved: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = rail.current;
    if (!drag.current.active || !el) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    if (drag.current.moved > DRAG_SLOP && !dragging) setDragging(true);
    if (drag.current.moved > DRAG_SLOP) {
      el.scrollLeft = drag.current.startScroll - dx;
    }
  };

  const endDrag = () => {
    drag.current.active = false;
    if (dragging) setDragging(false);
  };

  /* Swallow the click that follows a drag, so releasing over a card does not
     also activate it. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved > DRAG_SLOP) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (!entries.length) return null;

  return (
    <div className={`ingr theme-${theme}`}>
      <div className="ingr__head">
        <p className="t-label t-muted ingr__hint">
          Drag or use the arrows
        </p>
        <div className="ingr__nav">
          <button
            type="button"
            className="ingr__arrow"
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label="Previous ingredients"
          >
            <Arrow dir="left" />
          </button>
          <button
            type="button"
            className="ingr__arrow"
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label="More ingredients"
          >
            <Arrow dir="right" />
          </button>
        </div>
      </div>

      <ul
        ref={rail}
        className={`ingr__rail${dragging ? " ingr__rail--drag" : ""}`}
        aria-label={label}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {entries.map((entry, i) => {
          const art = artForIngredient(entry.name);
          return (
            <li
              key={entry.name}
              className="ingr__card"
              style={{ "--tilt": `${TILT[i % TILT.length]}deg` } as React.CSSProperties}
            >
              <article className="ingr__inner">
                <p className="ingr__step t-data">
                  {String(i + 1).padStart(2, "0")}
                </p>

                <div className="ingr__figure">
                  {art ? (
                    <img
                      className="ingr__art"
                      {...img(art)}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    /* Rows without photography get their dose set large
                       instead. An empty box would read as a failed image, and
                       the number is the most interesting fact on the card. */
                    <p className="ingr__figure-dose t-data" aria-hidden="true">
                      {entry.dose ?? "in blend"}
                    </p>
                  )}
                </div>

                <p className="t-label ingr__role">{entry.role}</p>
                <h3 className="t-heading-s ingr__name">{entry.name}</h3>
                <p className="t-body-s ingr__detail">{entry.detail}</p>

                {/* The dose is the fact the card exists to carry, so it is set
                    in the heading face at heading size rather than as a mono
                    footnote. Degular Display carries no punctuation in the
                    supplied cut, so a dose like "2.2 mcg" is set in the body
                    face at the same size instead of rendering its full stop
                    out of a fallback font. */}
                <div className="ingr__dose">
                  <span className="t-label ingr__dose-label">
                    {entry.dose ? "Dose" : "Amount"}
                  </span>
                  <span
                    className={`ingr__dose-value${
                      entry.dose && PUNCTUATION.test(entry.dose)
                        ? " ingr__dose-value--punct"
                        : ""
                    }`}
                  >
                    {entry.dose ?? "In blend"}
                  </span>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d={dir === "right" ? "M4 12h15M13 6l6 6-6 6" : "M20 12H5M11 6l-6 6 6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
