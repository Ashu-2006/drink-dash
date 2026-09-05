/* ==========================================================================
   Home.

   Every string is from drinkdash.in unless it carries a Proposal tag.
   Section count is deliberately 8, not the 11 of the first pass. The live site
   is verbose; the fix is hierarchy, not volume. Long prose sits behind
   disclosure, the strongest line stays visible.
   ========================================================================== */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import {
  Band,
  Button,
  Chip,
  Data,
  Marquee,
  Reveal,
  SectionHead,
  Shot,
  SourceTag,
  SplitHeading,
  Stars,
  reduced,
} from "../components/primitives";
import {
  BRAND,
  concernOf,
  fromPrice,
  money,
  products,
  proposals,
  RITUAL_NOTE,
} from "../lib/catalog";
import { FloodTypeCard } from "../motion/floodtype/FloodTypeCard";
import { StampTypeCard } from "../motion/stamptype/StampTypeCard";
import "./home.css";
import { defaultPack } from "../lib/cart";
import type { AddFn } from "../lib/cart";

export default function Home({ onAdd }: { onAdd: AddFn }) {
  /* Lenis on Home only. The product and detail pages use native scroll,
     because that is where people buy and Lenis drops to 30fps in low power
     mode and interferes with anchors. */
  useEffect(() => {
    if (reduced()) return;
    const lenis = new Lenis({ lerp: 0.12 });
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Hero />
      <Marquee items={BRAND.marquee} tone="ink" />
      <LineUp onAdd={onAdd} />
      <Vocabulary />
      <Standards />
      <Why />
      <Ritual />
      <Promises />
      <Ladder />
      <Diaries />
    </>
  );
}

/* --------------------------------------------------------------- 1. hero -- */

function Hero() {
  const wrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced() || !wrap.current) return;
      // The pack shot drifts up as the hero leaves. Transform only.
      gsap.to(wrap.current.querySelector(".hero__shot"), {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    },
    { scope: wrap }
  );

  return (
    <div ref={wrap} className="theme-glow">
      <Band tone="base" clip="bottom" overlap wide>
        <div className="shell hero">
          <div className="hero__copy">
            <p className="t-label">Wellness shots</p>
            <SplitHeading text={BRAND.hero.lines[0]} />
            <SplitHeading text={BRAND.hero.lines[1]} />
            <p className="t-body hero__body">{BRAND.hero.body}</p>
            <div className="hero__actions">
              <Button as="link" to="/shop" variant="primary">
                {BRAND.hero.cta}
              </Button>
              <Button as="link" to="/products/dash-of-glow" variant="ghost">
                Start with Glow
              </Button>
            </div>
            <ul className="hero__facts">
              <li className="t-data">60 ml</li>
              <li className="t-data">1 shot a day</li>
              <li className="t-data">No added sugar</li>
              <li className="t-data">Lab-tested</li>
            </ul>
          </div>

          <div className="hero__media">
            <Shot
              basename="glow-1"
              alt="Dash of Glow, a 60ml wellness shot, shown with its pack"
              ratio="1 / 1"
              priority
            />
          </div>
        </div>
      </Band>
    </div>
  );
}

/* ------------------------------------------------------------ 2. line up -- */

/** The brand's own section. Three products, each with the site's own one line
    description, and a route straight to buy. Scales past three: the grid
    reflows and nothing is positioned per product. */
