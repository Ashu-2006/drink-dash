/* ==========================================================================
   Product detail.

   Structure follows the brand's own page order, because it is better than the
   one invented in the first pass:
     hero and buy box, formula, who it is for, how it works, how to use,
     ingredients, research, reviews, ritual, standards, other shots.

   The multiple use case problem is answered by the brand's own two audience
   split rather than a four lens control I made up. Each product page on the
   live site says who it is for twice, and those two segments are real.

   Native scroll only. No Lenis: this is the page where people buy.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Band,
  Button,
  Data,
  Disclose,
  PackSelector,
  Ref,
  Reveal,
  SectionHead,
  Shot,
  Stars,
  TrustRow,
  reduced,
} from "../components/primitives";
import { StickyBuyBar } from "../components/Chrome";
import { PathRule } from "../components/Logo";
import {
  BRAND,
  byHandle,
  concernOf,
  money,
  products,
  RITUAL_NOTE,
  savingPercent,
  tierFor,
} from "../lib/catalog";
import type { Product as P } from "../lib/catalog";
import "./pdp.css";
import type { AddFn } from "../lib/cart";
import { useTitle } from "../lib/useTitle";

export default function Product({ onAdd }: { onAdd: AddFn }) {
  const { handle } = useParams();
  const product = byHandle(handle ?? "") ?? products[0];

  /* Default to the Starter Pack, the middle tier. Offering no default is not
     a neutral act: defaults roughly doubled agreement in Johnson and Goldstein.
     Falls through to the first available pack if the middle one is out. */
  const firstAvailable =
    product.packs.find((p) => p.servings === 12 && p.available) ??
    product.packs.find((p) => p.available) ??
    product.packs[0];

  const [sku, setSku] = useState(firstAvailable.sku);
  const [subscribe, setSubscribe] = useState(false);
  const [barOn, setBarOn] = useState(false);
  const buyBox = useRef<HTMLDivElement>(null);

  // Reset selection when the product changes.
  useEffect(() => {
    setSku(firstAvailable.sku);
  }, [product.handle, firstAvailable.sku]);

  const pack = product.packs.find((p) => p.sku === sku) ?? firstAvailable;

  // Edge: a selected pack going unavailable must reselect, not dead end.
  useEffect(() => {
    if (!pack.available) {
      const next = product.packs.find((p) => p.available);
      if (next) setSku(next.sku);
    }
  }, [pack, product.packs]);

  useEffect(() => {
    const el = buyBox.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBarOn(!e.isIntersecting), {
      rootMargin: "-120px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addSelected = () => onAdd({ kind: "pack", sku: pack.sku });

  useTitle(product.name);

  return (
    <div className={`theme-${product.theme}`}>
      <Hero product={product} pack={pack} sku={sku} setSku={setSku} subscribe={subscribe} setSubscribe={setSubscribe} onAdd={addSelected} boxRef={buyBox} />
      <Formula product={product} />
      <Audiences product={product} />
      <Ladder product={product} />
      <HowItWorks product={product} />
      <Ingredients product={product} />
      <Research product={product} />
      <Reviews product={product} />
      <Ritual product={product} />
      <OtherShots current={product} />
      <StickyBuyBar product={product} pack={pack} visible={barOn} onAdd={addSelected} />
    </div>
  );
}

/* ---------------------------------------------------------------- hero ---- */

function Hero({
  product,
  pack,
  sku,
  setSku,
  subscribe,
  setSubscribe,
  onAdd,
  boxRef,
}: {
  product: P;
  pack: P["packs"][number];
  sku: string;
  setSku: (s: string) => void;
  subscribe: boolean;
  setSubscribe: (v: boolean) => void;
  onAdd: () => void;
  boxRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [shot, setShot] = useState(0);
  const save = savingPercent(pack);

  return (
    <Band tone="pale" clip="bottom" overlap>
      <div className="pdp">
        <div className="pdp__gallery">
          <Shot
            basename={product.images[shot]}
            alt={`${product.name}, ${product.descriptor}`}
            ratio="1 / 1"
            priority
          />
          <div className="pdp__thumbs scroller">
            {product.images.map((img, i) => (
              <button
                key={img}
                type="button"
                className={`pdp__thumb${i === shot ? " pdp__thumb--on" : ""}`}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === shot}
                onClick={() => setShot(i)}
              >
                <img src={`/media/${img}.jpg`} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="pdp__buy" ref={boxRef}>
          <p className="t-label">{product.descriptor}</p>
          <h1 className="t-display-xl pdp__name">{product.name}</h1>
          <p className="t-data pdp__flavour">{product.flavour}</p>

          <a href="#reviews" className="pdp__rating t-body-s">
            <Stars n={5} /> <Data>{product.rating}</Data> from{" "}
            <Data>{product.reviewCount}</Data> reviews
          </a>

          <p className="t-body pdp__line">{product.lineUpLine}</p>

          <PackSelector product={product} value={sku} onChange={setSku} />

          <div className="pdp__price">
            <span className="t-heading-m">{money(pack.price)}</span>
            {pack.compareAt && pack.compareAt > pack.price && (
              <>
                <s className="t-data pdp__was">{money(pack.compareAt)}</s>
                {save !== null && <span className="t-data pdp__save">Save {save}%</span>}
              </>
            )}
          </div>

          {/* One time is preselected for cold traffic. Subscription is offered,
              never defaulted, and it is labelled as a proposal because the live
              store has no subscription. */}
          <div className="pdp__mode" role="group" aria-label="Purchase type">
            <button
              type="button"
              className={`mode${!subscribe ? " mode--on" : ""}`}
              aria-pressed={!subscribe}
              onClick={() => setSubscribe(false)}
            >
              <span className="t-body-s">One time</span>
              <span className="t-data">{money(pack.price)}</span>
            </button>
            <button
              type="button"
              className={`mode${subscribe ? " mode--on" : ""}`}
              aria-pressed={subscribe}
              onClick={() => setSubscribe(true)}
            >
              <span className="t-body-s">
                Every month <span className="tag-proposal t-label">Proposal</span>
              </span>
              <span className="t-data">{money(Math.round(pack.price * 0.9))}</span>
            </button>
          </div>

          <Button variant="primary" full onClick={onAdd} disabled={!pack.available}>
            {pack.available ? "Add to cart" : "Out of stock"}
          </Button>

          <p className="t-body-s t-muted pdp__reversal">
            Not right for you? Write to us within{" "}
            <Data>{7}</Data> days of delivery.
          </p>

          <TrustRow />
        </div>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------- formula ---- */

/** The brand's own formula section: a named support role and a written
    description per active. Bars are the dose relative to the largest in the
    formula, which makes the panel readable at a glance without inventing a
    statistic. */
function Formula({ product }: { product: P }) {
  const ref = useRef<HTMLDivElement>(null);

  const parse = (d?: string) => {
    if (!d) return 0;
    const n = parseFloat(d);
    if (Number.isNaN(n)) return 0;
    if (d.includes("mcg")) return n / 1000;
    if (d.includes("g") && !d.includes("mg") && !d.includes("mcg")) return n * 1000;
    return n;
  };
  const max = Math.max(...product.formula.map((f) => parse(f.dose)));

  useGSAP(
    () => {
      if (reduced() || !ref.current) return;
      const bars = ref.current.querySelectorAll<HTMLElement>(".fml__fill");
      gsap.from(bars, {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
      });
    },
    { scope: ref }
  );

  return (
    <Band tone="cream" id="formula">
      <SectionHead
        eyebrow="Every active named"
        title={product.formulaTitle.replace(/^THE /, "").replace(" FORMULA", " formula")}
        lede={product.ingredientsLede}
      />

      <div className="fml" ref={ref}>
        {product.formula.map((f, i) => {
          const share = f.dose && max ? Math.max(4, (parse(f.dose) / max) * 100) : 0;
          return (
            <article key={f.name} className="fml__row">
              <div className="fml__head">
                <h3 className="t-heading-s">
                  {f.name}
                  {i === 0 && product.references.length > 0 && <Ref n={1} />}
                </h3>
                {f.dose ? (
                  <span className="t-data fml__dose">{f.dose}</span>
                ) : (
                  <span className="t-data fml__dose fml__dose--none">in blend</span>
                )}
              </div>
              <p className="t-label t-muted fml__role">{f.role}</p>
              {share > 0 && (
                <div className="fml__bar" aria-hidden="true">
                  <span className="fml__fill" style={{ width: `${share}%` }} />
                </div>
              )}
              <p className="t-body-s fml__detail">{f.detail}</p>
            </article>
          );
        })}
      </div>

      <p className="t-body-s t-muted fml__note">{product.ingredientsNote}</p>
    </Band>
  );
}

/* ----------------------------------------------------------- audiences ---- */

/** The brand's own answer to the multiple use case problem. Two real segments
    per product, each with its own bullet list. A tab set rather than two
    stacked blocks, so neither loses primacy and the page stays short. */
function Audiences({ product }: { product: P }) {
  const [i, setI] = useState(0);
  const active = product.audiences[i];

  return (
    <div className="theme-inherit">
      <Band tone="soft" clip="bottom" overlap>
        <SectionHead
          eyebrow={`Who ${product.shortName} is for`}
          title="Two reasons to drink it"
          lede="One formula, more than one job. Pick the one that sounds like you."
        />

        <div className="aud">
          <div className="aud__tabs" role="tablist" aria-label="Who it is for">
            {product.audiences.map((a, n) => (
              <button
                key={a.condition}
                role="tab"
                aria-selected={i === n}
                className={`aud__tab${i === n ? " aud__tab--on" : ""}`}
                onClick={() => setI(n)}
              >
                <span className="t-data aud__num">{String(n + 1).padStart(2, "0")}</span>
                <span className="t-heading-s">{a.condition}</span>
              </button>
            ))}
          </div>

          <div className="aud__panel" role="tabpanel">
            <p className="t-body aud__lede">{active.lede}</p>
            <ul className="aud__points">
              {active.points.map((pt) => (
                <li key={pt} className="t-body">
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>
    </div>
  );
}

/* -------------------------------------------------------------- ladder ---- */

/** The pack arithmetic against the brand's own 30 day recommendation. No
    competitor connects these two numbers, and connecting them honestly is a
    stronger move than a badge. */
function Ladder({ product }: { product: P }) {
  const trial = product.packs[0];
  const rec = product.packs[product.packs.length - 1];
  const drop = Math.round(
    (1 - rec.price / rec.servings / (trial.price / trial.servings)) * 100
  );

  return (
    <Band tone="white">
      <SectionHead eyebrow="The maths" title="What thirty days actually costs" lede={RITUAL_NOTE.text} />

      <div className="lad">
        {product.packs.map((p) => {
          const covers = p.servings >= RITUAL_NOTE.days;
          return (
            <div key={p.sku} className={`lad__row${covers ? " lad__row--covers" : ""}`}>
              <span className="t-heading-s lad__name">{tierFor(p.servings)?.name}</span>
              <span className="t-data lad__days">
                {p.servings} of {RITUAL_NOTE.days} days
              </span>
              <div className="lad__bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (p.servings / RITUAL_NOTE.days) * 100)}%` }} />
              </div>
              <span className="t-data lad__unit">
                {money(Math.round(p.price / p.servings))}/shot
              </span>
            </div>
          );
        })}
      </div>

      <p className="t-body lad__note">
        Only the Recommended Pack covers the ritual the brand actually
        recommends, and it works out <Data>{drop}%</Data> cheaper a shot than
        the Trial Pack. The Trial Pack is there to find out whether you like the{" "}
        {product.flavour.toLowerCase()} flavour.
      </p>

      <PathRule />
    </Band>
  );
}

/* --------------------------------------------------------- how it works ---- */

function HowItWorks({ product }: { product: P }) {
  return (
    <Band tone="cream">
      <div className="hiw">
        <div>
          <p className="t-label t-muted">How it works</p>
          <p className="t-heading-l hiw__lead">{product.howItWorks[0].replace(/\.$/, "")}</p>
        </div>
        <div className="hiw__body">
          {product.howItWorks.slice(1).map((t) => (
            <p key={t.slice(0, 20)} className="t-body">
              {t}
            </p>
          ))}
        </div>
      </div>
    </Band>
  );
}

/* --------------------------------------------------------- ingredients ---- */

/** The long prose from the live page lives here, behind disclosure. The page
    stays short and nothing is lost. */
function Ingredients({ product }: { product: P }) {
  return (
    <Band tone="cream">
      <div className="discs">
        <Disclose summary={`What ${product.name.replace("DASH OF ", "Dash of ")} is`} open>
          {product.whatItIs.map((t) => (
            <p key={t.slice(0, 20)} className="t-body">
              {t}
            </p>
          ))}
        </Disclose>

        <Disclose summary="Ingredients per 60 ml serving">
          <p className="t-body-s t-muted">{product.ingredientsLede}</p>
          <ul className="ing">
            {product.actives.map((a) => (
              <li key={a.name} className="t-data">
                <span>{a.name}</span>
                <b>{a.dose}</b>
              </li>
            ))}
          </ul>
          <p className="t-body-s t-muted">{product.ingredientsNote}</p>
        </Disclose>

        <Disclose summary="How to use">
          <ol className="how">
            {product.howToUse.map((t, i) => (
              <li key={t} className="t-body">
                <span className="t-data">{String(i + 1).padStart(2, "0")}</span>
                {t}
              </li>
            ))}
          </ol>
        </Disclose>

        <Disclose summary="Shipping, returns and payment">
          <TrustRow />
          <p className="t-body-s t-muted">
            Questions: {BRAND.footer.helpful[2]} at support@drinkdash.in.
          </p>
        </Disclose>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------ research ---- */

/** Real reference titles, exactly as the site lists them. No sample size,
    design or duration is asserted, because the site states none. Inventing
    those numbers was the worst error of the first pass. */
function Research({ product }: { product: P }) {
  return (
    <Band tone="ink" clip="bottom" overlap id="research">
      <SectionHead
        eyebrow="Backed by ingredient research"
        title={`${product.references.length} papers behind this formula`}
        lede="The published research the brand cites for these actives. Titles are listed as the brand lists them, with no claim made about sample size or duration beyond what each paper reports."
      />

      <ol className="refs">
        {product.references.map((r) => (
          <li key={r.id} id={`ref-${r.id}`} className="ref">
            <span className="t-data ref__n">{String(r.id).padStart(2, "0")}</span>
            <span>
              <span className="t-body ref__title">{r.title}</span>
              <span className="t-body-s t-muted ref__pub">{r.publisher}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="t-body-s t-muted refs__note">
        Food supplement. Not for medicinal use. Claims are limited to supporting
        normal function and are not intended to diagnose, treat or prevent any
        disease.
      </p>
    </Band>
  );
}

/* ------------------------------------------------------------- reviews ---- */

function Reviews({ product }: { product: P }) {
  const has = product.reviews.length > 0;

  return (
    <Band tone="cream" id="reviews">
      <SectionHead
        eyebrow="From customers"
        title="What people say"
        lede={
          has
            ? undefined
            : "This shot has reviews on the live store but none published with a name yet, so none are shown here rather than invented."
        }
      />

      <div className="rvw__summary">
        <span className="t-display-xl">
          <Data>{product.rating}</Data>
        </span>
        <span>
          <Stars n={5} />
          <span className="t-body-s t-muted rvw__count">
            <Data>{product.reviewCount}</Data> reviews · all five star
          </span>
        </span>
      </div>

      {has && (
        <Reveal selector=".rvw" stagger={0.06}>
          <div className="rvws">
            {product.reviews.map((r) => (
              <blockquote key={r.name} className="rvw">
                <Stars n={r.stars} />
                <p className="t-body rvw__text">{r.text}</p>
                <cite className="t-label rvw__name">{r.name}</cite>
              </blockquote>
            ))}
          </div>
        </Reveal>
      )}
    </Band>
  );
}

/* -------------------------------------------------------------- ritual ---- */

function Ritual({ product }: { product: P }) {
  return (
    <Band tone="base" clip="bottom" overlap>
      <div className="rit">
        <div>
          <p className="t-label">{BRAND.ritualSection.kicker}</p>
          <h2 className="t-display-xl rit__title">{product.ritual.title}</h2>
          {product.ritual.lines.map((l) => (
            <p key={l} className="t-heading-m rit__line">
              {l}
            </p>
          ))}
        </div>
        <ul className="rit__std">
          {BRAND.badges.map((b) => (
            <li key={b} className="t-label">
              {b}
            </li>
          ))}
        </ul>
      </div>
      <blockquote className="t-body rit__statement">{BRAND.statement}</blockquote>
    </Band>
  );
}

/* --------------------------------------------------------- other shots ---- */

function OtherShots({ current }: { current: P }) {
  const others = products.filter((p) => p.handle !== current.handle);
  return (
    <Band tone="cream" clip="none">
      <SectionHead eyebrow="The rest of the line-up" title="Other shots" />
      <div className="others">
        {others.map((p) => (
          <Link key={p.handle} to={`/products/${p.handle}`} className={`other theme-${p.theme}`}>
            <Shot basename={p.images[0]} alt={p.name} ratio="4 / 3" />
            <div className="other__body">
              <p className="t-label t-muted">{concernOf(p)?.label}</p>
              <h3 className="t-heading-s">{p.name}</h3>
              <p className="t-data other__hero">
                {p.formula[0].name} {p.formula[0].dose}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Band>
  );
}
