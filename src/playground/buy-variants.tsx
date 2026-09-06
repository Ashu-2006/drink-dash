/* ==========================================================================
   Five takes on the shop's buy column.

   The media side is untouched: same shot, same thumbnail strip. Only the
   column that asks for the money changes.

   THE SPLIT, decided before any of these were built
   -------------------------------------------------
   From progressive-disclosure-dashboards, step 1: sort everything into three
   tiers by frequency of need, not by importance in theory.

     Tier 1, zero clicks     name, descriptor, flavour, the one line claim,
                             rating and review count, price, pack choice, the
                             add button, and stock. A buyer needs every one of
                             these every time, and would be annoyed to click.
                             Stock is here on purpose: the skill's rule is
                             never to make someone drill in to find out that
                             no action is possible.
     Tier 2, one gesture     actives with doses, and how to take it. Wanted
                             often, not always. One predictable, labelled
                             control away.
     Tier 3, real navigation the full formula and the research behind it. It
                             already has a route, /products/:handle, which is
                             where a Tier 3 job belongs: shareable, survives a
                             refresh, has its own back button.

   All five variants keep that split. What differs is the mechanism that moves
   between tier 1 and tier 2, and where the commit sits relative to the
   argument. That is the only variable, so the comparison is honest.

   MECHANISMS, from the vault note on the four canonical moves
   -----------------------------------------------------------
     1  Convention      expand   the order every storefront already uses
     2  Decision first  expand   the commit above the explanation
     3  Sheet           detach   the formula gets out of the way entirely
     4  Tabs            swap     the lightest reveal: nothing reflows
     5  Commit bar      detach   the commit follows the reader down

   Peek is absent on purpose. A peek needs a list to stay navigable beside the
   detail, and there is no list here: one product, one column. Drill is absent
   because the only thing worth a route already has one.

   MOTION
   ------
   Technique from transitions-dev, values from styles/tokens.css. Nothing from
   that skill's own :root is pasted here.

     open   --dur-3 (300ms)  its Fast tier, for modal and tab movement
     close  --dur-1 (150ms)  its Quick tier: closes are faster than opens
     curve  --ease-smooth    this repo's smooth ease out
     lift   --ease-soft-overshoot, for a surface arriving rather than moving

   Two of its documented traps are avoided rather than worked around: the
   sheet stays mounted and toggles one class, so there is no closing state to
   clean up and no jump on the next open; and the tab pill does not transition
   until after its first measured paint, so it never animates in from zero.
   ========================================================================== */

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Data,
  Disclose,
  PackSelector,
  Shot,
  Stars,
  TrustRow,
} from "../components/primitives";
import { NextIcon } from "../components/icons";
import { money, perServing } from "../lib/catalog";
import type { Pack, Product } from "../lib/catalog";
import { galleryFor } from "../lib/media";

export type VariantProps = {
  product: Product;
  sku: string;
  setSku: (sku: string) => void;
  pack: Pack;
  onAdd: (sku: string) => void;
  /** Tier 2 starts open. A dial, so the shut state can be inspected without
      hunting for the trigger every time the variant changes. */
  openByDefault: boolean;
};

export type Variant = {
  id: string;
  name: string;
  mechanism: string;
  tier2: string;
  note: string;
  render: (p: VariantProps) => ReactNode;
};

/* --------------------------------------------------------------- shared -- */

