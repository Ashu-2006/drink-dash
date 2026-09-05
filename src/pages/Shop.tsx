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
import { bottleFor, img, packFor } from "../lib/media";
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
      {/* The concern rail is an anchor nav, so it only makes sense while every
          product it points at is on the page. */}
      {results.length === products.length && <ConcernRail />}

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

/** Sticky concern selector. Facets come from the taxonomy, so a new concern
    appears here automatically. Its own overflow container, so the page itself
    never scrolls sideways. */
function ConcernRail() {
  const [active, setActive] = useState<string>("all");
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
    <div className="rail">
      <div className="shell">
        <div className="rail__scroll scroller">
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip${active === c.id ? " chip--active" : ""}`}
              aria-pressed={active === c.id}
              onClick={() => go(c.id)}
            >
              {c.label}
            </button>
          ))}
          <button type="button" className="chip chip--outline" onClick={() => go("all")}>
            Compare all
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ sku band ---- */

/** One product, full bleed, in its own colour, with everything needed to buy.
    Used while the catalogue is small. */
function SkuBand({ product, onAdd }: { product: Product; onAdd: AddFn }) {
  const [sku, setSku] = useState(product.packs[1]?.sku ?? product.packs[0].sku);
  const pack = product.packs.find((p) => p.sku === sku) ?? product.packs[0];
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} id={`sku-${product.handle}`} className={`theme-${product.theme}`}>
      <Band tone="base" clip="bottom" overlap>
        <div className="sku">
          <div className="sku__media">
            {/* The band ground is the product's own colour, so the cut-out
                sits straight on it with no plate. */}
            {bottleFor(product.handle) ? (
              <img
                className="sku__bottle"
                {...img(bottleFor(product.handle)!)}
                alt={`${product.name}, ${product.descriptor}`}
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
            <div className="sku__thumbs scroller">
              {packFor(product.handle) && (
                <img {...img(packFor(product.handle)!)} loading="lazy" />
              )}
              {product.images.slice(1, 3).map((basename) => (
                <img key={basename} src={`/media/${basename}.jpg`} alt="" loading="lazy" />
              ))}
            </div>
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
                  <span className="t-heading-s">{p.shortName}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="t-body-s cmp__stub">
                  {row.label}
                </th>
                {shown.map((p) => (
                  <td key={p.handle} className="t-body-s">
                    {row.get(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
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
