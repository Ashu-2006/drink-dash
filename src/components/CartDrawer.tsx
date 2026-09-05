/* ==========================================================================
   Cart drawer.

   A drawer, not a page and not a popover. The decision: a shopper adding a
   second shot should not lose the page they were browsing, which rules out a
   cart page; and the cart carries editable rows, a subtotal and a primary
   action, which is more than a popover should hold. A right-side drawer keeps
   the catalogue behind it and gives the rows room.

   States built: empty, populated, line out of stock, line at the quantity
   ceiling, lines dropped because a sku left the catalogue.
   ========================================================================== */

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "./primitives";
import { QTY_MAX, orderTotal, shippingFor, useCart } from "../lib/cart";
import { COMMERCE, money } from "../lib/catalog";
import "./cart.css";

export function CartDrawer() {
  const cart = useCart();
  const { open, setOpen, lines } = cart;
  const panel = useRef<HTMLDivElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  /* Escape closes, focus is trapped inside the panel while it is open, and the
     element that opened the drawer gets focus back when it closes. Without the
     restore, closing the drawer drops focus to <body> and a keyboard shopper
     starts again from the top of the document. */
  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    closer.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
      restoreTo.current?.focus?.();
    };
  }, [open, setOpen]);

  const shipping = shippingFor(cart.subtotal);
  const total = orderTotal(cart.subtotal);
  const empty = lines.length === 0;

  return (
    <>
      <div
        className={`scrim${open ? " scrim--on" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`cart${open ? " cart--on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        aria-hidden={!open}
        ref={panel}
      >
        <header className="cart__head">
          <h2 className="t-heading-s">
            Cart{" "}
            {!empty && (
              <span className="t-data t-muted">
                {cart.count} {cart.count === 1 ? "item" : "items"}
              </span>
            )}
          </h2>
          <button
            className="chip chip--outline"
            onClick={() => setOpen(false)}
            ref={closer}
            tabIndex={open ? 0 : -1}
          >
            Close
          </button>
        </header>

        {/* A sku can leave the catalogue between visits. Saying so beats a cart
            that silently shrinks between one session and the next. */}
        {cart.dropped > 0 && (
          <p className="cart__dropped t-body-s">
            {cart.dropped} saved {cart.dropped === 1 ? "item is" : "items are"} no
            longer available and {cart.dropped === 1 ? "was" : "were"} removed.
          </p>
        )}

        {empty ? (
          <div className="cart__empty">
            <p className="t-heading-s">Your cart is empty</p>
            <p className="t-body-s t-muted">
              Three shots, one concern each. Start with the one that sounds like
              your week.
            </p>
            <Button as="link" to="/shop" variant="primary">
              Shop all shots
            </Button>
          </div>
        ) : (
          <>
            <ul className="cart__list">
              {lines.map((l) => (
                <li
                  key={l.key}
                  className={`cart__line${l.theme ? ` theme-${l.theme}` : ""}${
                    l.available ? "" : " cart__line--out"
                  }`}
                >
                  {l.image && (
                    <img
                      className="cart__img"
                      src={`/media/${l.image}.jpg`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <div className="cart__body">
                    <p className="t-heading-s cart__name">
                      {l.to ? (
                        <Link to={l.to} onClick={() => setOpen(false)}>
                          {l.name}
                        </Link>
                      ) : (
                        l.name
                      )}
                    </p>
                    <p className="t-data t-muted cart__detail">{l.detail}</p>
                    {!l.available && (
                      <p className="t-data cart__out">Out of stock</p>
                    )}

                    <div className="cart__controls">
                      <div className="qty" role="group" aria-label={`Quantity, ${l.name}`}>
                        <button
                          type="button"
                          onClick={() => cart.setQty(l.key, l.qty - 1)}
                          aria-label={l.qty === 1 ? "Remove" : "Decrease quantity"}
                          tabIndex={open ? 0 : -1}
                        >
                          &minus;
                        </button>
                        <span className="t-data" aria-live="off">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.setQty(l.key, l.qty + 1)}
                          disabled={l.qty >= QTY_MAX}
                          aria-label="Increase quantity"
                          tabIndex={open ? 0 : -1}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="cart__remove t-body-s"
                        onClick={() => cart.remove(l.key)}
                        tabIndex={open ? 0 : -1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="t-data cart__price">
                    {money(l.price * l.qty)}
                    {l.compareAt && l.compareAt > l.price && (
                      <span className="cart__was">{money(l.compareAt * l.qty)}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>

            <footer className="cart__foot">
              <dl className="cart__totals t-data">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(cart.subtotal)}</dd>
                </div>
                {cart.savings > 0 && (
                  <div className="cart__savings">
                    <dt>You save</dt>
                    <dd>&minus;{money(cart.savings)}</dd>
                  </div>
                )}
                <div>
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? COMMERCE.shipping.text : money(shipping)}</dd>
                </div>
                <div className="cart__total">
                  <dt className="t-heading-s">Total</dt>
                  <dd className="t-heading-s">{money(total)}</dd>
                </div>
              </dl>
              <p className="t-body-s t-muted cart__tax">{COMMERCE.taxNote.text}</p>

              <Button
                as="link"
                to="/checkout"
                variant="primary"
                full
                onClick={() => setOpen(false)}
              >
                Checkout
              </Button>
              <p className="t-body-s t-muted cart__note">
                {COMMERCE.dispatch.text} · {COMMERCE.returns.text}
              </p>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
