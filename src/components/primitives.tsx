/* ==========================================================================
   Primitives. Every page composes from these.
   All copy comes from lib/catalog.ts, which is sourced from the live site.
   ========================================================================== */

import { useId, useRef, useState } from "react";
import type { ReactNode, ButtonHTMLAttributes, MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { CaretIcon, PaymentIcon, ReturnsIcon, ShippingIcon } from "./icons";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useLiquidBite } from "../motion/liquid/LiquidBite";
import type { Pack, Product, Source } from "../lib/catalog";
import {
  COMMERCE,
  money,
  perServing,
  savingPercent,
  tierFor,
  RITUAL_NOTE,
} from "../lib/catalog";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/* Images and late fonts change element positions after ScrollTrigger has
   measured. Refresh once everything has settled. */
if (typeof window !== "undefined") {
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  if (document.fonts) document.fonts.ready.then(refresh).catch(() => {});
}

export const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------------------------------- */

type BandTone = "cream" | "white" | "ink" | "base" | "pale" | "soft";

export function Band({
  tone = "cream",
  clip = "bottom",
  theme,
  id,
  children,
  wide,
}: {
  tone?: BandTone;
  clip?: "bottom" | "all" | "none";
  theme?: string;
  id?: string;
  children: ReactNode;
  /** Skip the inner shell so a child can run full bleed. */
  wide?: boolean;
}) {
  const cls = [
    "band",
    clip === "all" ? "band--outer" : clip === "none" ? "band--flat" : "",
    `band--${tone}`,
    theme ? `theme-${theme}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section id={id} className={cls}>
      {wide ? children : <div className="shell">{children}</div>}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/** The hover state is a liquid carve: a gooey blob follows the cursor and
    bites a hole out of the pill, revealing a second colour underneath. See
    motion/liquid/LiquidBite. The old squash-and-overshoot pair now belongs to
    :active alone, so press and hover are two different gestures rather than
    two doses of the same one. */
export function Button({
  variant = "primary",
  full,
  as,
  to,
  children,
  onClick,
  ...rest
}: {
  variant?: "primary" | "secondary" | "ghost";
  full?: boolean;
  as?: "link";
  to?: string;
  children: ReactNode;
  /* Widened from HTMLButtonElement because the same handler has to serve the
     <Link> branch too. Narrowing it per branch would make every call site
     pick a type it does not care about. */
  onClick?: MouseEventHandler<HTMLElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const { ref, bind, layer, carveLabelRef } = useLiquidBite(!rest.disabled);
  const cls = `btn btn--${variant}${full ? " btn--full" : ""}`;
  const inner = (
    <>
      {layer}
      <span className="btn__label">{children}</span>
      {/* Same label, clipped to the bite, in the colour that reads against
          the carve. Hidden from the tree so it is never announced twice. */}
      <span className="btn__label btn__label--carve" aria-hidden="true" ref={carveLabelRef}>
        {children}
      </span>
    </>
  );
  if (as === "link" && to) {
    return (
      <Link
        className={cls}
        to={to}
        ref={ref as React.Ref<HTMLAnchorElement>}
        onClick={onClick}
        aria-label={rest["aria-label"]}
        tabIndex={rest.tabIndex}
        {...bind}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      className={cls}
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={onClick}
      {...rest}
      {...bind}
    >
      {inner}
    </button>
  );
}

/* -------------------------------------------------------------------------- */

export function Chip({
  active,
  outline,
  onClick,
  children,
}: {
  active?: boolean;
  outline?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const cls = `chip${outline ? " chip--outline" : ""}`;
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button className={cls} aria-pressed={!!active} onClick={onClick} type="button">
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */

/** Numbers get their own voice: every dose, price and count. */
export function Data({ children }: { children: ReactNode }) {
  return <span className="t-data">{children}</span>;
}

/** Marks content that is not on the live site, so a reviewer can never mistake
    a proposal for real merchandising. */
export function SourceTag({ source }: { source: Source }) {
  if (source !== "proposal") return null;
  return <span className="tag-proposal t-label">Proposal</span>;
}

/** Superscript marker resolving to the research list. */
export function Ref({ n }: { n: number }) {
  return (
    <a href={`#ref-${n}`} className="ref-mark t-data" aria-label={`Reference ${n}`}>
      {n}
    </a>
  );
}

/* -------------------------------------------------------------------------- */

export function SectionHead({
  eyebrow,
  title,
  lede,
  align = "start",
  display,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "start" | "center";
  /** Use the Champ display face instead of Degular. */
  display?: boolean;
}) {
  return (
    <header className={`sec-head${align === "center" ? " sec-head--center" : ""}`}>
      {eyebrow && <p className="t-label t-muted">{eyebrow}</p>}
      <h2 className={display ? "t-display-xl" : "t-heading-l"}>{title}</h2>
      {lede && <p className="t-body t-muted sec-head__lede">{lede}</p>}
    </header>
  );
}

/* -------------------------------------------------------------------------- */

/** Reveals children on scroll. Under reduced motion the end state is rendered
    immediately, never removed. */
export function Reveal({
  children,
  y = 24,
  stagger = 0.06,
  selector,
}: {
  children: ReactNode;
  y?: number;
  stagger?: number;
  /** Animate matching descendants instead of the wrapper itself. */
  selector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced() || !ref.current) return;
      const targets = selector
        ? Array.from(ref.current.querySelectorAll(selector))
        : [ref.current];
      if (!targets.length) return;

      /* Fail-safe: never hide content that is already on screen. A `from`
         tween sets opacity 0 on the first frame, so if ScrollTrigger measures
         before images have loaded and the trigger never fires, the content
         stays invisible. Anything already in view is left alone. */
      const box = ref.current.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.95) return;

      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 92%", once: true },
      });
    },
    { scope: ref }
  );

  return <div ref={ref}>{children}</div>;
}

