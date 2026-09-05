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
import { DiaryList } from "../components/DiaryCard";
import { diaries } from "../lib/diaries";
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

        <Reveal selector=".dcard" stagger={0.08}>
          <DiaryList items={useLead ? rest : sorted} />
        </Reveal>
      </Band>
    </div>
  );
}
