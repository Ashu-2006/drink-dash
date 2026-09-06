/* ==========================================================================
   /previous  The archived first iteration of the Home page.

   Eleven sections as specified in PLAN.md Part 3, rebuilt. The original
   component files were written by build agents and deleted during the content
   rewrite; their source is not in the session history, so this is a
   reconstruction from the plan, the screenshots and the recorded data schema
   rather than a byte for byte restore.

   Its content is iteration one content, which the audit found to be largely
   invented. It lives in lib/previous-data.ts and is never imported by a live
   page. Every fabricated figure keeps the Placeholder tag it carried then.

   The token layer is the current, fixed one. Iteration one shipped with an em
   based spacing scale and an em container max width, which produced a 576px
   void in the footer and a layout that never stopped growing. Reproducing those
   bugs would archive a defect, not a design.
   ========================================================================== */

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Band,
  Button,
  Chip,
  Data,
  Reveal,
  SectionHead,
  Shot,
  Stars,
  reduced,
} from "../components/primitives";
import { BottleScene } from "../three/Bottle";
import {
  OLD_COMMERCE,
  oldBundles,
  oldFaq,
  oldHowItWorks,
  oldMoney,
  oldPerServing,
  oldProducts,
  oldReviews,
  oldTrialTrio,
} from "../lib/previous-data";
import type { OldProduct } from "../lib/previous-data";
import { CaretIcon } from "../components/icons";
import "./previous.css";
import type { AddFn } from "../lib/cart";
import { useTitle } from "../lib/useTitle";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Previous({ onAdd }: { onAdd: AddFn }) {
  useTitle("First iteration");

  return (
    <>
      <ArchiveTag />
      <Hero />
      <ConcernTiles />
      <TrialTrio onAdd={onAdd} />
      <Anatomy />
      <HowItWorks />
      <ProofStrip />
      <ThreeShots onAdd={onAdd} />
      <Reviews />
      <Ladder />
      <Faq />
    </>
  );
}

/** A corner marker rather than a banner, so the archived layout is unchanged. */
function ArchiveTag() {
  return (
    <p className="archtag t-label">
      Archive · iteration 1 · content largely invented, see the audit
    </p>
  );
}

/* --------------------------------------------------------------- 1. hero -- */

function Hero() {
  const glow = oldProducts[0];
  return (
    <div className="theme-glow">
      <Band tone="base" clip="bottom" wide>
        <div className="shell prev-hero">
          <div className="prev-hero__copy">
            <p className="t-label">Wellness shots</p>
            <h1 className="t-display-xxl prev-hero__title">One shot a day</h1>
            <p className="t-body prev-hero__body">
              {glow.differentiator} <Data>{glow.heroDose}</Data> of{" "}
              {glow.heroActive.toLowerCase()}, hyaluronic acid and the vitamins
              that support collagen formation, in <Data>60ml</Data>.
            </p>
            <div className="prev-hero__actions">
              <Button variant="primary" as="link" to="/previous#shots">
                Shop the shots
              </Button>
              <Button variant="ghost" as="link" to="/previous#proof">
                See the evidence
              </Button>
            </div>

            {/* The four fact strip that sat under the fold line. */}
            <ul className="prev-hero__facts">
              <li>
                <span className="t-data">500mg</span>
                <span className="t-body-s">glutathione</span>
              </li>
              <li>
                <span className="t-data">60ml</span>
                <span className="t-body-s">per shot</span>
              </li>
              <li>
                <span className="t-data">0g</span>
                <span className="t-body-s">added sugar</span>
              </li>
              <li>
                <span className="t-data">1</span>
                <span className="t-body-s">shot a day</span>
              </li>
            </ul>
          </div>

          <div className="prev-hero__media">
            <BottleScene theme="glow" />
          </div>
        </div>
      </Band>
    </div>
  );
}

/* ------------------------------------------------------ 2. concern tiles -- */

/** Three tiles that scroll to a section rather than navigating away, so a
    visitor from an Instagram ad never leaves the page they landed on. */
function ConcernTiles() {
  const go = (handle: string) => {
    const el = document.getElementById(`prev-${handle}`);
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: "smooth" });
  };

  return (
    <Band tone="cream">
      <SectionHead
        eyebrow="Start where you are"
        title="What brought you here"
        lede="Three shots, one concern each. Pick the one that sounds like you, or take the trio and decide later."
      />
      <Reveal selector=".ctile" stagger={0.07}>
        <div className="ctiles">
          {oldProducts.map((p) => (
            <button
              key={p.handle}
              className={`ctile theme-${p.theme}`}
              onClick={() => go(p.handle)}
            >
              <span className="t-label t-muted">{p.concern}</span>
              <span className="t-heading-m ctile__name">{p.shortName}</span>
              <span className="t-body-s ctile__diff">{p.differentiator}</span>
              <span className="ctile__hero t-data">
                {p.heroActive} {p.heroDose}
              </span>
            </button>
          ))}
        </div>
      </Reveal>
    </Band>
  );
}