function LineUp({ onAdd }: { onAdd: AddFn }) {
  return (
    <Band tone="cream" id="lineup">
      <SectionHead eyebrow={BRAND.lineUp.eyebrow} title={BRAND.lineUp.title.replace(".", "")} />

      <Reveal selector=".pcard" stagger={0.08}>
        <div className="pgrid">
          {products.map((p) => (
            <article key={p.handle} className={`pcard theme-${p.theme}`}>
              <Link to={`/products/${p.handle}`} className="pcard__media">
                <Shot basename={p.images[0]} alt={`${p.name}, ${p.descriptor}`} ratio="1 / 1" />
              </Link>

              <div className="pcard__body">
                <p className="t-label t-muted">{p.descriptor}</p>
                <h3 className="t-heading-m pcard__name">
                  <Link to={`/products/${p.handle}`}>{p.name}</Link>
                </h3>

                {/* Proof on the card: the hero active with its dose, and the
                    rating. No benchmark site does this. */}
                <p className="pcard__hero t-data">
                  {p.formula[0].name} {p.formula[0].dose}
                </p>
                <p className="t-body-s pcard__line">{p.lineUpLine}</p>

                <div className="pcard__meta">
                  <span className="t-body-s">
                    <Stars n={5} /> <Data>{p.reviewCount}</Data>
                  </span>
                  <span className="t-data">from {money(fromPrice(p))}</span>
                </div>

                <div className="pcard__actions">
                  {/* The card adds the Recommended Pack. When nothing in the
                      line is in stock there is no pack to add, so the control
                      says so instead of failing on press. */}
                  <Button
                    variant="secondary"
                    disabled={!defaultPack(p.handle)}
                    onClick={() => {
                      const pack = defaultPack(p.handle);
                      if (pack) onAdd({ kind: "pack", sku: pack.sku });
                    }}
                  >
                    {defaultPack(p.handle) ? "Add to cart" : "Out of stock"}
                  </Button>
                  <Link to={`/products/${p.handle}`} className="t-body-s pcard__more">
                    See the formula
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      {/* A proposal, tagged as one. */}
      <Reveal>
        <aside className="trio theme-burn">
          <div>
            <p className="t-label t-muted">
              Not sure which one <SourceTag source={proposals.trio.source} />
            </p>
            <h3 className="t-heading-m trio__name">{proposals.trio.name}</h3>
            <p className="t-body-s trio__detail">{proposals.trio.detail}</p>
            <p className="t-body-s t-muted trio__note">{proposals.trio.note}</p>
          </div>
          <div className="trio__buy">
            <p className="t-data trio__price">{money(proposals.trio.price)}</p>
            <Button variant="primary" onClick={() => onAdd({ kind: "bundle", id: "trio" })}>
              Add the trio
            </Button>
          </div>
        </aside>
      </Reveal>
    </Band>
  );
}

/* --------------------------------------------------------- 3. vocabulary -- */

/** Flood type. The brand's own vocabulary, two words at a time, rushing the
    frame. It sits after the line-up because by then the visitor knows what the
    products are and can afford a beat of pure brand. */
function Vocabulary() {
  return (
    <Band tone="cream" clip="none">
      <FloodTypeCard label="The words Skin Glow, Hair Growth, One Shot, Daily Ritual, Sixty Millilitres and Named Doses each fall into frame, hold, rush forward until they overrun the edges, and tumble away." />
    </Band>
  );
}

/* ----------------------------------------------------------- 4. standards -- */

function Standards() {
  return (
    <Band tone="soft" clip="bottom" overlap>
      <div className="theme-volume">
        <Reveal selector=".std" stagger={0.05}>
          <ul className="stds">
            {BRAND.badges.map((b) => (
              <li key={b} className="std t-label">
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal>
          <blockquote className="statement t-heading-m">{BRAND.statement}</blockquote>
        </Reveal>
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------------- 5. why -- */

/** The live WHY DASH? block is three long paragraphs. The first sentence
    carries the argument, so it leads and the rest opens on demand. */
function Why() {
  const [open, setOpen] = useState(false);
  const first = BRAND.why.paragraphs[0].split(". ")[0] + ".";

  return (
    <Band tone="cream">
      <div className="why">
        <p className="t-label t-muted">{BRAND.why.title}</p>
        <p className="t-heading-l why__lead">{first.replace(/[.,]/g, "")}</p>
        <p className="t-body why__rest">{BRAND.why.paragraphs[0].slice(first.length).trim()}</p>

        <div hidden={!open} className="why__more">
          {BRAND.why.paragraphs.slice(1).map((t) => (
            <p key={t.slice(0, 24)} className="t-body">
              {t}
            </p>
          ))}
        </div>

        <button className="t-label why__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Show less" : "Read more"}
        </button>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------- 5. ritual -- */

/** The real video from the store, in the brand's own ritual section.
    Muted, loop, plays only while on screen, poster from real photography. */
function Ritual() {
  const ref = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    const host = ref.current;
    if (!el || !host) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="theme-glow">
      <Band tone="ink" clip="bottom" overlap wide>
        <div className="shell ritual">
          <div className="ritual__copy">
            <p className="t-label">{BRAND.ritualSection.kicker}</p>
            <h2 className="t-display-xl ritual__title">{BRAND.ritualSection.title}</h2>
            <p className="t-heading-m ritual__sub">{BRAND.ritualSection.sub}</p>
            <ol className="ritual__steps">
              <li className="t-body">
                <span className="t-data">01</span> Shake well before use
              </li>
              <li className="t-body">
                <span className="t-data">02</span> Twist the cap
              </li>
              <li className="t-body">
                <span className="t-data">03</span> Drink it straight, no dilution
              </li>
            </ol>
          </div>
          <div className="ritual__media">
            <video
              ref={video}
              src={BRAND.ritualSection.video}
              poster="/media/glow-6.jpg"
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A DASH shot being shaken and opened"
            />
          </div>
        </div>
      </Band>
    </div>
  );
}

/* ---------------------------------------------------------- 6. promises -- */

/** Stamp type. Four lines of real brand copy per pass, printing their own
    residue as they move. This carries the plain promises: no water, no mixing,
    no drama, and the honest one about thirty days being the ritual. */
function Promises() {
  return (
    <Band tone="cream" clip="none">
      <SectionHead
        eyebrow="In plain words"
        title="What the shot actually asks of you"
        lede="One bottle a day. Nothing to mix, nothing to measure, and an honest line about how long it takes."
      />
      <div className="promises">
        <StampTypeCard />
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------- 7. ladder -- */

/** The pack arithmetic, reconciled against the brand's own 30 day ritual
    recommendation. No competitor connects these two numbers. */
function Ladder() {
  const glow = products[0];
  return (
    <Band tone="white" id="ladder">
      <SectionHead
        eyebrow="The maths"
        title="A 30 day ritual needs 30 shots"
        lede={RITUAL_NOTE.text}
      />

      <Reveal selector=".rung" stagger={0.07}>
        <div className="rungs">
          {glow.packs.map((p) => {
            const covers = p.servings >= RITUAL_NOTE.days;
            const unit = Math.round(p.price / p.servings);
            return (
              <div key={p.sku} className={`rung${covers ? " rung--covers" : ""}`}>
                <p className="t-label t-muted">
                  {p.servings === 6 ? "Trial Pack" : p.servings === 12 ? "Starter Pack" : "Recommended Pack"}
                </p>
                <p className="t-heading-l rung__days">
                  <span className="t-data">{p.servings}</span>
                </p>
                <p className="t-body-s">days of the {RITUAL_NOTE.days} recommended</p>
                <div className="rung__bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (p.servings / RITUAL_NOTE.days) * 100)}%` }} />
                </div>
                <p className="t-data rung__unit">{money(unit)} a shot</p>
              </div>
            );
          })}
        </div>
      </Reveal>

      <p className="t-body t-muted ladder__note">
        The Trial Pack and the Starter Pack are for getting started and for
        finding your flavour. Only the Recommended Pack covers the ritual the
        brand actually recommends, and it is{" "}
        <Data>
          {Math.round(
            (1 - glow.packs[2].price / glow.packs[2].servings / (glow.packs[0].price / glow.packs[0].servings)) * 100
          )}
          %
        </Data>{" "}
        cheaper a shot than the Trial Pack.
      </p>
    </Band>
  );
}

/* ------------------------------------------------------------ 8. diaries -- */

function Diaries() {
  return (
    <Band tone="cream" clip="none">
      <SectionHead eyebrow="Reading" title={BRAND.diaries.title} />
      <Reveal selector=".diary" stagger={0.07}>
        <div className="diaries">
          {BRAND.diaries.posts.map((post, i) => (
            <article key={post.title} className={`diary theme-${products[i]?.theme ?? "glow"}`}>
              <span className="t-data diary__num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="t-heading-s diary__title">{post.title}</h3>
              <p className="t-body-s t-muted">{post.blurb}</p>
              <span className="t-label diary__more">Read more</span>
            </article>
          ))}
        </div>
      </Reveal>

      <div className="social">
        <p className="t-heading-m">{BRAND.social.title}</p>
        <p className="t-data social__handle">{BRAND.social.handle}</p>
        <div className="social__strip scroller">
          {products.flatMap((p) => p.images.slice(0, 3)).map((img) => (
            <img key={img} src={`/media/${img}.jpg`} alt="" loading="lazy" />
          ))}
        </div>
      </div>

      <div className="chips-row">
        {products.map((p) => (
          <Chip key={p.handle}>
            {concernOf(p)?.label} · {p.flavour}
          </Chip>
        ))}
      </div>
    </Band>
  );
}
