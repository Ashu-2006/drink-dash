/* ==========================================================================
   Site chrome: header, footer, sticky buy bar, intro reveal.
   Navigation and footer links are the real ones from drinkdash.in.
   ========================================================================== */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./primitives";
import { Logo } from "./Logo";
import { InkFloodCurtain } from "../motion/inkflood/InkFloodCard";
import { BRAND, COMMERCE, money, products, tierFor } from "../lib/catalog";
import { useCart } from "../lib/cart";
import { useSearch } from "../lib/search";
import type { Pack, Product } from "../lib/catalog";
import "./chrome.css";

/* -------------------------------------------------------------------------- */

export function Header() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const { pathname } = useLocation();
  const cart = useCart();
  const search = useSearch();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 140 && y > lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Three facts, all traced to the site. No timer, no false urgency. */}
      <div className="notice t-label">
        <span>{COMMERCE.shipping.text}</span>
        <span>{COMMERCE.dispatch.text}</span>
        <span>{COMMERCE.cod.text}</span>
      </div>

      <header className={`hdr${hidden || open ? " hdr--up" : ""}`}>
        <div className="shell hdr__inner">
          <Link to="/" className="hdr__mark" aria-label="DASH Wellness Shots, home">
            <Logo />
          </Link>

          <nav className="hdr__nav" aria-label="Main">
            {BRAND.nav.map((n) => (
              <Link key={n.label} to={n.to} className="hdr__link t-body-s">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hdr__end">
            <button
              className="chip chip--outline hdr__menu"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              Menu
            </button>
            <button
              className="chip chip--outline"
              onClick={() => search.setOpen(true)}
              aria-label="Search"
            >
              Search
            </button>
            {/* The count is inside the label, not only next to it, so a screen
                reader is told how many rather than just that a cart exists. */}
            <button
              className="chip"
              onClick={() => cart.setOpen(true)}
              aria-label={`Cart, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
              aria-haspopup="dialog"
            >
              Cart <span className="t-data">{cart.count}</span>
            </button>
          </div>
        </div>
      </header>

      <div className={`menu${open ? " menu--on" : ""}`} aria-hidden={!open}>
        <div className="shell menu__inner">
          <nav aria-label="Menu">
            {BRAND.nav.map((n) => (
              <Link key={n.label} to={n.to} className="menu__link t-heading-l" tabIndex={open ? 0 : -1}>
                {n.label}
              </Link>
            ))}
          </nav>
          <ul className="menu__shop">
            {products.map((p) => (
              <li key={p.handle}>
                <Link
                  to={`/products/${p.handle}`}
                  className="menu__shop-link t-body"
                  tabIndex={open ? 0 : -1}
                >
                  <span className={`menu__dot theme-${p.theme}`} aria-hidden />
                  {p.name}
                  <span className="t-muted"> {p.descriptor}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button className="t-label menu__close" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/** The page loader.

    An ink flood: a pen writes a thick scribble, the scribble swells until its
    ink floods the frame, and the wordmark is revealed as a hole punched through
    the ink. It holds on a flat coral field, which is the ground of the hero it
    lifts into, so the curtain never dissolves into a colour the page does not
    have.

    Shown once per session. It carries a failsafe: if anything stalls, the page
    opens anyway. A loader that can trap someone is worse than no loader. */
export function Intro() {
  const [done, setDone] = useState(() => {
    if (typeof window === "undefined") return true;
    // Under reduced motion the curtain is skipped outright rather than shown
    // briefly. A loader with no motion is pure obstacle: the motion is the only
    // thing that earns the wait.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    try {
      return sessionStorage.getItem("dash-intro") === "1";
    } catch {
      return false;
    }
  });
  const [lifting, setLifting] = useState(false);

  const finish = useCallback(() => {
    setLifting(true);
    window.setTimeout(() => {
      try {
        sessionStorage.setItem("dash-intro", "1");
      } catch {
        // Private mode. The loader simply runs again next time.
      }
      setDone(true);
    }, 700);
  }, []);

  // Lock scroll while the curtain is up, so the page cannot move underneath it.
  useEffect(() => {
    if (done) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [done]);

  if (done) return null;

  return (
    <div className={`curtain${lifting ? " curtain--up" : ""}`} aria-hidden="true">
      <InkFloodCurtain onDone={finish} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Appears once the buy box scrolls out of view. A supplements test measured
    7.9 percent more completed orders at 99 percent significance. */
export function StickyBuyBar({
  product,
  pack,
  visible,
  onAdd,
}: {
  product: Product;
  pack: Pack;
  visible: boolean;
  onAdd: () => void;
}) {
  return (
    <div className={`buybar${visible ? " buybar--on" : ""}`} aria-hidden={!visible}>
      <div className="shell buybar__inner">
        <div className="buybar__id">
          <img src={`/media/${product.images[0]}.jpg`} alt="" className="buybar__img" />
          <span className="buybar__text">
            <span className="t-body-s buybar__name">{product.name}</span>
            <span className="t-data buybar__meta">
              {tierFor(pack.servings)?.name} · {money(pack.price)}
            </span>
          </span>
        </div>
        <Button variant="secondary" onClick={onAdd} tabIndex={visible ? 0 : -1}>
          Add to cart
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function Footer() {
  return (
    <footer className="ft">
      <div className="shell">
        <p className="ft__lede t-heading-m">{BRAND.newsletter.title}</p>
        <p className="t-body t-muted ft__sub">{BRAND.newsletter.body}</p>

        <div className="ft__cols">
          <div className="ft__col">
            <p className="t-label">Helpful Links</p>
            {BRAND.footer.helpful.map((l) => (
              <span key={l} className="ft__link t-body-s">{l}</span>
            ))}
          </div>
          <div className="ft__col">
            <p className="t-label">Quick Shop</p>
            {products.map((p) => (
              <Link key={p.handle} to={`/products/${p.handle}`} className="ft__link t-body-s">
                {p.name}
              </Link>
            ))}
          </div>
          <div className="ft__col">
            <p className="t-label">Quick Links</p>
            {BRAND.footer.legal.map((l) => (
              <span key={l} className="ft__link t-body-s">{l}</span>
            ))}
          </div>
          <div className="ft__col">
            <p className="t-label">Get in touch</p>
            <span className="ft__link t-body-s">{COMMERCE.support.email}</span>
            <span className="ft__link t-data">{COMMERCE.support.phone}</span>
            <p className="t-data ft__pay">{COMMERCE.paymentMethods.join(" · ")}</p>
          </div>
        </div>

        <p className="ft__mark t-display-xxl" aria-hidden="true">DASH</p>

        <div className="ft__base">
          <p className="t-body-s t-muted">{BRAND.footer.copyright}</p>
          <p className="t-body-s t-muted ft__disclaim">
            Food supplement. Not for medicinal use. These statements have not been
            evaluated for the diagnosis, treatment or prevention of any disease.
          </p>
        </div>
      </div>
    </footer>
  );
}
