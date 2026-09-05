/* ==========================================================================
   Dash Life.

   The about page. Every heading and paragraph is transcribed from
   drinkdash.in/pages/about-us; nothing on this page is written by us. The
   structure is ours: the live page runs one long column, and the content is
   really four movements (the problem, the principles, the process, the
   proof), so it is set as four bands that alternate ground.
   ========================================================================== */

import { Band, Reveal, SectionHead, SplitHeading, Button } from "../components/primitives";
import { Link } from "react-router-dom";
import { BRAND, products } from "../lib/catalog";
import { diaries } from "../lib/diaries";
import "./dashlife.css";
import { useTitle } from "../lib/useTitle";

/* Verbatim from the live About Us page. */
const LIFE = {
  eyebrow: "Dash Life",
  title: "Rethinking daily wellness one shot at a time",
  intro: [
    "DASH was created to solve a familiar challenge, the complexity of maintaining consistent nutrition within fast-paced, high-demand lifestyles. Even with access to supplements and functional foods, many formats are difficult to sustain, low in bioavailability, or simply do not fit naturally into daily routines.",
    "The result is often inconsistency, product fatigue, or wellness practices that never quite stick.",
    "So we asked a different question: what if wellness could be simpler? More intuitive? Easier to sustain every day? This question led to a formulation approach rooted in research, ingredient integrity, and thoughtful design.",
    "The outcome: targeted wellness shots that fit seamlessly into real life, no extra effort, no overthinking, just daily support you can feel good about committing to.",
  ],
  principles: [
    {
      title: "Science-Led, Ingredient-First",
      body: "Every formulation begins with research-backed ingredients selected for their role in supporting specific wellness needs. No unnecessary additives. No trends. Just thoughtful, purposeful formulation.",
    },
    {
      title: "Consistency Over Intensity",
      body: "Wellness is most effective when it is sustainable. DASH is designed to integrate seamlessly into your daily rhythm, simple to use, easy to maintain, and built for long-term commitment.",
    },
  ],
  expertsTitle: "Formulated by Experts, Backed by Science",
  experts: [
    "We worked closely with specialists in clinical nutrition, food technology, regulatory science, and formulation research to create blends that are thoughtful, stable, and high in ingredient integrity.",
    "Each shot is intentionally developed using research-led ingredient selection and careful formulation practices, supporting everyday wellness in a way that is consistent, informed, and easy to integrate into daily life.",
  ],
  cutTitle: "The Ingredients That Made the Cut",
  cutLede: "The process began with rigorous ingredient selection:",
  cut: [
    {
      title: "Research-Led Selection",
      body: "We choose botanicals, nutrients, and bioactives supported by credible scientific research and human studies.",
    },
    {
      title: "Purpose-Driven Formulation",
      body: "Each ingredient is included for a clear functional role within the blend, nothing incidental, nothing decorative.",
    },
    {
      title: "No Trend-Based Additions",
      body: "We avoid hype ingredients and under-researched compounds. Only what works well, works together, and works consistently.",
    },
  ],
  testedTitle: "Tested to the highest standards",
  testedLede:
    "Each formulation was engineered for rapid absorption, stability, and measurable efficacy, using delivery mechanisms optimized for both convenience and pharmacokinetics.",
  testedSub: "From ingredient sourcing to pilot batch testing, every stage underwent:",
  tested: [
    "GMP-certified production",
    "Organoleptic testing for taste, texture, and palatability",
    "Real-world compliance validation",
    "Multi-round stability assessments",
  ],
} as const;

export default function DashLife() {
  useTitle("Dash Life");
  return (
    <div className="theme-glow">
      <Band tone="base" clip="bottom" overlap>
        <header className="life-hero">
          <p className="t-label">{LIFE.eyebrow}</p>
          <SplitHeading text={LIFE.title} className="t-display-xl" as="h1" />
          <div className="life-hero__body">
            {LIFE.intro.map((p) => (
              <p className="t-body" key={p.slice(0, 32)}>
                {p}
              </p>
            ))}
          </div>
        </header>
      </Band>

      {/* Two principles, set as a pair rather than a list, because they are a
          pair: what goes in, and how often. */}
      <Band tone="cream">
        <Reveal selector=".life-prin" stagger={0.1}>
          <div className="life-prins">
            {LIFE.principles.map((p) => (
              <article className="life-prin" key={p.title}>
                <h2 className="t-heading-m">{p.title}</h2>
                <p className="t-body t-muted">{p.body}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </Band>

      <Band tone="soft">
        <SectionHead eyebrow="How it is made" title={LIFE.expertsTitle} />
        <div className="life-experts">
          {LIFE.experts.map((p) => (
            <p className="t-body" key={p.slice(0, 32)}>
              {p}
            </p>
          ))}
        </div>

        <Reveal selector=".life-cut" stagger={0.08}>
          <div className="life-cuts">
            <div className="life-cuts__lede">
              <h3 className="t-heading-m">{LIFE.cutTitle}</h3>
              <p className="t-body t-muted">{LIFE.cutLede}</p>
            </div>
            {LIFE.cut.map((c, i) => (
              <article className="life-cut" key={c.title}>
                <p className="t-data life-cut__n">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="t-heading-s">{c.title}</h3>
                <p className="t-body-s t-muted">{c.body}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </Band>

      <Band tone="ink">
        <div className="life-tested">
          <div>
            <h2 className="t-display-xl">{LIFE.testedTitle}</h2>
            <p className="t-body life-tested__lede">{LIFE.testedLede}</p>
          </div>
          <div>
            <p className="t-label life-tested__sub">{LIFE.testedSub}</p>
            <ul className="life-tested__list">
              {LIFE.tested.map((t) => (
                <li className="t-body" key={t}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      {/* The badges already exist in the catalogue and are the same claims in
          shorter form, so they close the page rather than repeating mid-page. */}
      <Band tone="cream">
        <ul className="life-badges">
          {BRAND.badges.map((b) => (
            <li className="chip chip--outline" key={b}>
              {b}
            </li>
          ))}
        </ul>

        <div className="life-next">
          <div>
            <h2 className="t-heading-m">{BRAND.lineUp.title}</h2>
            <p className="t-body t-muted">
              Three shots, one concern each. {products.length} formulations, no
              overlap.
            </p>
          </div>
          <Button as="link" to="/shop" variant="primary">
            Shop all shots
          </Button>
        </div>

        <div className="life-read">
          <p className="t-label t-muted">Keep reading</p>
          <ul>
            {diaries.map((d) => (
              <li key={d.slug}>
                <Link className="t-body" to={`/dash-diaries/${d.slug}`}>
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Band>
    </div>
  );
}
