/* ==========================================================================
   How it works: a deck of step cards that deals itself out.

   The cards start stacked and fanned, overlapping to the left and rotated a
   few degrees each, and straighten into an even row as the section scrolls
   through. The left card lands first, so the deal reads left to right in the
   direction the steps are read.

   Only transforms animate. The row is laid out at its final positions from
   the first frame and the fanned state is a transform away from it, so
   nothing reflows during the scroll and the layout is correct before any
   JavaScript runs. Animating the gaps or margins instead would relayout the
   row on every scroll tick and leave the cards piled up if the script failed.

   Under reduced motion the deck renders dealt. It is never left stacked,
   because stacked is the state where three of the four cards are unreadable.
   ========================================================================== */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "./primitives";
import { MarkTexture } from "./Mark";
import { bottleFor, img } from "../lib/media";
import { BRAND, products } from "../lib/catalog";
import "./howitworks.css";

gsap.registerPlugin(ScrollTrigger);

/* Degrees, per card. The fan opens clockwise so the leftmost card reads as
   the one on top of the pile. */
const FAN = [-7, -3.5, 2.5, 6];

/* How far each card slides back toward the stack, as a fraction of its own
   width. Card 0 does not move; each later card piles further left. */
const PILE = 0.42;

export function HowItWorks() {
  const wrap = useRef<HTMLDivElement>(null);
  const steps = BRAND.howItWorks.steps;

  useGSAP(
    () => {
      const root = wrap.current;
      if (!root) return;
      const cards = gsap.utils.toArray<HTMLElement>(".hiw__card", root);
      if (!cards.length) return;

      if (reduced()) {
        gsap.set(cards, { clearProps: "transform" });
        return;
      }

      gsap.fromTo(
        cards,
        {
          /* The pile offset is a percentage of each card's own width, so the
             deal works at every breakpoint without a second set of numbers. */
          xPercent: (i: number) => -i * PILE * 100,
          rotate: (i: number) => FAN[i % FAN.length],
          transformOrigin: "50% 120%",
        },
        {
          xPercent: 0,
          rotate: 0,
          ease: "none",
          stagger: 0.12,
          scrollTrigger: {
            trigger: root,
            /* Starts once the deck is properly on screen and finishes before
               it leaves, so the dealt state is what is actually looked at
               rather than a frame glimpsed on the way past. */
            start: "top 78%",
            end: "bottom 75%",
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        }
      );

      /* Cards overlap while piled, so the paint order has to match the fan or
         card 4 sits on top of the one being dealt. */
      cards.forEach((c, i) => {
        c.style.zIndex = String(cards.length - i);
      });
    },
    { scope: wrap }
  );

  return (
    <section className="hiw" ref={wrap} aria-labelledby="hiw-title">
      <div className="shell">
        <header className="hiw__head">
          <p className="t-label t-muted">{BRAND.howItWorks.eyebrow}</p>
          <h2 className="t-display-xl" id="hiw-title">
            {BRAND.howItWorks.title}
          </h2>
          <p className="t-body t-muted hiw__lede">{BRAND.howItWorks.lede}</p>
        </header>

        <ol className="hiw__deck">
          {steps.map((step, i) => {
            /* Each card borrows a product's bottle so the deck shows the range
               while it explains the ritual. The last card is ink and takes the
               first bottle back, which closes the loop. */
            const handle = products[i % products.length]?.handle;
            const bottle = handle ? bottleFor(handle) : null;
            return (
              <li
                key={step.verb}
                className={`hiw__card hiw__card--${step.tone} theme-${
                  step.tone === "ink" ? "glow" : step.tone
                }`}
              >
                <MarkTexture tile={110} angle={-14} opacity={0.07} />
                <div className="hiw__inner">
                  <p className="t-label hiw__step">Step {i + 1}</p>
                  <div className="hiw__figure">
                    {bottle && (
                      <img
                        className="hiw__bottle"
                        {...img(bottle)}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <h3 className="t-heading-m hiw__verb">{step.verb}</h3>
                  <p className="t-body hiw__line">{step.line}</p>
                  <p className="t-body-s hiw__detail">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
