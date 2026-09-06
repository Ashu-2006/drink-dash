/* ==========================================================================
   Home.

   Every string is from drinkdash.in unless it carries a Proposal tag.
   Section count is deliberately 8, not the 11 of the first pass. The live site
   is verbose; the fix is hierarchy, not volume. Long prose sits behind
   disclosure, the strongest line stays visible.
   ========================================================================== */

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
import { NextIcon } from "../components/icons";
import { DiaryList } from "../components/DiaryCard";
import { diaries as allDiaries } from "../lib/diaries";
import {
  BRAND,
  concernOf,
  fromPrice,
  money,
  products,
  proposals,
  RITUAL_NOTE,
  tierFor,
} from "../lib/catalog";
import { FloodTypeCard } from "../motion/floodtype/FloodTypeCard";
import { StampTypeCard } from "../motion/stamptype/StampTypeCard";
import "./home.css";
import { defaultPack } from "../lib/cart";
import type { AddFn } from "../lib/cart";
import { HowItWorks } from "../components/HowItWorks";
import { Closer } from "../components/Closer";
import { MarkTexture } from "../components/Mark";
import { bottleFor, img } from "../lib/media";

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
      <HowItWorks />
      <Vocabulary />
      <Standards />
      <Why />
      <Ritual />
      <Promises />
      <Ladder />
      {/* The conversion point. After the maths, before the reading: see the
          note at the top of components/Closer.tsx for why it sits here. */}
      <Closer onAdd={onAdd} />
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
      <Band tone="base" clip="bottom" wide>
        {/* The mark, tiled. The cartons print the same device, so the hero
            ground carries the packaging texture rather than a flat fill. Low
            enough that ink on coral keeps its 6.79 against the lighter of the
            two tones the texture creates. */}
        <MarkTexture tile={168} angle={-12} opacity={0.05} />
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
              {/* The cut-out sits directly on the card's own tint, so the
                  card reads as one object rather than a photo pasted into a
                  frame. Falls back to the packshot if a bottle is missing. */}
              <Link to={`/products/${p.handle}`} className="pcard__media">
                {bottleFor(p.handle) ? (
                  <img
                    className="pcard__bottle"
                    {...img(bottleFor(p.handle)!)}
                    alt={`${p.name}, ${p.descriptor}`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <Shot basename={p.images[0]} alt={`${p.name}, ${p.descriptor}`} ratio="1 / 1" />
                )}
              </Link>

              <div className="pcard__body">
                <p className="t-label t-muted">{p.descriptor}</p>
                <h3 className="t-heading-m pcard__name">
                  <Link to={`/products/${p.handle}`}>{p.name}</Link>
                </h3>

                {/* Proof on the card: the rating and the count. The hero
                    active and its dose used to sit here too, which put a
                    dosed ingredient above the line that says what the shot is
                    for. The dose belongs on the product page and in the
                    comparison, where there is something to compare it to. */}
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
                  <Link to={`/products/${p.handle}`} className="t-body-s pcard__more link-arrow">
                    See the formula <NextIcon size="1em" />
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
    <Band tone="soft" clip="bottom">
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
      <Band tone="ink" clip="bottom" wide>
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

/* Seconds. A mark lights in MARK_LIT and the next starts MARK_STEP later, so
   a row of n marks runs for MARK_STEP * (n - 1) + MARK_LIT. The bottle is
   given that same figure so the two stay locked together. */
const MARK_LIT = 0.12;
const MARK_STEP = 0.06;

/** The pack arithmetic, reconciled against the brand's own 30 day ritual
    recommendation. No competitor connects these two numbers.

    It was three cards in a grid, each with its own progress bar filling its
    own card. That is three charts, not one comparison: every bar ran the full
    width of its box, so a pack covering a fifth of the ritual drew the same
    length of track as a pack covering all of it, and the only thing carrying
    the difference was the fill percentage inside three separate frames. The
    eye cannot compare lengths that do not share a baseline.

    So there is one baseline now. Thirty days, drawn once as thirty marks, and
    each pack laid along it. A six pack lights six and leaves twenty four dark
    against the same finish line the thirty pack reaches. The shortfall stops
    being a sentence and becomes a gap you can count.

    The marks fill on scroll, scrubbed, one row running into the next, because
    the argument is sequential: this pack gets this far, this one further,
    this one all the way. The fill is the argument being made at reading pace
    rather than a flourish laid over it.

    Resting state is lit. The tween is a fromTo out of scaleX 0, so if the
    script never runs the marks are already in their final positions and the
    section is a correct static chart. */
function Ladder() {
  const glow = products[0];
  const cap = bottleFor(glow.handle);
  const days = RITUAL_NOTE.days;
  const wrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = wrap.current;
      /* Under reduced motion the chart is simply drawn. It is information, so
         it is never withheld pending a scroll that may not happen. */
      if (!root || reduced()) return;
      const rows = gsap.utils.toArray<HTMLElement>(".rung", root);
      if (!rows.length) return;

      /* One ScrollTrigger, on the timeline. Per row triggers on the same
         range would fill all three at once and lose the sequence. */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 80%",
          end: "bottom 72%",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      rows.forEach((row) => {
        const marks = row.querySelectorAll<HTMLElement>(".pip__ink");
        if (!marks.length) return;

        tl.fromTo(
          marks,
          { scaleX: 0 },
          {
            scaleX: 1,
            /* Linear, so scroll distance and fill are the same measure. A
               curve here would make the count speed up and slow down against
               a thumb moving evenly. */
            ease: "none",
            duration: MARK_LIT,
            stagger: MARK_STEP,
          },
          /* Rows overlap slightly, so the sequence reads as one run rather
             than three waits. */
          ">-0.5"
        );

        /* The bottle rides the leading edge, so it arrives at the pack's last
           day exactly as the last mark lights. Same span as the stagger above
           and started at the same instant, or it drifts off the front of its
           own row. */
        const bottle = row.querySelector<HTMLElement>(".rung__bottle");
        const pips = row.querySelectorAll<HTMLElement>(".pip");
        const last = Number(row.dataset.servings) - 1;
        if (!bottle || !pips[last] || !pips[0]) return;

        const span = MARK_STEP * Math.max(0, marks.length - 1) + MARK_LIT;
        tl.fromTo(
          bottle,
          /* Measured on refresh rather than captured once, so a resize does
             not leave the bottle travelling yesterday's distance. */
          { x: () => pips[0].offsetLeft - pips[last].offsetLeft },
          { x: 0, ease: "none", duration: span },
          "<"
        );
      });
    },
    { scope: wrap }
  );

  return (
    <Band tone="white" id="ladder">
      <SectionHead
        eyebrow="The maths"
        title="A 30 day ritual needs 30 shots"
        lede={RITUAL_NOTE.text}
      />

      <div
        className="ladder"
        ref={wrap}
        style={{ "--days": days } as CSSProperties}
      >
        {/* The scale, once, above the three tracks it measures. */}
        <div className="ladder__scale t-label t-muted">
          <span className="ladder__ends">
            <span>Day 1</span>
            <span>Day {days}</span>
          </span>
        </div>

        <ol className="ladder__rows">
          {glow.packs.map((p) => {
            const short = Math.max(0, days - p.servings);
            const covers = short === 0;
            const unit = Math.round(p.price / p.servings);
            return (
              <li
                key={p.sku}
                className={`rung${covers ? " rung--covers" : ""}`}
                data-servings={p.servings}
              >
                <div className="rung__id">
                  <p className="t-label rung__tier">
                    {tierFor(p.servings)?.name ?? `${p.servings} servings`}
                  </p>
                  <p className="rung__count">
                    <span className="t-data">{p.servings}</span> shots
                  </p>
                </div>

                {/* The chart is a picture of the sentence beside it, so it is
                    hidden from the tree rather than read out as thirty
                    unlabelled marks. */}
                {/* Thirty cells always, so the geometry of the track never
                    changes between rows. The pack's last day is drawn as the
                    bottle instead of a mark, which is what the bottle is: the
                    shot you take on that day. */}
                <div className="rung__track" aria-hidden="true">
                  {/* Every cell states its own column. Auto placement will not
                      put two items in one cell, so with the bottle sitting on
                      day N the mark that wanted that cell was pushed along and
                      the thirtieth fell onto a second row: an orphan under day
                      one, a track twice as tall as it needed to be, and a
                      travel distance measured to the wrong element. Placed
                      explicitly, the bottle and its day share a cell. */}
                  {Array.from({ length: days }, (_, i) => (
                    <span
                      key={i}
                      className="pip"
                      style={{ gridColumn: i + 1 } as CSSProperties}
                    >
                      {i < p.servings - 1 && <span className="pip__ink" />}
                    </span>
                  ))}
                  {cap && (
                    <img
                      className="rung__bottle"
                      {...img(cap)}
                      alt=""
                      style={{ "--n": p.servings } as CSSProperties}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>

                <p className="rung__verdict">
                  {covers ? `Covers all ${days}` : `${short} days short`}
                </p>

                {/* Two lines, not one. "Rs 130 a shot" in the tabular face
                    broke across the column and left the symbol stranded on a
                    line of its own. The figure is the thing being compared;
                    the unit is a label for it. */}
                <p className="rung__unit">
                  <span className="t-data rung__price">{money(unit)}</span>
                  <span className="t-body-s rung__per">a shot</span>
                </p>
              </li>
            );
          })}
        </ol>
      </div>

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

/* Newest first, three across. The catalogue is the source, not a hand kept
   list of titles that has to be edited twice. */
const HOME_DIARY_COUNT = 3;

function Diaries() {
  const homeDiaries = [...allDiaries]
    .sort((a, b) => b.iso.localeCompare(a.iso))
    .slice(0, HOME_DIARY_COUNT);

  return (
    <Band tone="cream" clip="none">
      <SectionHead eyebrow="Reading" title={BRAND.diaries.title} />
      {/* The same card the Diaries index and the article footer use. This was
          a look-alike built from a second copy list that linked nowhere, so
          the home page advertised three articles it could not open. */}
      <Reveal selector=".dcard" stagger={0.07}>
        <DiaryList items={homeDiaries} level={3} />
      </Reveal>

      <div className="social">
        <p className="t-heading-m">{BRAND.social.title}</p>
        <p className="t-data social__handle">{BRAND.social.handle}</p>
        {/* The only human photography in the set leads the strip, because a
            social wall of packshots is not social. */}
        <div className="social__strip scroller">
          <img
            className="social__lead"
            {...img("people-sofa")}
            loading="lazy"
            decoding="async"
          />
          {products.flatMap((p) => p.images.slice(0, 3)).map((basename) => (
            <img key={basename} src={`/media/${basename}.jpg`} alt="" loading="lazy" />
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