/* --------------------------------------------------------- 3. trial trio -- */

function TrialTrio({ onAdd }: { onAdd: AddFn }) {
  return (
    <div className="theme-burn">
      <Band tone="pale" clip="bottom">
        <div className="ttrio">
          <div>
            <p className="t-label t-muted">
              Not sure which one <span className="tag-proposal t-label">Placeholder</span>
            </p>
            <h2 className="t-heading-l ttrio__name">{oldTrialTrio.name}</h2>
            <p className="t-body ttrio__what">
              {oldTrialTrio.composition}, <Data>{oldTrialTrio.servings}</Data>{" "}
              servings. {oldTrialTrio.purpose}.
            </p>

            {/* The sentence the whole iteration was built around. */}
            <p className="t-heading-s ttrio__honest">{oldTrialTrio.notFor}</p>
            <p className="t-body-s t-muted">{oldTrialTrio.limit}</p>
          </div>

          <div className="ttrio__buy">
            <p className="t-display-xl ttrio__price">
              <Data>{oldMoney(oldTrialTrio.price)}</Data>
            </p>
            <Button variant="primary" onClick={() => onAdd({ kind: "bundle", id: "trio" })}>
              Add the trio
            </Button>
            <p className="t-body-s t-muted ttrio__ship">
              Free shipping over {oldMoney(OLD_COMMERCE.freeShippingThreshold)} ·{" "}
              {OLD_COMMERCE.prepaidNudge}
            </p>
          </div>
        </div>
      </Band>
    </div>
  );
}

/* ------------------------------------------------------- 4. anatomy scrub -- */

/** 300svh sticky section on an ink ground. The five actives rise in sequence,
    each pinned to a hotspot carrying its name and dose, with three copy beats
    at scroll progress 0.3, 0.6 and 0.81. */
