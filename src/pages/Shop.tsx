/* ==========================================================================
   Product list.

   SCALES. The presentation is chosen from the product count, not hand built
   around three:
     up to BAND_LAYOUT_MAX (4)  full bleed band per product, own colour
     5 or more                  filterable card grid, concerns as facets
   Both modes are implemented here and both are exercised by the same data, so
   adding a product needs no layout work. See NOTES ON GROWTH in catalog.ts.

   Native scroll only. No Lenis: this is a page where people buy.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Band,
  Button,
  Data,
  PackSelector,
  Reveal,
  SectionHead,
  Shot,
  SourceTag,
  Stars,
  TrustRow,
} from "../components/primitives";
import { NextIcon } from "../components/icons";
import {
  activeConcerns,
  BAND_LAYOUT_MAX,
  byConcern,
  COMPARE_MAX,
  comparisonGroups,
  comparisonRows,
  concernOf,
  fromPrice,
  money,
  products,
  proposals,
} from "../lib/catalog";
import type { Product } from "../lib/catalog";
import "./shop.css";
import { ShopFilters, NoMatches, useShopQuery } from "../components/ShopFilters";
import { defaultPack } from "../lib/cart";
import { bottleFor, galleryFor, img } from "../lib/media";
import type { AddFn } from "../lib/cart";
import { useTitle } from "../lib/useTitle";

export default function Shop({ onAdd }: { onAdd: AddFn }) {
  useTitle("Shop");
  const useBands = products.length <= BAND_LAYOUT_MAX;
  const { query, results, set } = useShopQuery();
  const clear = () =>
    set({ ...query, concern: [], size: [], price: [], inStock: false });

  /* The filter bar drives both layouts. It used to exist only inside the grid,
     which meant the shop as it actually ships today, three products in bands,
     had no filtering at all: the facets were written for a catalogue size the
     site has not reached. */
  return (
    <>
      <ShopHero />
      <Band tone="cream" clip="none">
        <ShopFilters query={query} results={results} set={set} />
      </Band>
      {results.length === 0 ? (
        <Band tone="cream">
          <NoMatches onClear={clear} />
        </Band>
      ) : useBands ? (
        results.map((p) => <SkuBand key={p.handle} product={p} onAdd={onAdd} />)
      ) : (
        <Grid onAdd={onAdd} results={results} />
      )}

      <Compare />
      <Bundles onAdd={onAdd} />

      {/* An anchor nav, so it only makes sense while every product it points
          at is on the page. Fixed, so it is last in the tree. */}
      {results.length === products.length && <ConcernRail />}
    </>
  );
}

/* ---------------------------------------------------------------- hero ---- */

function ShopHero() {
  return (
    <div className="theme-volume">
      <Band tone="pale" clip="bottom" overlap>
        <p className="t-label t-muted">Shop</p>
        <h1 className="t-display-xl shop-hero__title">Three shots one ritual</h1>
        <p className="t-body shop-hero__lede">
          Every shot is <Data>60 ml</Data>, ready to drink, and built around a
          single concern. Named doses, no added sugar, and a flavour on every
          bottle.
        </p>
      </Band>
    </div>
  );
}

/* ---------------------------------------------------------------- rail ---- */

/** The concern selector.

    It used to be a pill stuck under the header, in view from the moment the
    page loaded, competing with the filter bar directly above it and with the
    hero it covered. It now sits at the bottom centre and only exists while it
    is useful: it arrives once the reader is halfway through the first shot,
    which is the first moment jumping to another shot is a thing anyone would
    want, and it leaves once the comparison table has been scrolled past,
    after which there is nothing left on the page for it to point at.

    Both edges are read off the real sections rather than off a scroll
    distance, so they stay correct when a band changes height. Measured in a
    rAF on scroll and on resize: getBoundingClientRect is cheap, and an
    IntersectionObserver cannot express "the middle of this element" without a
    sentinel element that exists only to be observed.

    Facets come from the taxonomy, so a new concern appears here on its own.
    Its own overflow container, so the page never scrolls sideways. */