/** Splits a heading into lines and reveals them. */
export function SplitHeading({
  text,
  className = "t-display-xxl",
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p";
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reduced() || !ref.current) return;
      const split = SplitText.create(ref.current, {
        type: "lines",
        linesClass: "split-line",
      });
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
      });
      return () => split.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref as never} className={`${className} split-wrap`}>
      {text}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */

/** The brand already runs these words as a marquee. Duplicated once for a
    seamless loop; paused under reduced motion. */
export function Marquee({ items, tone = "ink" }: { items: readonly string[]; tone?: "ink" | "base" }) {
  const run = [...items, ...items];
  return (
    <div className={`marquee marquee--${tone}`} aria-hidden="true">
      <div className="marquee__track">
        {run.map((t, i) => (
          <span className="marquee__item t-label" key={i}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Buttons, never a dropdown. Pack names and the ritual footnote are the
    brand's own. Per serving price is shown on every option. */
export function PackSelector({
  product,
  value,
  onChange,
}: {
  product: Product;
  value: string;
  onChange: (sku: string) => void;
}) {
  return (
    <fieldset className="packs">
      <legend className="t-label t-muted">Packs</legend>
      <div className="packs__list">
        {product.packs.map((p) => {
          const selected = p.sku === value;
          const tier = tierFor(p.servings);
          const save = savingPercent(p);
          return (
            <button
              key={p.sku}
              type="button"
              onClick={() => onChange(p.sku)}
              aria-pressed={selected}
              disabled={!p.available}
              className={`pack${selected ? " pack--on" : ""}`}
            >
              <span className="pack__left">
                <span className="t-heading-s pack__name">
                  {tier?.name ?? `${p.servings} Servings`}
                </span>
                <span className="t-data pack__servings">
                  {p.servings} servings
                  {!p.available ? " · out of stock" : ""}
                </span>
              </span>
              <span className="pack__right">
                <span className="t-data pack__price">{money(p.price)}</span>
                <span className="t-data pack__unit">
                  {money(Math.round(perServing(p)))}/shot
                </span>
                {save !== null && (
                  <span className="t-data pack__save">Save {save}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="t-body-s t-muted packs__note">{RITUAL_NOTE.text}</p>
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */

/** Shipping, returns and payment sit directly under the button, because 64
    percent of buyers look for shipping cost on the product page. Every line
    here is traced to the page or policy that states it. */
export function TrustRow() {
  return (
    <ul className="trust t-body-s">
      <li>
        <ShippingIcon />
        <span>
          {COMMERCE.shipping.text} · {COMMERCE.taxNote.text} · {COMMERCE.dispatch.text}
        </span>
      </li>
      <li>
        <ReturnsIcon />
        <span>
          {COMMERCE.returns.text} · {COMMERCE.cod.text}
        </span>
      </li>
      <li>
        <PaymentIcon />
        <span className="trust__pay">{COMMERCE.paymentMethods.join(" · ")}</span>
      </li>
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

/** Progressive disclosure. The live pages carry a lot of prose; the strongest
    line stays visible and the rest opens on demand.

    Expand is the right mechanism here rather than a drawer or a route: the
    detail belongs to exactly one row, and someone comparing "how to use"
    against "ingredients" wants both open at once.

    The panel used to toggle `hidden`, which is a jump cut. It animates now on
    a `grid-template-rows` track running 0fr to 1fr, which is the one way to
    tween to an intrinsic height without measuring it in JS, so a two line
    answer and a six paragraph one both open at the same speed with no layout
    read. The two element panel is load bearing: padding stays on the inner
    element, because padding on a 0fr track leaves a strip of height behind
    and the panel never closes all the way.

    `inert` rather than `hidden` on the closed state. The content has to stay
    in the box for the track to have a height to tween to, and inert is what
    keeps it out of the tab order and off the accessibility tree while it is
    folded away. */
export function Disclose({
  summary,
  meta,
  children,
  open: initial = false,
}: {
  summary: string;
  /** A short hint at what is behind the row: a count, a headline value. A
      disclosure control has to set an accurate expectation of what it opens,
      and a column of bare titles sets the same expectation four times. */
  meta?: string;
  children: ReactNode;
  open?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  const panelId = useId();
  return (
    <div className={`disc${open ? " disc--on" : ""}`}>
      <button
        type="button"
        className="disc__btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {/* The size of a disclosure trigger is a stylesheet decision, not a
            component one. It used to be pinned to t-heading-s here, which put
            every row within one step of the section title above it. */}
        <span className="disc__summary">{summary}</span>
        {meta && <span className="disc__meta t-body-s">{meta}</span>}
        <CaretIcon className="disc__icon" />
      </button>
      <div className="disc__panel" id={panelId} inert={!open}>
        <div className="disc__body">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="stars" aria-label={`${n} out of 5 stars`}>
      {"★".repeat(n)}
    </span>
  );
}

/** Product image. Real photography from the store. */
export function Shot({
  basename,
  alt,
  ratio = "4 / 5",
  priority,
}: {
  basename: string;
  alt: string;
  ratio?: string;
  priority?: boolean;
}) {
  return (
    <img
      className="shot"
      src={`/media/${basename}.jpg`}
      alt={alt}
      style={{ aspectRatio: ratio }}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
    />
  );
}

/* -------------------------------------------------------------------------- */

/* The cart used to live here as a counter. It is now a real store with line
   items, quantities and persistence: see lib/cart.tsx. Nothing in this file
   should grow a second one. */

export type { Pack };