function Anatomy() {
  const glow = oldProducts[0];
  const wrap = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [beat, setBeat] = useState(0);

  const beats = [
    "Five actives, every one of them named and dosed.",
    "Doses sit beside the dose the study used, so the number does comparative work.",
    "Nothing hidden behind a proprietary blend.",
  ];

  useGSAP(
    () => {
      if (!wrap.current) return;
      if (reduced()) {
        setStep(glow.actives.length);
        setBeat(2);
        return;
      }
      const st = ScrollTrigger.create({
        trigger: wrap.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          setStep(Math.min(glow.actives.length, Math.floor(p * (glow.actives.length + 1))));
          setBeat(p >= 0.81 ? 2 : p >= 0.6 ? 1 : p >= 0.3 ? 0 : -1);
        },
      });
      return () => st.kill();
    },
    { scope: wrap }
  );

  return (
    <div className="anat" ref={wrap}>
      <div className="anat__sticky">
        <div className="shell anat__inner">
          <div className="anat__stage">
            <BottleScene theme="glow" interactive={false} />
          </div>

          <div className="anat__side">
            <p className="t-label anat__eyebrow">Inside the shot</p>
            <ul className="anat__list">
              {glow.actives.map((a, i) => (
                <li
                  key={a.name}
                  className={`anat__row${i < step ? " anat__row--on" : ""}`}
                >
                  <span className="t-heading-s">{a.name}</span>
                  <span className="t-data anat__dose">{a.dose}</span>
                  <span className="t-body-s anat__supports">{a.supports}</span>
                  {a.studyDose && (
                    <span className="t-data anat__cmp">
                      study used {a.studyDose} · market {a.marketDose}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className={`t-heading-m anat__beat${beat >= 0 ? " anat__beat--on" : ""}`}>
              {beats[Math.max(0, beat)]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- 5. how it works -- */

function HowItWorks() {
  return (
    <div className="theme-volume">
      <Band tone="soft" clip="bottom">
        <SectionHead eyebrow="The ritual" title="How it works" />
        <Reveal selector=".hcard" stagger={0.07}>
          <div className="hcards">
            {oldHowItWorks.map((s) => (
              <article key={s.n} className="hcard">
                <span className="t-data hcard__n">{s.n}</span>
                <h3 className="t-heading-m hcard__title">{s.title}</h3>
                <p className="t-body-s">{s.body}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </Band>
    </div>
  );
}

/* --------------------------------------------------------- 6. proof strip -- */

/** Statistics with their study design, sample size and duration as chips
    beside the number rather than hidden in a footnote. Invented figures carry
    a Placeholder tag. */
function ProofStrip() {
  const glow = oldProducts[0];
  return (
    <Band tone="cream" id="proof">
      <SectionHead
        eyebrow="Proof"
        title="Numbers that carry their own caveats"
        lede="Every figure shows how it was produced. Anything invented for this design is labelled as such."
      />
      <Reveal selector=".pstat" stagger={0.07}>
        <div className="pstats">
          {glow.stats.map((s) => (
            <article key={s.label} className="pstat">
              <p className="t-display-xl pstat__v">
                <Data>{s.value}</Data>
              </p>
              <p className="t-body pstat__l">{s.label}</p>
              <div className="pstat__chips">
                <Chip outline>{s.design}</Chip>
                <Chip outline>
                  <span className="t-data">{s.n}</span>
                </Chip>
                <Chip outline>{s.duration}</Chip>
              </div>
              {s.placeholder && <span className="tag-proposal t-label">Placeholder</span>}
            </article>
          ))}
        </div>
      </Reveal>

      <ol className="pcites">
        {glow.citations.map((c) => (
          <li key={c.id} className="pcite">
            <span className="t-data pcite__n">{String(c.id).padStart(2, "0")}</span>
            <span>
              <span className="t-body-s pcite__t">{c.title}</span>
              <span className="t-body-s t-muted">
                {c.source} · {c.design}
                {c.n ? ` · n = ${c.n}` : ""}
                {c.duration ? ` · ${c.duration}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="t-body-s t-muted pcites__note">
        The sample sizes and durations above were invented for this iteration.
        The audit that found them is in brand/02-content-audit.md.
      </p>
    </Band>
  );
}

/* ------------------------------------------------------- 7. the three shots -- */

/** One full bleed band per product, in its own colour, with an inline pack
    selector and its own add to cart. */
function ThreeShots({ onAdd }: { onAdd: AddFn }) {
  return (
    <div id="shots">
      {oldProducts.map((p) => (
        <ShotBand key={p.handle} product={p} onAdd={onAdd} />
      ))}
    </div>
  );
}

function ShotBand({ product, onAdd }: { product: OldProduct; onAdd: AddFn }) {
  const [sku, setSku] = useState(
    product.packs.find((k) => k.recommended)?.sku ?? product.packs[0].sku
  );
  const pack = product.packs.find((k) => k.sku === sku) ?? product.packs[0];

  return (
    <div id={`prev-${product.handle}`} className={`theme-${product.theme}`}>
      <Band tone="base" clip="bottom">
        <div className="sband">
          <div className="sband__media">
            <Shot basename={product.images[0]} alt={product.name} ratio="1 / 1" />
          </div>

          <div className="sband__copy">
            <p className="t-label">{product.descriptor}</p>
            <h2 className="t-display-xl sband__name">{product.name}</h2>
            <p className="t-body sband__diff">{product.differentiator}</p>
            <p className="t-data sband__hero">
              {product.heroActive} {product.heroDose}
            </p>

            <fieldset className="sband__packs">
              <legend className="t-label t-muted">Choose your pack</legend>
              {product.packs.map((k) => {
                const on = k.sku === sku;
                return (
                  <button
                    key={k.sku}
                    className={`spack${on ? " spack--on" : ""}`}
                    aria-pressed={on}
                    onClick={() => setSku(k.sku)}
                  >
                    <span>
                      <span className="t-heading-s">
                        <Data>{k.servings}</Data> shots
                      </span>
                      <span className="t-body-s spack__badge">
                        <Data>{k.days}</Data> days{k.badge ? ` · ${k.badge}` : ""}
                      </span>
                    </span>
                    <span className="spack__price">
                      <span className="t-data">{oldMoney(k.price)}</span>
                      <span className="t-data spack__unit">
                        {oldMoney(Math.round(oldPerServing(k)))}/shot
                      </span>
                    </span>
                  </button>
                );
              })}
            </fieldset>

            <Button
              variant="primary"
              full
              /* The archived data carries the same skus as the live
                  catalogue, so an add from this page resolves against the
                  live price rather than the archived one. That is correct:
                  the page is a design record, not a second price list. */
              onClick={() => onAdd({ kind: "pack", sku: pack.sku })}
            >
              Add to cart · {oldMoney(pack.price)}
            </Button>

            <p className="t-body-s sband__judge">
              Judge results at day <Data>{product.judgeAtDay}</Data>. Dispatched in{" "}
              {OLD_COMMERCE.dispatchHours}. {OLD_COMMERCE.returnWindowDays} day returns.
            </p>
          </div>
        </div>
      </Band>
    </div>
  );
}

/* ------------------------------------------------------------- 8. reviews -- */

/** Filterable by days on product, which no benchmark site offered and which is
    the most decision relevant attribute for a supplement. */
function Reviews() {
  const [min, setMin] = useState(0);
  const filters = [
    { label: "All", v: 0 },
    { label: "7 days plus", v: 7 },
    { label: "14 days plus", v: 14 },
    { label: "30 days plus", v: 30 },
  ];
  const shown = useMemo(() => oldReviews.filter((r) => r.days >= min), [min]);

  return (
    <div className="theme-glow">
      <Band tone="soft" clip="bottom">
        <SectionHead
          eyebrow="From customers"
          title="Sorted by how long they have taken it"
          lede="For a supplement, time on product is the most decision relevant thing a review can tell you."
        />

        <div className="rfilters">
          {filters.map((f) => (
            <button
              key={f.label}
              className={`chip${min === f.v ? " chip--active" : ""}`}
              aria-pressed={min === f.v}
              onClick={() => setMin(f.v)}
            >
              {f.label}
            </button>
          ))}
          <span className="t-body-s t-muted rfilters__count">
            <Data>{shown.length}</Data> of <Data>{oldReviews.length}</Data>
          </span>
        </div>

        <div className="rgrid">
          {shown.map((r) => (
            <blockquote key={r.name} className="rcard">
              <div className="rcard__top">
                <Stars n={r.stars} />
                <span className="t-data rcard__days">Day {r.days}</span>
              </div>
              <p className="t-body">{r.text}</p>
              <cite className="t-label rcard__name">{r.name}</cite>
            </blockquote>
          ))}
          {shown.length === 0 && (
            <p className="t-body t-muted">
              No reviews from anyone that far in yet.
            </p>
          )}
        </div>
      </Band>
    </div>
  );
}

/* -------------------------------------------------------------- 9. ladder -- */

/** The pack arithmetic reconciled against the results timeline. */
function Ladder() {
  const glow = oldProducts[0];
  const trial = glow.packs[0];
  const rec = glow.packs[glow.packs.length - 1];
  const drop = Math.round(
    (1 - rec.price / rec.servings / (trial.price / trial.servings)) * 100
  );

  return (
    <Band tone="cream">
      <SectionHead
        eyebrow="The maths"
        title="Which pack actually covers the timeline"
        lede={`Dash of Glow is judged at day ${glow.judgeAtDay}. Only one of these three gets you there.`}
      />

      <Reveal selector=".lrow" stagger={0.07}>
        <div className="lrows">
          {glow.packs.map((k) => {
            const covers = k.days >= glow.judgeAtDay;
            return (
              <div key={k.sku} className={`lrow${covers ? " lrow--on" : ""}`}>
                <span className="t-heading-s lrow__size">
                  <Data>{k.servings}</Data> shots
                </span>
                <span className="t-data lrow__days">
                  {k.days} of {glow.judgeAtDay} days
                </span>
                <div className="lrow__bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.min(100, (k.days / glow.judgeAtDay) * 100)}%`,
                    }}
                  />
                </div>
                <span className="t-data lrow__unit">
                  {oldMoney(Math.round(oldPerServing(k)))}/shot
                </span>
              </div>
            );
          })}
        </div>
      </Reveal>

      <p className="t-body lrows__note">
        The 30 pack is <Data>{drop}%</Data> cheaper a shot than the 6 pack and it
        is the only one that reaches day <Data>{glow.judgeAtDay}</Data>. The
        upsell is the arithmetic, not a badge.
      </p>

      <div className="lbundles">
        {oldBundles.map((b) => (
          <article key={b.handle} className="lbundle">
            <p className="t-label t-muted">
              {b.note} <span className="tag-proposal t-label">Placeholder</span>
            </p>
            <h3 className="t-heading-s lbundle__name">{b.name}</h3>
            <p className="t-body-s">{b.detail}</p>
            <p className="t-data lbundle__price">
              {oldMoney(b.price)}{" "}
              <s className="t-muted">{oldMoney(b.compareAt)}</s>
            </p>
          </article>
        ))}
      </div>
    </Band>
  );
}

/* ---------------------------------------------------------------- 10. faq -- */

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Band tone="white" clip="none">
      <SectionHead eyebrow="Before you buy" title="The five questions people ask" />
      <div className="pfaq">
        {oldFaq.map((f, i) => (
          <div key={f.q} className={`pfaq__item${open === i ? " pfaq__item--on" : ""}`}>
            <button
              className="pfaq__q"
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="t-heading-s">{f.q}</span>
              <CaretIcon className="pfaq__icon" />
            </button>
            <div className="pfaq__a" hidden={open !== i}>
              <p className="t-body">{f.a}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="t-body-s t-muted pfaq__pay">
        {OLD_COMMERCE.paymentOrder.join(" · ")}
      </p>
    </Band>
  );
}