function ConcernRail() {
  const [active, setActive] = useState<string>("all");
  const [shown, setShown] = useState(false);
  const list = activeConcerns();

  useEffect(() => {
    const ids = list.map((c) => `sku-${byConcern(c.id)[0]?.handle}`);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!seen) return;
        const handle = seen.target.id.replace("sku-", "");
        const p = products.find((x) => x.handle === handle);
        if (p) setActive(p.concernId);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.01, 0.5] }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [list]);

  /* Visibility. first is the opening shot band, last is the comparison. If
     either is missing the rail stays hidden rather than floating over a page
     it cannot navigate. */
  useEffect(() => {
    const first = document.getElementById(`sku-${products[0]?.handle}`);
    const compare = document.getElementById("compare");
    if (!first || !compare) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const a = first.getBoundingClientRect();
      const b = compare.getBoundingClientRect();
      /* In once the midpoint of the first band has risen past the middle of
         the viewport. Out once the comparison has left the top of it. */
      const past = a.top + a.height / 2 <= window.innerHeight / 2;
      const done = b.bottom <= 0;
      setShown(past && !done);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    /* A window resize is not the only thing that moves these edges. Images
       land late and the bands grow under the reader, which on a first load is
       exactly when the rail would otherwise arrive at the wrong moment. */
    const ro = new ResizeObserver(onScroll);
    ro.observe(first);
    ro.observe(compare);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
    };
  }, []);

  const go = (concernId: string | "all") => {
    const target =
      concernId === "all"
        ? document.getElementById("compare")
        : document.getElementById(`sku-${byConcern(concernId)[0]?.handle}`);
    if (!target) return;
    const header = 4.5 * 16 + 8;
    window.scrollTo({ top: target.offsetTop - header, behavior: "smooth" });
  };

  return (
    <div className={`rail${shown ? " rail--in" : ""}`} aria-hidden={!shown}>
      <div className="rail__scroll scroller">
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip${active === c.id ? " chip--active" : ""}`}
            aria-pressed={active === c.id}
            tabIndex={shown ? 0 : -1}
            onClick={() => go(c.id)}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          className="chip chip--outline"
          tabIndex={shown ? 0 : -1}
          onClick={() => go("all")}
        >
          Compare all
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ sku band ---- */

/** Frames in the band gallery. Past four the strip scrolls, and a picker that
    hides its own options is not a picker. */
const SKU_SHOTS = 4;

/** One product, full bleed, in its own colour, with everything needed to buy.
    Used while the catalogue is small. */
function SkuBand({ product, onAdd }: { product: Product; onAdd: AddFn }) {
  const [sku, setSku] = useState(product.packs[1]?.sku ?? product.packs[0].sku);
  const pack = product.packs.find((p) => p.sku === sku) ?? product.packs[0];
  const ref = useRef<HTMLDivElement>(null);

  /* The thumbnails under the shot used to be four plain images with no
     handler on them. They looked exactly like a gallery picker, because that
     is what a strip of small images under a large one means, and clicking one
     did nothing at all. They are buttons now and they swap the shot.

     Four, not nine: galleryFor returns everything there is, and a strip long
     enough to scroll hides its own last frame. The cut-out stays first, so
     the band opens on the same image it always did. */
  const shots = galleryFor(product.handle, product.images).slice(0, SKU_SHOTS);
  const [shotIndex, setShotIndex] = useState(0);
  const shot = shots[shotIndex] ?? shots[0];

  return (
    <div ref={ref} id={`sku-${product.handle}`} className={`theme-${product.theme}`}>
      <Band tone="base" clip="bottom" overlap>
        <div className="sku">
          <div className="sku__media">
            {/* A cut-out sits straight on the band, which is already the
                product's own colour. A photograph is a rectangle and gets a
                frame, or it reads as a print dropped on the page. */}
            {shot ? (
              <img
                className={`sku__shot${shot.contain ? " sku__shot--cutout" : ""}`}
                src={shot.src}
                alt={shot.alt || `${product.name}, ${product.descriptor}`}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Shot
                basename={product.images[0]}
                alt={`${product.name}, ${product.descriptor}`}
                ratio="1 / 1"
              />
            )}

            {shots.length > 1 && (
              <div
                className="sku__thumbs scroller"
                role="group"
                aria-label={`${product.name}, more images`}
              >
                {shots.map((s, i) => (
                  <button
                    key={s.src}
                    type="button"
                    className={`sku__thumb${i === shotIndex ? " is-on" : ""}`}
                    aria-pressed={i === shotIndex}
                    aria-label={s.alt || `View ${i + 1} of ${shots.length}`}
                    onClick={() => setShotIndex(i)}
                  >
                    <img src={s.src} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sku__buy">
            <p className="t-label">{product.descriptor}</p>
            <h2 className="t-display-xl sku__name">{product.name}</h2>
            <p className="t-data sku__flavour">{product.flavour}</p>

            <p className="t-body sku__line">{product.lineUpLine}</p>

            {/* The actives, with doses. The strongest content the brand owns. */}
            <ul className="sku__actives">
              {product.actives.map((a) => (
                <li key={a.name} className="t-data">
                  <span>{a.name}</span>
                  <b>{a.dose}</b>
                </li>
              ))}
            </ul>

            <div className="sku__meta">
              <span className="t-body-s">
                <Stars n={5} /> <Data>{product.reviewCount}</Data> reviews
              </span>
              <span className="t-data">from {money(fromPrice(product))}</span>
            </div>

            <PackSelector product={product} value={sku} onChange={setSku} />

            <div className="sku__actions">
              <Button
                variant="primary"
                full
                onClick={() => onAdd({ kind: "pack", sku: pack.sku })}
              >
                Add to cart · {money(pack.price)}
              </Button>
              <Link to={`/products/${product.handle}`} className="t-body-s sku__more link-arrow">
                Read the full formula and research <NextIcon size="1em" />
              </Link>
            </div>

            <TrustRow />
          </div>
        </div>
      </Band>
    </div>
  );
}

/* ---------------------------------------------------------------- grid ---- */

/** Card grid with concern facets. Takes over once the catalogue passes
    BAND_LAYOUT_MAX, because a full bleed band per product stops working when
    there are ten of them. */
function Grid({ onAdd, results }: { onAdd: AddFn; results: Product[] }) {
  /* The grid no longer owns a facet of its own. It had a private concern
     filter that the shared bar would have silently fought with, and two
     filters over one list is how a shop starts lying about its own count. */
  return (
    <Band tone="cream">
      <div className="grid">
        {results.map((p) => (
          <article key={p.handle} className={`gcard theme-${p.theme}`}>
            <Link to={`/products/${p.handle}`}>
              {bottleFor(p.handle) ? (
                <img
                  className="gcard__bottle"
                  {...img(bottleFor(p.handle)!)}
                  alt={p.name}
                  loading="lazy"
                />
              ) : (
                <Shot basename={p.images[0]} alt={p.name} ratio="1 / 1" />
              )}
            </Link>
            <p className="t-label t-muted">{p.descriptor}</p>
            <h3 className="t-heading-s">
              <Link to={`/products/${p.handle}`}>{p.name}</Link>
            </h3>
            <p className="t-data gcard__hero">
              {p.formula[0].name} {p.formula[0].dose}
            </p>
            <div className="gcard__foot">
              <span className="t-data">from {money(fromPrice(p))}</span>
              <Button
                variant="secondary"
                disabled={!defaultPack(p.handle)}
                onClick={() => {
                  const pack = defaultPack(p.handle);
                  if (pack) onAdd({ kind: "pack", sku: pack.sku });
                }}
              >
                {defaultPack(p.handle) ? "Add" : "Out of stock"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------- compare ---- */

/** A shared attribute grid across every product. No benchmark site in the
    category offers one. Caps at COMPARE_MAX columns with a picker above that,
    because a table wider than three columns stops being readable on a phone
    however it scrolls. */
function Compare() {
  const needsPicker = products.length > COMPARE_MAX;
  const [chosen, setChosen] = useState<string[]>(
    products.slice(0, COMPARE_MAX).map((p) => p.handle)
  );

  const shown = needsPicker
    ? products.filter((p) => chosen.includes(p.handle))
    : products;

  const toggle = (handle: string) =>
    setChosen((cur) =>
      cur.includes(handle)
        ? cur.filter((h) => h !== handle)
        : cur.length >= COMPARE_MAX
          ? [...cur.slice(1), handle]
          : [...cur, handle]
    );

  return (
    <Band tone="cream" id="compare">
      <SectionHead
        eyebrow="Side by side"
        title="Which shot is yours"
        lede="The same seven attributes for every shot, so the choice is a comparison rather than a guess."
      />

      {needsPicker && (
        <div className="grid__facets cmp__picker">
          {products.map((p) => (
            <button
              key={p.handle}
              className={`chip${chosen.includes(p.handle) ? " chip--active" : ""}`}
              aria-pressed={chosen.includes(p.handle)}
              onClick={() => toggle(p.handle)}
            >
              {p.shortName}
            </button>
          ))}
        </div>
      )}

      <div className="cmp scroller">
        <table className="cmp__table">
          <caption className="visually-hidden">
            Comparison of the DASH wellness shots
          </caption>
          <thead>
            <tr>
              <th scope="col" className="t-label t-muted cmp__stub">
                Attribute
              </th>
              {shown.map((p) => (
                <th key={p.handle} scope="col" className={`theme-${p.theme} cmp__head`}>
                  <span className="cmp__swatch" aria-hidden />
                  <span className="t-heading-s cmp__name">{p.shortName}</span>
                  {/* The column's own price, so the header identifies the
                      shot rather than only naming it. */}
                  <span className="t-data t-muted cmp__from">
                    from {money(fromPrice(p))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* One tbody per group. Valid HTML, and it lets each group carry its
              own heading row and its own closing rule without a class on
              every cell counting rows. */}
          {comparisonGroups.map((group) => {
            const rows = comparisonRows.filter((r) => r.group === group.id);
            if (!rows.length) return null;
            return (
              <tbody key={group.id} className="cmp__group">
                <tr className="cmp__grouphead">
                  <th scope="colgroup" colSpan={shown.length + 1} className="t-label t-muted">
                    {group.label}
                  </th>
                </tr>
                {rows.map((row) => (
                  <tr key={row.label} className={row.lead ? "cmp__row cmp__row--lead" : "cmp__row"}>
                    <th scope="row" className="t-body-s cmp__stub">
                      {row.label}
                    </th>
                    {shown.map((p) => (
                      <td key={p.handle} className="cmp__val">
                        {row.get(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            );
          })}

          <tbody className="cmp__group">
            <tr className="cmp__row cmp__row--buy">
              <th scope="row" className="t-body-s cmp__stub">
                Buy
              </th>
              {shown.map((p) => (
                <td key={p.handle}>
                  <Link to={`/products/${p.handle}`} className="t-body-s cmp__link">
                    See {p.shortName}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------- bundles ---- */

function Bundles({ onAdd }: { onAdd: AddFn }) {
  return (
    <div className="theme-burn">
      <Band tone="soft" id="bundles" clip="none">
        <SectionHead
          eyebrow="Sets"
          title="Ways to start"
          lede="These are proposals, not current merchandising. They are tagged so nobody mistakes them for the live range."
        />

        <Reveal selector=".bundle" stagger={0.07}>
          <div className="bundles">
            <article className="bundle">
              <p className="t-label t-muted">
                Lowest risk <SourceTag source={proposals.trio.source} />
              </p>
              <h3 className="t-heading-m">{proposals.trio.name}</h3>
              <p className="t-body-s">{proposals.trio.detail}</p>
              <p className="t-body-s t-muted bundle__note">{proposals.trio.note}</p>
              <div className="bundle__foot">
                <span className="t-data">{money(proposals.trio.price)}</span>
                <Button variant="primary" onClick={() => onAdd({ kind: "bundle", id: "trio" })}>
                  Add
                </Button>
              </div>
            </article>

            {proposals.bundles.map((b) => {
              const total = products.reduce(
                (sum, p) => sum + (p.packs.find((k) => k.servings === 30)?.price ?? 0),
                0
              );
              return (
                <article key={b.name} className="bundle">
                  <p className="t-label t-muted">
                    Full ritual <SourceTag source={b.source} />
                  </p>
                  <h3 className="t-heading-m">{b.name}</h3>
                  <p className="t-body-s">{b.detail}</p>
                  <p className="t-body-s t-muted bundle__note">
                    Thirty days of each shot, which is the ritual the brand
                    recommends for noticeable results.
                  </p>
                  <div className="bundle__foot">
                    <span className="t-data">{money(total)}</span>
                    <Button variant="primary" onClick={() => onAdd({ kind: "bundle", id: "day30" })}>
                      Add
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>

        <p className="t-body-s t-muted bundles__foot">
          {concernOf(products[0])?.question}. {concernOf(products[1])?.question}.{" "}
          {concernOf(products[2])?.question}.
        </p>
      </Band>
    </div>
  );
}
