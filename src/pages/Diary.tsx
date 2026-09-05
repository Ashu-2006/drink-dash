/* ==========================================================================
   A single Diaries article.

   Measure is capped at 34rem, which lands around 70 characters at the body
   size. The references in these posts are superscript markers with no target
   on the live site, so they are rendered as text rather than as links that go
   nowhere.
   ========================================================================== */

import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Band, Button, Reveal } from "../components/primitives";
import { diaryBySlug, otherDiaries } from "../lib/diaries";
import { byHandle, fromPrice, money } from "../lib/catalog";
import { defaultPack, useCart } from "../lib/cart";
import { img, packFor } from "../lib/media";
import "./diaries.css";
import { useTitle } from "../lib/useTitle";

export default function Diary() {
  const { slug = "" } = useParams();
  const article = diaryBySlug(slug);
  const cart = useCart();
  useTitle(article ? article.title : "Article not found");

  /* A router push keeps the old scroll position, which drops the reader into
     the middle of an article they have not started. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  /* An article URL that does not resolve is a real state: a stale link, a
     typo, a post that was renamed. It gets an answer, not the home page. */
  if (!article) {
    return (
      <div className="theme-glow">
        <Band tone="cream">
          <div className="dia-empty">
            <p className="t-label t-muted">Not found</p>
            <h1 className="t-heading-l">That article does not exist</h1>
            <p className="t-body t-muted">
              It may have been renamed. Everything published is listed in the
              Diaries.
            </p>
            <Button as="link" to="/dash-diaries" variant="primary">
              All articles
            </Button>
          </div>
        </Band>
      </div>
    );
  }

  const product = byHandle(article.productHandle);
  const pack = product ? defaultPack(product.handle) : null;
  const others = otherDiaries(article.slug);

  return (
    <div className={`theme-${article.theme}`}>
      <Band tone="soft" clip="bottom" overlap>
        <div className="art-top">
        <header className="art-hero">
          <p className="t-label t-muted">
            <Link to="/dash-diaries">The Dash Diaries</Link> ·{" "}
            <time dateTime={article.iso}>{article.date}</time> ·{" "}
            {article.readingMinutes} min read
          </p>
          <h1 className="t-heading-l art-hero__title">{article.title}</h1>
          <p className="t-body art-hero__dek">{article.dek}</p>
        </header>
        {/* The subject of the article, cut out and floated on the band. A
            packshot here would be selling before the argument is made. */}
        <img className="art-hero__art" {...img(article.art)} loading="eager" />
        </div>
      </Band>

      <Band tone="cream">
        <div className="art-wrap">
          <article className="art-body">
            {article.sections.map((section, i) => (
              <section key={section.heading ?? `s${i}`}>
                {section.heading && (
                  <h2 className="t-heading-s art-h2">{section.heading}</h2>
                )}
                {section.blocks.map((block, j) =>
                  block.kind === "text" ? (
                    <p className="t-body" key={j}>
                      {block.body}
                    </p>
                  ) : (
                    <ul className="art-list" key={j}>
                      {block.items.map((item) => (
                        <li className="t-body" key={item}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </section>
            ))}

            <p className="t-body-s t-muted art-note">
              Superscript markers are the article&rsquo;s own citations to
              published research. The live post lists them without linked
              targets, so they are reproduced here as printed rather than
              invented.
            </p>
          </article>

          {/* The shot the article is about, offered where the reader has just
              finished reading why it works. Sticky on desktop only: pinning a
              buy card on a phone would cover the text it is arguing for. */}
          {product && (
            <aside className="art-buy">
              <img
                className="art-buy__img"
                {...(packFor(product.handle)
                  ? img(packFor(product.handle)!)
                  : { src: `/media/${product.images[0]}.jpg`, alt: "" })}
                loading="lazy"
                decoding="async"
              />
              <p className="t-label t-muted">The shot in this article</p>
              <h2 className="t-heading-s">{product.name}</h2>
              <p className="t-body-s t-muted">{product.descriptor}</p>
              <p className="t-data">from {money(fromPrice(product))}</p>
              <Button
                variant="primary"
                full
                disabled={!pack}
                onClick={() => {
                  if (pack) cart.add({ kind: "pack", sku: pack.sku });
                }}
              >
                {pack ? "Add to cart" : "Out of stock"}
              </Button>
              <Link to={`/products/${product.handle}`} className="t-body-s art-buy__more">
                Read the full formula
              </Link>
            </aside>
          )}
        </div>
      </Band>

      {others.length > 0 && (
        <Band tone="cream">
          <p className="t-label t-muted">Read more</p>
          <Reveal selector=".dia-card" stagger={0.08}>
            <div className="dia-grid">
              {others.map((d) => (
                <article className={`dia-card theme-${d.theme}`} key={d.slug}>
                  <Link to={`/dash-diaries/${d.slug}`} className="dia-card__media">
                    <img className="dia-art" {...img(d.art)} loading="lazy" />
                  </Link>
                  <p className="t-label t-muted">
                    <time dateTime={d.iso}>{d.date}</time>
                  </p>
                  <h2 className="t-heading-s">
                    <Link to={`/dash-diaries/${d.slug}`}>{d.title}</Link>
                  </h2>
                  <p className="t-body-s t-muted">{d.dek}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </Band>
      )}
    </div>
  );
}