/** The media side. Unchanged from the shop, including the thumbnail strip. */
export function BuyMedia({ product }: { product: Product }) {
  const shots = galleryFor(product.handle, product.images).slice(0, 4);
  const [i, setI] = useState(0);
  const shot = shots[i] ?? shots[0];

  return (
    <div className="pgb__media">
      {shot ? (
        <img
          className={`pgb__shot${shot.contain ? " pgb__shot--cutout" : ""}`}
          src={shot.src}
          alt={shot.alt || `${product.name}, ${product.descriptor}`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <Shot basename={product.images[0]} alt={product.name} ratio="1 / 1" />
      )}
      {shots.length > 1 && (
        <div
          className="pgb__thumbs"
          role="group"
          aria-label={`${product.name}, more images`}
        >
          {shots.map((s, n) => (
            <button
              key={s.src}
              type="button"
              className={`pgb__thumb${n === i ? " is-on" : ""}`}
              aria-pressed={n === i}
              aria-label={s.alt || `View ${n + 1} of ${shots.length}`}
              onClick={() => setI(n)}
            >
              <img src={s.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Actives({ product }: { product: Product }) {
  return (
    <ul className="pgb__actives">
      {product.actives.map((a) => (
        <li key={a.name} className="t-data">
          <span>{a.name}</span>
          <b>{a.dose}</b>
        </li>
      ))}
    </ul>
  );
}

function Ritual({ product }: { product: Product }) {
  return (
    <ul className="pgb__ritual t-body-s">
      {product.ritual.lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/** Tier 1 proof. Rating and count, never behind a reveal: it is one of the
    few things every buyer checks. */
function Proof({ product }: { product: Product }) {
  return (
    <p className="t-body-s pgb__proof">
      <Stars n={5} /> <Data>{product.reviewCount}</Data> reviews
    </p>
  );
}

/** Tier 3. A real route, so it is shareable and has back button semantics. */
function MoreLink({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.handle}`}
      className="t-body-s pgb__more link-arrow"
    >
      Read the full formula and research <NextIcon size="1em" />
    </Link>
  );
}

/** The commit. The price rides on the control, because the control is where
    the agreement happens and a button reading only "Add to cart" makes the
    buyer look back up to check what they just agreed to. Out of stock is
    stated on the button itself rather than discovered after a click. */
function AddButton({
  pack,
  onAdd,
  tabIndex,
}: {
  pack: Pack;
  onAdd: (sku: string) => void;
  tabIndex?: number;
}) {
  return (
    <Button
      variant="primary"
      full
      disabled={!pack.available}
      tabIndex={tabIndex}
      onClick={() => onAdd(pack.sku)}
    >
      {pack.available ? `Add to cart · ${money(pack.price)}` : "Out of stock"}
    </Button>
  );
}

/* ---------------------------------------------------------- 1 convention -- */

/** The order a buyer already knows, and the reveal that costs least.

    Jacob's law: people spend most of their time on other sites, so they
    expect this one to work the way those do. Every large storefront runs the
    same stack, so this variant does too. It is the control the other four are
    measured against, not a straw man.

    Tier 2 opens in place, under the control that names it. The vault's rule
    for expand is that the detail belongs to exactly one row and the reader
    might open several to compare, which is true of a dose list and a dosing
    routine. Both are well under a screen tall, which is the point at which
    expand is supposed to give way to something heavier. */
function Convention({
  product,
  sku,
  setSku,
  pack,
  onAdd,
  openByDefault,
}: VariantProps) {
  return (
    <div className="pgb__buy">
      <p className="t-label">{product.descriptor}</p>
      <h3 className="t-display-xl pgb__name">{product.name}</h3>
      <p className="t-data pgb__flavour">{product.flavour}</p>
      <Proof product={product} />
      <p className="t-body pgb__line">{product.lineUpLine}</p>
      <PackSelector product={product} value={sku} onChange={setSku} />
      <AddButton pack={pack} onAdd={onAdd} />
      <TrustRow />
      <div className="pgb__discs">
        <Disclose summary="What is in it" open={openByDefault}>
          <Actives product={product} />
        </Disclose>
        <Disclose summary="How to take it" open={openByDefault}>
          <Ritual product={product} />
        </Disclose>
      </div>
      <MoreLink product={product} />
    </div>
  );
}

/* ------------------------------------------------------- 2 decision first -- */

/** The commit above the argument.

    Same tiers, inverted order: price, pack and button sit directly under the
    name, and everything explanatory falls below a rule. It costs the buyer
    who still needs convincing, because they now scroll past the checkout to
    reach the reasons. It wins the returning buyer, who is the larger share on
    a repeat purchase product like a monthly shot.

    The price is keyed on the sku so React replaces the node and the enter
    animation runs. A number that changes silently is how a total surprises
    somebody two screens later. */
function DecisionFirst({ product, sku, setSku, pack, onAdd }: VariantProps) {
  return (
    <div className="pgb__buy">
      <p className="t-label">{product.descriptor}</p>
      <h3 className="t-display-xl pgb__name">{product.name}</h3>

      <p className="pgb__pricebar">
        <span key={pack.sku} className="t-display-xl pgb__bigprice">
          {money(pack.price)}
        </span>
        <span className="t-data t-muted">
          {money(Math.round(perServing(pack)))} a shot · {pack.servings} servings
        </span>
      </p>

      <PackSelector product={product} value={sku} onChange={setSku} />
      <AddButton pack={pack} onAdd={onAdd} />
      <TrustRow />

      <hr className="pgb__rule" />

      <p className="t-data pgb__flavour">{product.flavour}</p>
      <Proof product={product} />
      <p className="t-body pgb__line">{product.lineUpLine}</p>
      <p className="t-label t-muted">Actives, with doses</p>
      <Actives product={product} />
      <MoreLink product={product} />
    </div>
  );
}

/* ---------------------------------------------------------------- 3 sheet -- */

/** Tier 2 detaches.

    The buy column carries only what a decision needs. Actives, ritual and
    proof rise on a sheet over the page. The vault names detach as the move
    for modal decisions, purchase among them, and warns against using it for
    reading. This sits on the line: the content is read, but it is read as an
    interruption to buying rather than as part of the column, and the column
    stays behind the veil so nothing is lost on close.

    It is the heaviest of the five, which is the thing being tested. If it
    does not feel worth the cost against variant 1, that is the answer.

    The sheet stays mounted and toggles one class, so there is no closing
    state to clean up. Escape closes it, the scrim closes it, and focus
    returns to the control that opened it. inert keeps the shut copy out of
    the tab order and out of the accessibility tree, which is what the
    aria-expanded false on the trigger promises. */
function Sheet({ product, sku, setSku, pack, onAdd }: VariantProps) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  /* aria-modal true is a promise that the rest of the page is out of reach.
     Setting it without trapping focus is worse than not setting it, because a
     screen reader then reports a boundary that Tab walks straight through. */
  useEffect(() => {
    if (!open) return;
    const box = panel.current;
    box?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        opener.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !box) return;
      const stops = box.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) return;
      /* The panel itself is the fallback holder at tabindex -1, so a sheet
         with nothing focusable in it still cannot leak focus behind the
         veil. */
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    opener.current?.focus();
  };

  return (
    <div className="pgb__buy">
      <p className="t-label">{product.descriptor}</p>
      <h3 className="t-display-xl pgb__name">{product.name}</h3>
      <p className="t-data pgb__flavour">{product.flavour}</p>
      <Proof product={product} />
      <p className="t-body pgb__line">{product.lineUpLine}</p>
      <PackSelector product={product} value={sku} onChange={setSku} />
      <AddButton pack={pack} onAdd={onAdd} />

      {/* Labelled, not a chevron. The skill's rule is that the control has to
          carry enough scent to set an accurate expectation of what is behind
          it, and a bare icon does not. */}
      <button
        type="button"
        ref={opener}
        className="pgb__sheetbtn t-body-s"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>What is in it, and how to take it</span>
        <NextIcon size="1em" />
      </button>

      <TrustRow />

      <div
        className={`pgb__scrim${open ? " is-open" : ""}`}
        onClick={close}
        aria-hidden
      />
      <div
        className={`pgb__sheet${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panel}
        inert={!open}
      >
        <div className="pgb__sheet-in">
          <div className="pgb__sheet-head">
            <h4 className="t-heading-s" id={titleId}>
              {product.name}
            </h4>
            <button type="button" className="pgb__sheet-x t-body-s" onClick={close}>
              Close
            </button>
          </div>
          <p className="t-label t-muted">Actives, with doses</p>
          <Actives product={product} />
          <p className="t-label t-muted">{product.ritual.title}</p>
          <Ritual product={product} />
          <MoreLink product={product} />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- 4 tabs -- */

/** The lightest reveal in the set.

    One pane, three labels, a floor under the pane height so nothing below it
    moves when the pane changes. When two mechanisms fit, the lighter one
    wins, and a swap costs the reader no scroll position at all: the expand in
    variant 1 pushes the trust row and the link down every time it opens.

    A real tablist, not three buttons pretending: roving tabindex, arrows
    move, Home and End jump, and only the selected tab is a tab stop.

    The pill is measured, not guessed, and does not transition until after its
    first measured paint, or it slides in from zero width on load. */
function Tabs({ product, sku, setSku, pack, onAdd }: VariantProps) {
  const panes = [
    { id: "formula", label: "Formula", body: <Actives product={product} /> },
    { id: "ritual", label: "Ritual", body: <Ritual product={product} /> },
    {
      id: "proof",
      label: "Proof",
      body: (
        <div className="pgb__pane-proof">
          <Proof product={product} />
          <p className="t-body-s t-muted">{product.lineUpLine}</p>
        </div>
      ),
    },
  ];

  const [at, setAt] = useState(0);
  const [ready, setReady] = useState(false);
  const [pill, setPill] = useState({ x: 0, w: 0 });
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const base = useId();

  /* Measured before paint, so the pill is never a frame behind the label it
     is under. */
  useLayoutEffect(() => {
    const el = refs.current[at];
    if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
  }, [at]);

  /* Ready on the frame after that first measured paint. Until then the pill
     has no transition, or it slides in from zero width on load. */
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* Re-measured on resize, because the labels are text and text rewraps. */
  useEffect(() => {
    const box = list.current;
    if (!box) return;
    const ro = new ResizeObserver(() => {
      const el = refs.current[at];
      if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [at]);

  const move = (to: number) => {
    const n = (to + panes.length) % panes.length;
    setAt(n);
    refs.current[n]?.focus();
  };

  return (
    <div className="pgb__buy">
      <p className="t-label">{product.descriptor}</p>
      <h3 className="t-display-xl pgb__name">{product.name}</h3>
      <p className="t-data pgb__flavour">{product.flavour}</p>
      <p className="t-body pgb__line">{product.lineUpLine}</p>
      <PackSelector product={product} value={sku} onChange={setSku} />
      <AddButton pack={pack} onAdd={onAdd} />

      <div
        className="pgb__tabs"
        role="tablist"
        aria-label={`${product.name} detail`}
        ref={list}
        data-ready={ready}
      >
        <span
          className="pgb__pill"
          aria-hidden
          style={{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }}
        />
        {panes.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`${base}-t-${p.id}`}
            aria-selected={i === at}
            aria-controls={`${base}-p-${p.id}`}
            tabIndex={i === at ? 0 : -1}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`pgb__tab t-body-s${i === at ? " is-on" : ""}`}
            onClick={() => setAt(i)}
            onKeyDown={(e) => {
              const jump: Record<string, number> = {
                ArrowRight: at + 1,
                ArrowLeft: at - 1,
                Home: 0,
                End: panes.length - 1,
              };
              const to = jump[e.key];
              if (to === undefined) return;
              e.preventDefault();
              move(to);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {panes.map((p, i) => (
        <div
          key={p.id}
          role="tabpanel"
          id={`${base}-p-${p.id}`}
          aria-labelledby={`${base}-t-${p.id}`}
          className="pgb__pane"
          hidden={i !== at}
        >
          {p.body}
        </div>
      ))}

      <TrustRow />
      <MoreLink product={product} />
    </div>
  );
}

/* ----------------------------------------------------------- 5 commit bar -- */

/** Nothing is hidden, and the commit follows.

    Every tier is laid out at full weight in one read, which is the opposite
    bet to variant 3: no disclosure at all, on the argument that four short
    blocks do not need hiding and a reveal is a cost, not a saving. What
    detaches is the action rather than the information. Once the inline button
    leaves the viewport a bar takes its place at the foot of the screen,
    carrying the same pack, the same price and the same verb, so the buyer is
    never more than one reach from the decision however far they have read.

    The primary action keeps its position and its label between the two
    places, so muscle memory transfers.

    Observing the button itself rather than a scroll distance, so it stays
    right when the column above it changes length. */
function CommitBar({ product, sku, setSku, pack, onAdd }: VariantProps) {
  const inline = useRef<HTMLDivElement>(null);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const el = inline.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setOut(!e.isIntersecting),
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="pgb__buy">
      <p className="t-label">{product.descriptor}</p>
      <h3 className="t-display-xl pgb__name">{product.name}</h3>
      <p className="t-data pgb__flavour">{product.flavour}</p>
      <Proof product={product} />
      <p className="t-body pgb__line">{product.lineUpLine}</p>
      <p className="t-label t-muted">Actives, with doses</p>
      <Actives product={product} />
      <p className="t-label t-muted">{product.ritual.title}</p>
      <Ritual product={product} />
      <PackSelector product={product} value={sku} onChange={setSku} />
      <div ref={inline}>
        <AddButton pack={pack} onAdd={onAdd} />
      </div>
      <TrustRow />
      <MoreLink product={product} />

      <div className={`pgb__bar${out ? " is-out" : ""}`} aria-hidden={!out}>
        <span className="pgb__bar-id">
          <b className="t-body-s">{product.shortName}</b>
          <span className="t-data t-muted">{pack.servings} servings</span>
        </span>
        <span className="t-data pgb__bar-price">{money(pack.price)}</span>
        <Button
          variant="primary"
          disabled={!pack.available}
          tabIndex={out ? 0 : -1}
          onClick={() => onAdd(pack.sku)}
        >
          {pack.available ? "Add to cart" : "Out of stock"}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export const VARIANTS: Variant[] = [
  {
    id: "convention",
    name: "Convention",
    mechanism: "Expand",
    tier2: "Opens in place, under the control that names it",
    note:
      "The order a buyer already knows: image, name, proof, claim, pack, button, reassurance. Nothing is invented, so nothing has to be learned. This is the control the other four are measured against.",
    render: (p) => <Convention {...p} />,
  },
  {
    id: "decision",
    name: "Decision first",
    mechanism: "Expand",
    tier2: "Below the rule, always open",
    note:
      "Same tiers, inverted order. Price, pack and button sit under the name; the argument falls below a rule. Costs the buyer who still needs convincing, wins the one who already decided.",
    render: (p) => <DecisionFirst {...p} />,
  },
  {
    id: "sheet",
    name: "Sheet",
    mechanism: "Detach",
    tier2: "Rises over the page, dismissed by scrim or Escape",
    note:
      "The buy column carries only what a decision needs. The heaviest of the five, which is the thing being tested: if it does not feel worth the cost against Convention, that is the answer.",
    render: (p) => <Sheet {...p} />,
  },
  {
    id: "tabs",
    name: "Tabs",
    mechanism: "Swap",
    tier2: "One pane, three labels, a floor under the height",
    note:
      "The lightest reveal there is. An expand pushes everything under it down every time it opens; a swap costs the reader no scroll position at all.",
    render: (p) => <Tabs {...p} />,
  },
  {
    id: "commit",
    name: "Commit bar",
    mechanism: "Detach",
    tier2: "Nothing deferred. The action detaches instead",
    note:
      "The opposite bet to Sheet: no disclosure at all, on the argument that four short blocks do not need hiding. What detaches is the action, which follows the reader to the foot of the screen.",
    render: (p) => <CommitBar {...p} />,
  },
];
