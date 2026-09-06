/* ==========================================================================
   Playground: the shop's buy section, five ways.

   Not a page of the site. It is a workbench with one section on it and a rack
   of dials above it, so a decision about that section can be made by flipping
   between takes rather than by reading a description of them. Unlinked from
   the nav on purpose; it is reached by typing /playground.

   The dials are deliberate rather than decorative. Each one isolates a
   variable that changes the answer:

     Variant    the five takes. The whole point.
     Product    the same column on all three themes, including the one that
                inverts, because a layout that only works on coral is not a
                layout.
     Density    comfortable and compact. Vertical rhythm is the first thing
                that breaks when a column gets long, and four of the five get
                long.
     Motion     full or reduced. The reduced setting is the real OS setting's
                behaviour, forced on, so the shut states can be checked
                without changing a system preference.
     Tier 2     shut or open on arrival, so the disclosed state can be
                inspected without hunting for the trigger after every switch.

   The readout under the dials names the mechanism the active variant uses and
   what it costs, because the point of the comparison is the reasoning, not
   the picture.
   ========================================================================== */

import { useState } from "react";
import { Band, SectionHead } from "../components/primitives";
import { BuyMedia, VARIANTS } from "../playground/buy-variants";
import { products } from "../lib/catalog";
import type { AddFn } from "../lib/cart";
import { useTitle } from "../lib/useTitle";
import "./playground.css";

type Density = "comfortable" | "compact";
type Motion = "full" | "reduced";

export default function Playground({ onAdd }: { onAdd: AddFn }) {
  useTitle("Playground");

  const [variantId, setVariantId] = useState(VARIANTS[0].id);
  const [handle, setHandle] = useState(products[0].handle);
  const [density, setDensity] = useState<Density>("comfortable");
  const [motion, setMotion] = useState<Motion>("full");
  const [tier2Open, setTier2Open] = useState(false);

  const variant = VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0];
  const product = products.find((p) => p.handle === handle) ?? products[0];

  /* Pack state lives here rather than in the variants, so switching variant
     keeps the selection. Otherwise every flip resets the thing being compared
     and the comparison is between two different carts. */
  const [sku, setSku] = useState(product.packs[1]?.sku ?? product.packs[0].sku);
  const pack =
    product.packs.find((p) => p.sku === sku) ?? product.packs[1] ?? product.packs[0];

  const pickProduct = (h: string) => {
    const next = products.find((p) => p.handle === h);
    if (!next) return;
    setHandle(h);
    /* The old sku belongs to the old product. Carrying it over would leave
       the column showing a pack that is not on sale. */
    setSku(next.packs[1]?.sku ?? next.packs[0].sku);
  };

  return (
    <div className="pg">
      <Band tone="cream" clip="none">
        <SectionHead
          eyebrow="Workbench"
          title="Buy section, five ways"
          lede="One section, five disclosure mechanisms, the same data. The media side is fixed; only the column that asks for the money changes."
        />
      </Band>

      {/* Controls above the stage rather than floating over it: two of the
          variants own the bottom of the screen, and a panel parked there
          would be arguing with the thing it is meant to be testing. */}
      <div className="pg__dials">
        <div className="shell pg__dials-in">
          <Dial label="Variant">
            {VARIANTS.map((v) => (
              <Key
                key={v.id}
                on={v.id === variant.id}
                onClick={() => setVariantId(v.id)}
              >
                {v.name}
              </Key>
            ))}
          </Dial>

          <Dial label="Product">
            {products.map((p) => (
              <Key
                key={p.handle}
                on={p.handle === product.handle}
                onClick={() => pickProduct(p.handle)}
              >
                {p.shortName}
              </Key>
            ))}
          </Dial>

          <Dial label="Density">
            <Key on={density === "comfortable"} onClick={() => setDensity("comfortable")}>
              Comfortable
            </Key>
            <Key on={density === "compact"} onClick={() => setDensity("compact")}>
              Compact
            </Key>
          </Dial>

          <Dial label="Motion">
            <Key on={motion === "full"} onClick={() => setMotion("full")}>
              Full
            </Key>
            <Key on={motion === "reduced"} onClick={() => setMotion("reduced")}>
              Reduced
            </Key>
          </Dial>

          <Dial label="Tier 2">
            <Key on={!tier2Open} onClick={() => setTier2Open(false)}>
              Shut
            </Key>
            <Key on={tier2Open} onClick={() => setTier2Open(true)}>
              Open
            </Key>
          </Dial>
        </div>

        <div className="shell pg__readout">
          <p className="t-label t-muted">
            {variant.name} · {variant.mechanism}
          </p>
          <p className="t-body-s pg__readout-note">{variant.note}</p>
          <p className="t-body-s t-muted">Tier 2: {variant.tier2}</p>
        </div>
      </div>

      {/* The stage. Same band treatment the shop uses, so what is being judged
          is the column and not a different ground behind it. */}
      <div
        className={`theme-${product.theme} pg__stage pg__stage--${density}${
          motion === "reduced" ? " pg__stage--still" : ""
        }`}
      >
        <Band tone="base" clip="bottom" overlap>
          <div className="pgb" key={`${variant.id}-${product.handle}`}>
            <BuyMedia product={product} />
            {variant.render({
              product,
              sku,
              setSku,
              pack,
              onAdd: (s) => onAdd({ kind: "pack", sku: s }),
              openByDefault: tier2Open,
            })}
          </div>
        </Band>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Dial({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pg__dial" role="group" aria-label={label}>
      <span className="t-label t-muted pg__dial-label">{label}</span>
      <div className="pg__keys">{children}</div>
    </div>
  );
}

function Key({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`pg__key t-body-s${on ? " is-on" : ""}`}
      aria-pressed={on}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
