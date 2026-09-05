/* ==========================================================================
   The Dash Diaries.

   Index and article, in one file because they share their furniture and
   neither is large. Articles come from lib/diaries.ts, transcribed from the
   live posts.

   The index leads with the newest article at full width rather than setting
   three equal cards: with three posts a grid of three reads as a placeholder
   for a grid of twelve. The layout switches to an even grid past four, the
   same rule the shop page already uses for products.
   ========================================================================== */

import { Link } from "react-router-dom";
import { Band, Reveal, SplitHeading, Button } from "../components/primitives";
import { diaries } from "../lib/diaries";
import { byHandle } from "../lib/catalog";
import { img } from "../lib/media";
import "./diaries.css";
import { useTitle } from "../lib/useTitle";

/* Past this count the lead-plus-rest layout stops earning its asymmetry. */
const LEAD_LAYOUT_MAX = 4;

export default function Diaries() {
  useTitle("The Dash Diaries");
  const sorted = [...diaries].sort((a, b) => b.iso.localeCompare(a.iso));
  const useLead = sorted.length <= LEAD_LAYOUT_MAX;
  const [lead, ...rest] = sorted;

  /* The catalogue could in principle carry no articles, and an index page that
     renders an empty grid looks broken rather than empty. */
  if (!sorted.length) {
    return (
      <div className="theme-glow">
        <Band tone="cream">
          <div className="dia-empty">
            <h1 className="t-display-xl">The Dash Diaries</h1>
            <p className="t-body t-muted">
              No articles yet. The formulations come first.
            </p>
            <Button as="link" to="/shop" variant="primary">
              Shop all shots
            </Button>
          </div>
        </Band>
      </div>
    );
  }

  return (
    <div className="theme-glow">
      <Band tone="base" clip="bottom" overlap>
        <header className="dia-hero">
          <p className="t-label">Journal</p>
          <SplitHeading text="The Dash Diaries" className="t-display-xl" as="h1" />
          <p className="t-body dia-hero__lede">
            The research behind each shot, written out in full. One article per
            formulation, with the citations the claims rest on.
          </p>
        </header>
      </Band>

      <Band tone="cream">
        {useLead && (
          <Reveal>
            <article className={`dia-lead theme-${lead.theme}`}>
              <Link to={`/dash-diaries/${lead.slug}`} className="dia-lead__media">
                <img className="dia-art" {...img(lead.art)} loading="eager" />
              </Link>
              <div className="dia-lead__body">
                <p className="t-label t-muted">
                  Latest ·{" "}
                  <time dateTime={lead.iso}>{lead.date}</time> ·{" "}
                  {lead.readingMinutes} min read
                </p>
                <h2 className="t-heading-m">
                  <Link to={`/dash-diaries/${lead.slug}`}>{lead.title}</Link>
                </h2>
                <p className="t-body t-muted">{lead.dek}</p>
                <Button as="link" to={`/dash-diaries/${lead.slug}`} variant="ghost">
                  Read the article
                </Button>
              </div>
            </article>
          </Reveal>
        )}

        <Reveal selector=".dia-card" stagger={0.08}>
          <div className={`dia-grid${useLead ? " dia-grid--rest" : ""}`}>
            {(useLead ? rest : sorted).map((d) => (
              <article className={`dia-card theme-${d.theme}`} key={d.slug}>
                <Link to={`/dash-diaries/${d.slug}`} className="dia-card__media">
                  <img className="dia-art" {...img(d.art)} loading="lazy" />
                </Link>
                <p className="t-label t-muted">
                  <time dateTime={d.iso}>{d.date}</time> · {d.readingMinutes} min
                  read
                </p>
                <h2 className="t-heading-s">
                  <Link to={`/dash-diaries/${d.slug}`}>{d.title}</Link>
                </h2>
                <p className="t-body-s t-muted">{d.dek}</p>
                <ShotLink handle={d.productHandle} />
              </article>
            ))}
          </div>
        </Reveal>
      </Band>
    </div>
  );
}

/** Each article is about one shot. The link is the whole point of the journal
    existing on a shop, so it is on every card rather than only in the body. */
export function ShotLink({ handle }: { handle: string }) {
  const product = byHandle(handle);
  if (!product) return null;
  return (
    <Link to={`/products/${product.handle}`} className="t-data dia-shot">
      About {product.name}
    </Link>
  );
}
