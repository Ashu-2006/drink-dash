/* ==========================================================================
   The step deck.

   Four cards, fanned. The cards overlap, tilt in alternating directions and
   dip through a shallow arc, so the row reads as a hand of cards laid out on
   a table rather than as four boxes in a grid. Later cards paint over earlier
   ones, left to right.

   The one thing the reference layout does that this does not: it lets each
   card's copy run underneath the card in front of it, so three of the four
   are cut off mid sentence. Here the overlap is a known width, so the cards
   that have something on top of them are padded clear of it by exactly that
   much and every line stays readable at rest. That is what the container
   query unit is for: 6.667cqi is the overlap, measured against the deck, so
   the padding and the negative margin can never disagree.

   The arithmetic, so the row always comes to exactly 100% and never scrolls:
   four cards at 30cqi, three overlaps at 6.667cqi, 120 - 20 = 100. The
   component solves that from the step count rather than trusting the four,
   so a fifth step narrows the cards instead of falling off the end.

   Two consumers, one deck: the home page runs the brand's own ritual steps
   and the product page runs that product's mechanism. StepDeck owns the fan
   and the interaction; each page owns its own heading and its own steps.

   Nothing here is a control. The cards are not links and do not disclose
   anything, so they get no tab stop and no button dressed up as a card. The
   fan only exists above 75em, where a card is wide enough to hold a
   paragraph next to a 22% overlap. Below that it is a plain two up, then a
   single column, with no tilt, no overlap and no comb.
   ========================================================================== */

import { useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import { Reveal } from "./primitives";
import { MarkTexture } from "./Mark";
import { img, type MediaKey } from "../lib/media";
import { BRAND } from "../lib/catalog";
import "./howitworks.css";

/* One picture per step, chosen for what the step's own line says. The bottles
   that used to sit here were the same three cut-outs the line-up above already
   shows, saying nothing about grabbing, shaking, drinking or keeping.

     Grab it   straight from the fridge
     Shake it  the actives settle, so the tray they settle on
     Dash it   one a day, at whatever hour, with whoever is around
     Keep it   thirty days of the same small thing, at the desk

   Fewer pictures than steps is survivable: the frame drops and the card still
   reads. */
const STEP_ART: MediaKey[] = ["life-fridge", "life-bench", "people-sofa", "life-desk"];

/** Degrees of tilt, alternating. Past about three the text starts to read as
    crooked rather than as placed. */
const TILT = 2.4;

/** Pixels the middle of the row sits below its ends. */
const ARC = 56;

/** How much of a card the next one covers. */
const OVERLAP = 0.2222;

/* --------------------------------------------------------------------------
   The comb.

   Taken from the transitions.dev avatar group hover: a distance falloff lift
   across a horizontal stack, with the timing function written inline before
   the custom properties, so hovering in and leaving get two different curves
   out of a single transition declaration. Adapted in two ways.

   First, this stack overlaps, so the falloff drives a horizontal spread as
   well as a lift. Pointing at a card pushes the cards to its left further
   left and the cards to its right further right, hardest on the immediate
   neighbours, so the deck opens around the card being read.

   Second, the curves are read off this repo's own tokens rather than the
   skill's --avatar-* names. There is one token file and it is not this
   component. The geometry stays here in TypeScript next to TILT and ARC,
   which is where this component already keeps its geometry.
   -------------------------------------------------------------------------- */

/** Pixels the pointed at card rises. Negative is up. */
const LIFT = -14;

/** Pixels the immediate neighbours are pushed away. Further cards get this
    times the falloff, per step of distance. */
const SPREAD = 26;

/** Each further card gets this fraction of the last one's shift. At 0.45 the
    second neighbour moves under half as far and the third barely at all,
    which is what makes the row read as sprung rather than as sliding. */
const FALLOFF = 0.45;

/** The pointed at card only. Held low: a card is 32rem tall, so even 1.03
    moves its bottom edge most of a line of text. */
const SCALE = 1.025;

/* The row has to come to exactly the width of the deck whatever the step
   count is, or the last card falls off the end and gets clipped by the
   section. n cards less n-1 overlaps, solved for the card width and handed to
   CSS as container query units. At four steps this is the 30 and 6.667 the
   stylesheet falls back to. */
function deckStyle(n: number): CSSProperties {
  const w = 100 / (n - (n - 1) * OVERLAP);
  return {
    "--hiw-w": `${w.toFixed(4)}cqi`,
    "--hiw-lap": `${(w * OVERLAP).toFixed(4)}cqi`,
  } as CSSProperties;
}

/* The fan, derived rather than tabulated, so a fifth step lands in the arc
   instead of falling out of a list of four hand written offsets. */
function fanStyle(i: number, n: number): CSSProperties {
  /* -1 at the left end, 0 in the middle, 1 at the right end. */
  const t = n < 2 ? 0 : (i / (n - 1)) * 2 - 1;
  return {
    "--hiw-rot": `${(i % 2 ? 1 : -1) * TILT}deg`,
    "--hiw-drop": `${Math.round((1 - t * t) * ARC)}px`,
    "--hiw-z": i + 1,
  } as CSSProperties;
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The comb only exists where the fan does and where there is a pointer to
    comb with. On a phone the cards are a stacked grid and there is nothing to
    spread; on a touch screen mouseenter fires once on tap and then never
    leaves, which would strand the deck open. */
const combable = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(min-width: 75em)").matches &&
  !!window.matchMedia?.("(hover: hover)").matches;

export type DeckStep = {
  /** Stable key. A title is not always unique across products. */
  id: string;
  /** The card's heading, set in the display face. Keep it free of
      punctuation: Champ has no glyphs for it in the supplied cut. */
  title: string;
  /** The lead line, set at body weight 600. Optional. */
  line?: string;
  /** The paragraph under it. Optional. */
  detail?: string;
  tone: "glow" | "burn" | "volume" | "ink";
  art?: MediaKey | null;
};

export function StepDeck({ steps, label }: { steps: DeckStep[]; label?: string }) {
  const deck = useRef<HTMLOListElement>(null);

  /* One handler for the whole deck rather than one per card. The cards are
     not controls and never move in the DOM, so index maths off the child list
     is both correct and cheaper than a closure per card per render. */
  const comb = useCallback((active: number | null, phase: "in" | "out") => {
    const el = deck.current;
    if (!el) return;

    /* Read the curve off the cascade so the deck cannot drift from
       tokens.css. --ease-smooth going out, --ease-bounce coming back:
       the return is the spring, which is the half the eye reads as
       physical. */
    const cs = getComputedStyle(el);
    const timing =
      cs.getPropertyValue(phase === "out" ? "--ease-bounce" : "--ease-smooth").trim() ||
      "ease";

    (Array.from(el.children) as HTMLElement[]).forEach((card, i) => {
      /* Set before the variables, never after. The browser uses whatever
         timing function is current at the moment a transitionable property
         changes, so this is what gets two different curves out of one
         transition declaration. */
      card.style.transitionTimingFunction = timing;

      if (active === null) {
        card.style.setProperty("--hiw-x", "0px");
        card.style.setProperty("--hiw-y", "0px");
        card.style.setProperty("--hiw-scale", "1");
        card.style.setProperty("--hiw-zt", "0");
        card.style.removeProperty("--hiw-rot-now");
        return;
      }

      const d = i - active;
      const away = Math.abs(d);

      /* The immediate neighbour moves SPREAD, the next one FALLOFF of that,
         and so on. The lift falls off from the pointed at card itself, so
         that one gets the whole of LIFT. */
      const x = d === 0 ? 0 : Math.sign(d) * SPREAD * Math.pow(FALLOFF, away - 1);
      const y = LIFT * Math.pow(FALLOFF, away);

      card.style.setProperty("--hiw-x", `${x.toFixed(2)}px`);
      card.style.setProperty("--hiw-y", `${y.toFixed(2)}px`);
      card.style.setProperty("--hiw-scale", d === 0 ? String(SCALE) : "1");
      card.style.setProperty("--hiw-zt", d === 0 ? "20" : "0");

      /* Only the pointed at card straightens. The rest keep their tilt, so
         the one being read is visibly the one being read. */
      if (d === 0) card.style.setProperty("--hiw-rot-now", "0deg");
      else card.style.removeProperty("--hiw-rot-now");
    });
  }, []);

  const onEnter = (i: number) => () => {
    if (reduced() || !combable()) return;
    comb(i, "in");
  };

  const onLeave = () => {
    if (reduced() || !combable()) return;
    comb(null, "out");
  };

  return (
    /* Reveal without a selector, so it animates this wrapper and leaves
       the cards' own transforms alone. Pointed at the cards it would
       write an inline transform over each one and flatten the fan. */
    <Reveal>
      <ol
        ref={deck}
        className="hiw__deck"
        style={deckStyle(steps.length)}
        aria-label={label}
        onMouseLeave={onLeave}
      >
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={`hiw__card hiw__card--${step.tone} theme-${
              step.tone === "ink" ? "glow" : step.tone
            }`}
            style={fanStyle(i, steps.length)}
            onMouseEnter={onEnter(i)}
          >
            <MarkTexture tile={110} angle={-14} opacity={0.07} />
            <div className="hiw__inner">
              <p className="t-label hiw__step">Step {i + 1}</p>

              {step.art && (
                <div className="hiw__figure">
                  <img
                    className="hiw__photo"
                    {...img(step.art)}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              <h3 className="hiw__verb">{step.title}</h3>
              {step.line && <p className="t-body hiw__line">{step.line}</p>}
              {step.detail && <p className="t-body-s hiw__detail">{step.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

/** The home page deck: the brand's own ritual, in its own section. */
export function HowItWorks() {
  const steps: DeckStep[] = BRAND.howItWorks.steps.map((s, i) => ({
    id: s.verb,
    title: s.verb,
    line: s.line,
    detail: s.detail,
    tone: s.tone,
    art: STEP_ART[i] ?? null,
  }));

  return (
    <section className="hiw" aria-labelledby="hiw-title">
      <div className="shell">
        <header className="hiw__head">
          <p className="t-label t-muted">{BRAND.howItWorks.eyebrow}</p>
          <h2 className="t-display-xl" id="hiw-title">
            {BRAND.howItWorks.title}
          </h2>
          <p className="t-body t-muted hiw__lede">{BRAND.howItWorks.lede}</p>
        </header>

        <StepDeck steps={steps} label={BRAND.howItWorks.title} />
      </div>
    </section>
  );
}
