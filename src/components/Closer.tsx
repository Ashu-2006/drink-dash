/* ==========================================================================
   The closer. The home page's conversion point.

   It sits after the ladder and before the diaries, which is the exact seam
   between "convinced" and "browsing". The ladder has just argued that a 30
   day ritual needs 30 shots; this band lets you act on that argument without
   leaving the page. Everything after it is reading.

   The device: one band, three bottles on a shelf, and the whole band changes
   colour to the shot you pick. The theme class moves with the selection and
   the band's background-color transitions, so picking Burn turns a coral
   field amber in front of you. A coloured card would have said the same
   thing quietly; this says it with the largest surface on the page.

   The offer is the Recommended Pack, because that is the pack the ladder
   above just recommended. Offering the cheap pack here would undo the
   argument the page made a screen earlier.

   Assets, and why these: the three transparent bottle cut-outs (the same
   ones the line-up uses, so the bottle you picked at the top is the bottle
   you pick here), the brand's own hero lines as the headline, the brand's
   own ritual sentence as the lede. Not the WebGL bottle in three/Bottle:
   a live GL context at the foot of the page costs a context, a shader
   compile and a chunk of the main thread for a bottle the WebP already
   shows more faithfully. Named here so it is a decision, not an omission.

   Motion, in priority order: the bottles rise in on scroll (Reveal), the
   picked bottle springs upright on --ease-bounce while the others settle
   back tilted, the band recolours on --ease-smooth, and the bottles carry a
   slow out of phase float so the shelf never reads as a still. No success
   animation on the button: the cart drawer opens on add and is the
   confirmation, and confirming twice is noise.

   States built: default selection, each of three selections, hover on an
   unselected bottle, keyboard focus, a product with no cut-out (falls back
   to the packshot), a product with nothing in stock (button disabled and
   says so), a pack with no compare-at (no strike, no saving), reduced motion
   (no float, no spring, no rise; the recolour stays because it is not
   movement), and narrow screens (shelf first, copy under it).
   ========================================================================== */

import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Band, Button, Data, Reveal, Shot } from "./primitives";
import { NextIcon } from "./icons";
import { bottleFor, img } from "../lib/media";
import { defaultPack } from "../lib/cart";
import type { AddFn } from "../lib/cart";
import {
  BRAND,
  COMMERCE,
  concernOf,
  money,
  perServing,
  products,
  RITUAL_NOTE,
  savingPercent,
  tierFor,
} from "../lib/catalog";
import "./closer.css";

/** Degrees. Unselected bottles lean, alternating, so the shelf reads as a
    row of objects rather than a row of icons. The picked one stands up. */
const LEAN = [-4, 3.2, -3.6, 4.4];

export function Closer({ onAdd }: { onAdd: AddFn }) {
  const [handle, setHandle] = useState(products[0].handle);
  const picked = products.find((p) => p.handle === handle) ?? products[0];
  const pack = defaultPack(picked.handle);
  const tier = pack ? tierFor(pack.servings) : null;
  const save = pack ? savingPercent(pack) : null;

  return (
    /* The theme class lives on this wrapper, so the band and everything in it
       recolours together when the selection changes. */
    <div className={`closer-wrap theme-${picked.theme}`}>
      <Band tone="base" clip="bottom" wide id="closer">
        <div className="shell closer">
          <Reveal selector=".closer__copy > *" stagger={0.07}>
            <div className="closer__copy">
              <p className="t-label">Start the ritual</p>
              <h2 className="t-display-xl closer__title" id="closer-title">
                <span className="closer__line">{BRAND.hero.lines[0]}</span>
                <span className="closer__line">{BRAND.hero.lines[1]}</span>
              </h2>
              <p className="t-body closer__lede">{RITUAL_NOTE.text}</p>

              {/* Polite, so a screen reader hears the new pack and price when
                  the bottle changes, without cutting off whatever it was
                  reading. */}
              <div className="closer__offer" aria-live="polite">
                <p className="t-label t-muted closer__pack">
                  {picked.name}
                  {pack && tier ? ` · ${tier.name} · ${pack.servings} servings` : ""}
                </p>

                {pack ? (
                  <>
                    <p className="closer__price">
                      <span className="t-heading-m">{money(pack.price)}</span>
                      {pack.compareAt && pack.compareAt > pack.price && (
                        <s className="t-data closer__was">{money(pack.compareAt)}</s>
                      )}
                      {save !== null && (
                        <span className="t-data closer__save">Save {save}%</span>
                      )}
                    </p>
                    <p className="t-data t-muted closer__unit">
                      {money(Math.round(perServing(pack)))}/shot · covers the{" "}
                      <Data>{RITUAL_NOTE.days}</Data> day ritual
                    </p>
                  </>
                ) : (
                  <p className="t-body-s t-muted">
                    Nothing in stock for this shot right now.
                  </p>
                )}

                <div className="closer__actions">
                  <Button
                    variant="primary"
                    disabled={!pack}
                    onClick={() => pack && onAdd({ kind: "pack", sku: pack.sku })}
                  >
                    {pack ? `Add ${picked.shortName} to cart` : "Out of stock"}
                  </Button>
                  <Link
                    to={`/products/${picked.handle}`}
                    className="t-body-s closer__more link-arrow"
                  >
                    All packs and the formula <NextIcon size="1em" />
                  </Link>
                </div>

                <p className="t-body-s t-muted closer__fine">
                  {COMMERCE.shipping.text} · {COMMERCE.taxNote.text} ·{" "}
                  {COMMERCE.dispatch.text}
                </p>
              </div>
            </div>
          </Reveal>

          {/* aria-pressed buttons rather than radios: the same idiom the buy
              box uses for one time versus monthly, and it needs no roving
              tabindex to be keyboard complete. */}
          <div className="closer__shelf" role="group" aria-label="Pick your shot">
            <Reveal selector=".shelf__shot" stagger={0.09} y={40}>
              <div className="shelf">
                {products.map((p, i) => {
                  const on = p.handle === picked.handle;
                  const bottle = bottleFor(p.handle);
                  return (
                    <button
                      key={p.handle}
                      type="button"
                      className={`shelf__shot theme-${p.theme}${on ? " shelf__shot--on" : ""}`}
                      aria-pressed={on}
                      onClick={() => setHandle(p.handle)}
                      style={
                        {
                          "--lean": `${LEAN[i % LEAN.length]}deg`,
                          "--i": i,
                        } as CSSProperties
                      }
                    >
                      {/* Reveal writes an inline transform on .shelf__shot
                          when it rises in, so the pose lives one level
                          down where nothing else touches transform. */}
                      <span className="shelf__pose">
                        {bottle ? (
                          <img
                            className="shelf__bottle"
                            {...img(bottle)}
                            alt={`${p.name}, ${p.descriptor}`}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Shot basename={p.images[0]} alt={`${p.name}, ${p.descriptor}`} ratio="1 / 1" />
                        )}
                      </span>
                      <span className="t-label shelf__concern">{concernOf(p)?.label}</span>
                      <span className="t-body-s shelf__flavour">{p.flavour}</span>
                    </button>
                  );
                })}
              </div>
            </Reveal>
            <div className="shelf__edge" aria-hidden="true" />
          </div>
        </div>
      </Band>
    </div>
  );
}
