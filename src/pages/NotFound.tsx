/* ==========================================================================
   404.

   This route used to render the home page, which is worse than it sounds: a
   broken link then looks like a working one, and nobody ever reports it.
   ========================================================================== */

import { Link, useLocation } from "react-router-dom";
import { Band, Button } from "../components/primitives";
import { BRAND, products } from "../lib/catalog";
import "./notfound.css";
import { useTitle } from "../lib/useTitle";

export default function NotFound() {
  const { pathname } = useLocation();
  useTitle("Page not found");
  return (
    <div className="theme-burn">
      <Band tone="cream">
        <div className="nf">
          <p className="t-label t-muted">404</p>
          <h1 className="t-display-xl">Nothing lives here</h1>
          <p className="t-body t-muted">
            <span className="t-data">{pathname}</span> is not a page on this
            site. It may have been renamed, or the link may be wrong.
          </p>
          <div className="nf__actions">
            <Button as="link" to="/" variant="primary">
              Home
            </Button>
            <Button as="link" to="/shop" variant="ghost">
              Shop all shots
            </Button>
          </div>
          <div className="nf__links">
            <p className="t-label t-muted">Or try one of these</p>
            <ul>
              {BRAND.nav.map((n) => (
                <li key={n.to}>
                  <Link className="t-body" to={n.to}>
                    {n.label}
                  </Link>
                </li>
              ))}
              {products.map((p) => (
                <li key={p.handle}>
                  <Link className="t-body" to={`/products/${p.handle}`}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>
    </div>
  );
}
