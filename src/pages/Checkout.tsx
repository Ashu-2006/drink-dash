/* ==========================================================================
   Checkout.

   Three stages plus a confirmation, driven by the URL so the browser back
   button walks the flow instead of leaving it. A single long form would be
   cheaper to build; it is worse here because address entry and payment carry
   different error consequences, and one submit button for both means a
   mistyped pincode and a wrong card fail at the same moment.

   THIS IS A PROTOTYPE CHECKOUT. Nothing is transmitted. There is no payment
   gateway, no order is created, and the card fields below are deliberately
   non-functional: they collect nothing and store nothing. Wiring a real
   gateway is a backend decision, not a frontend one, and the note at the
   bottom of this file says what that would involve.

   States built: empty cart, stage validation errors, field-level errors,
   submitting, confirmed, and a direct hit on a later stage without having
   completed an earlier one.
   ========================================================================== */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Band, Button } from "../components/primitives";
import { orderTotal, shippingFor, useCart } from "../lib/cart";
import { COMMERCE, money } from "../lib/catalog";
import "./checkout.css";
import { useTitle } from "../lib/useTitle";

const STAGES = ["details", "delivery", "payment", "done"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABEL: Record<Stage, string> = {
  details: "Contact",
  delivery: "Delivery",
  payment: "Payment",
  done: "Confirmed",
};

/* -------------------------------------------------------------------------- */

type Fields = {
  email: string;
  phone: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  method: "prepaid" | "cod";
  pay: "upi" | "card";
  upi: string;
};

const EMPTY: Fields = {
  email: "",
  phone: "",
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  method: "prepaid",
  pay: "upi",
  upi: "",
};

type Errors = Partial<Record<keyof Fields, string>>;

/* Validation is deliberately shallow and Indian-format aware. It rejects what
   is certainly wrong and accepts everything else, because a checkout that
   argues with a real address is worse than one that accepts an odd one. */
function validate(stage: Stage, f: Fields): Errors {
  const e: Errors = {};
  if (stage === "details") {
    if (!f.email.trim()) e.email = "Enter an email so we can send the receipt";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()))
      e.email = "That email does not look right";

    const digits = f.phone.replace(/\D/g, "");
    if (!digits) e.phone = "Enter a phone number for delivery updates";
    else if (digits.length < 10) e.phone = "Indian mobile numbers are 10 digits";
  }
  if (stage === "delivery") {
    if (!f.name.trim()) e.name = "Enter the name for the parcel";
    if (!f.line1.trim()) e.line1 = "Enter a street address";
    if (!f.city.trim()) e.city = "Enter a city";
    if (!f.state.trim()) e.state = "Enter a state";
    if (!/^\d{6}$/.test(f.pincode.trim()))
      e.pincode = "Indian pincodes are 6 digits";
  }
  if (stage === "payment" && f.method === "prepaid" && f.pay === "upi") {
    if (!f.upi.trim()) e.upi = "Enter a UPI ID";
    else if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(f.upi.trim()))
      e.upi = "A UPI ID looks like name@bank";
  }
  return e;
}

/* -------------------------------------------------------------------------- */

export default function Checkout() {
  const { stage: raw } = useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const stage: Stage = (STAGES as readonly string[]).includes(raw ?? "details")
    ? ((raw ?? "details") as Stage)
    : "details";

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useTitle(`Checkout, ${STAGE_LABEL[stage].toLowerCase()}`);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTouched(false);
    setErrors({});
  }, [stage]);

  /* Deep-linking to /checkout/payment with an empty details form would let a
     shopper skip validation entirely. Each stage checks the ones before it and
     sends them back to the first that does not pass. */
  useEffect(() => {
    if (stage === "done" || stage === "details") return;
    const earlier = STAGES.slice(0, STAGES.indexOf(stage)) as Stage[];
    const bad = earlier.find((s) => Object.keys(validate(s, fields)).length > 0);
    if (bad) navigate(`/checkout/${bad}`, { replace: true });
  }, [stage, fields, navigate]);

  const set = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    /* Clear a field's error as soon as it is edited, rather than making the
       shopper resubmit to find out whether they fixed it. */
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const shipping = shippingFor(cart.subtotal);
  const total = orderTotal(cart.subtotal);

  const next = () => {
    const found = validate(stage, fields);
    setTouched(true);
    setErrors(found);
    if (Object.keys(found).length) {
      /* Move focus to the first field that failed. Announcing an error the
         shopper then has to hunt for is most of the way to not announcing it. */
      const first = Object.keys(found)[0];
      document.getElementById(first)?.focus();
      return;
    }
    const i = STAGES.indexOf(stage);
    if (stage !== "payment") {
      navigate(`/checkout/${STAGES[i + 1]}`);
      return;
    }
    placeOrder();
  };

  const placeOrder = () => {
    setBusy(true);
    /* Stands in for a network round trip. It exists so the submitting state is
       real and testable, not to fake a success the backend has not confirmed. */
    window.setTimeout(() => {
      setOrderId(`DASH${Date.now().toString().slice(-8)}`);
      cart.clear();
      setBusy(false);
      navigate("/checkout/done", { replace: true });
    }, 900);
  };

  const emptyCart = cart.lines.length === 0;

  if (stage === "done") return <Done orderId={orderId} email={fields.email} />;

  /* An empty cart at checkout is not an error, it is a wrong turn. */
  if (emptyCart) {
    return (
      <div className="theme-glow">
        <Band tone="cream">
          <div className="ck-empty">
            <h1 className="t-heading-l">There is nothing to check out</h1>
            <p className="t-body t-muted">
              Your cart is empty. Add a shot and the checkout will be waiting.
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
      <Band tone="cream">
        <div className="ck">
          <div className="ck__main">
            <Steps stage={stage} />

            <h1 className="t-heading-m ck__title">
              {stage === "details" && "How do we reach you"}
              {stage === "delivery" && "Where is it going"}
              {stage === "payment" && "How would you like to pay"}
            </h1>

            {touched && Object.keys(errors).length > 0 && (
              <p className="ck__alert t-body-s" role="alert">
                {Object.keys(errors).length === 1
                  ? "One field needs attention."
                  : `${Object.keys(errors).length} fields need attention.`}
              </p>
            )}

            <form
              className="ck__form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              {stage === "details" && (
                <>
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    hint="Your receipt and tracking link go here."
                    value={fields.email}
                    error={errors.email}
                    onChange={(v) => set("email", v)}
                  />
                  <Field
                    id="phone"
                    label="Phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    hint="Couriers in India call before delivery."
                    value={fields.phone}
                    error={errors.phone}
                    onChange={(v) => set("phone", v)}
                  />
                </>
              )}

              {stage === "delivery" && (
                <>
                  <Field
                    id="name"
                    label="Full name"
                    autoComplete="name"
                    value={fields.name}
                    error={errors.name}
                    onChange={(v) => set("name", v)}
                  />
                  <Field
                    id="line1"
                    label="Address"
                    autoComplete="address-line1"
                    value={fields.line1}
                    error={errors.line1}
                    onChange={(v) => set("line1", v)}
                  />
                  <Field
                    id="line2"
                    label="Apartment, landmark"
                    optional
                    autoComplete="address-line2"
                    value={fields.line2}
                    error={errors.line2}
                    onChange={(v) => set("line2", v)}
                  />
                  <div className="ck__row">
                    <Field
                      id="city"
                      label="City"
                      autoComplete="address-level2"
                      value={fields.city}
                      error={errors.city}
                      onChange={(v) => set("city", v)}
                    />
                    <Field
                      id="state"
                      label="State"
                      autoComplete="address-level1"
                      value={fields.state}
                      error={errors.state}
                      onChange={(v) => set("state", v)}
                    />
                    <Field
                      id="pincode"
                      label="Pincode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      value={fields.pincode}
                      error={errors.pincode}
                      onChange={(v) => set("pincode", v)}
                    />
                  </div>
                  <p className="t-body-s t-muted">
                    {COMMERCE.shipping.text} · {COMMERCE.dispatch.text}
                  </p>
                </>
              )}

              {stage === "payment" && (
                <>
                  <fieldset className="ck__choice">
                    <legend className="t-label t-muted">Payment</legend>
                    <Choice
                      name="method"
                      value="prepaid"
                      checked={fields.method === "prepaid"}
                      onChange={() => set("method", "prepaid")}
                      title="Pay now"
                      detail={COMMERCE.paymentMethods.join(" · ")}
                    />
                    {COMMERCE.cod.available && (
                      <Choice
                        name="method"
                        value="cod"
                        checked={fields.method === "cod"}
                        onChange={() => set("method", "cod")}
                        title="Cash on delivery"
                        detail={COMMERCE.cod.text}
                      />
                    )}
                  </fieldset>

                  {fields.method === "prepaid" && (
                    <fieldset className="ck__choice">
                      <legend className="t-label t-muted">Method</legend>
                      <Choice
                        name="pay"
                        value="upi"
                        checked={fields.pay === "upi"}
                        onChange={() => set("pay", "upi")}
                        title="UPI"
                        detail="Roughly four in five digital payments in India"
                      />
                      <Choice
                        name="pay"
                        value="card"
                        checked={fields.pay === "card"}
                        onChange={() => set("pay", "card")}
                        title="Card"
                        detail="RuPay, Visa, Mastercard"
                      />
                    </fieldset>
                  )}

                  {fields.method === "prepaid" && fields.pay === "upi" && (
                    <Field
                      id="upi"
                      label="UPI ID"
                      placeholder="name@bank"
                      value={fields.upi}
                      error={errors.upi}
                      onChange={(v) => set("upi", v)}
                    />
                  )}

                  {fields.method === "prepaid" && fields.pay === "card" && (
                    <p className="ck__stub t-body-s">
                      Card entry is not built. This prototype has no payment
                      gateway, so it will not ask for a card number it cannot
                      protect. Choose UPI or cash on delivery to continue.
                    </p>
                  )}

                  <p className="t-body-s t-muted">
                    {COMMERCE.returns.text} · {COMMERCE.taxNote.text}
                  </p>
                </>
              )}

              <div className="ck__actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    busy ||
                    (stage === "payment" &&
                      fields.method === "prepaid" &&
                      fields.pay === "card")
                  }
                >
                  {busy
                    ? "Placing order"
                    : stage === "payment"
                      ? `Pay ${money(total)}`
                      : "Continue"}
                </Button>
                {stage !== "details" && (
                  <Link
                    to={`/checkout/${STAGES[STAGES.indexOf(stage) - 1]}`}
                    className="t-body-s ck__back"
                  >
                    Back
                  </Link>
                )}
              </div>
            </form>
          </div>

          <aside className="ck__summary">
            <h2 className="t-heading-s">Order</h2>
            <ul className="ck__lines">
              {cart.lines.map((l) => (
                <li key={l.key}>
                  <span className="t-body-s">
                    {l.name}
                    <span className="t-muted"> × {l.qty}</span>
                    <span className="t-data ck__linedetail">{l.detail}</span>
                  </span>
                  <span className="t-data">{money(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="ck__totals t-data">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(cart.subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? COMMERCE.shipping.text : money(shipping)}</dd>
              </div>
              <div className="ck__total">
                <dt className="t-heading-s">Total</dt>
                <dd className="t-heading-s">{money(total)}</dd>
              </div>
            </dl>
            <p className="t-body-s t-muted">
              Prototype checkout. No payment is taken and no order is created.
            </p>
          </aside>
        </div>
      </Band>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Steps({ stage }: { stage: Stage }) {
  const i = STAGES.indexOf(stage);
  return (
    <ol className="ck__steps t-label" aria-label="Checkout progress">
      {STAGES.slice(0, 3).map((s, n) => (
        <li
          key={s}
          className={n === i ? "is-on" : n < i ? "is-done" : ""}
          aria-current={n === i ? "step" : undefined}
        >
          <span className="t-data">{n + 1}</span> {STAGE_LABEL[s]}
        </li>
      ))}
    </ol>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <p className={`fld${error ? " fld--bad" : ""}`}>
      <label htmlFor={id} className="t-label">
        {label}
        {optional && <span className="t-muted"> optional</span>}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={[errId, hintId].filter(Boolean).join(" ") || undefined}
        {...rest}
      />
      {/* The error replaces the hint rather than stacking under it, so the
          field never grows by two lines and pushes the next one down. */}
      {error ? (
        <span className="fld__err t-body-s" id={errId}>
          {error}
        </span>
      ) : (
        hint && (
          <span className="fld__hint t-body-s t-muted" id={hintId}>
            {hint}
          </span>
        )
      )}
    </p>
  );
}

function Choice({
  name,
  value,
  checked,
  onChange,
  title,
  detail,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label className={`ck__opt${checked ? " ck__opt--on" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span>
        <span className="t-heading-s">{title}</span>
        <span className="t-body-s t-muted">{detail}</span>
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */

function Done({ orderId, email }: { orderId: string | null; email: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* Reloading /checkout/done, or opening it directly, arrives with no order in
     state. Inventing an order number there would be a lie on the one screen
     that has to be trustworthy. */
  if (!orderId) {
    return (
      <div className="theme-glow">
        <Band tone="cream">
          <div className="ck-empty">
            <h1 className="t-heading-l">No order to show</h1>
            <p className="t-body t-muted">
              Order confirmations are not kept after the page is reloaded, and
              this prototype does not create real orders.
            </p>
            <Button as="link" to="/shop" variant="primary">
              Back to the shop
            </Button>
          </div>
        </Band>
      </div>
    );
  }

  return (
    <div className="theme-volume">
      <Band tone="soft">
        <div className="ck-done">
          <p className="t-label t-muted">Confirmed</p>
          <h1 className="t-display-xl">Thank you</h1>
          <p className="t-body">
            Order <span className="t-data">{orderId}</span>. A receipt is on its
            way to <span className="t-data">{email}</span>.
          </p>
          <p className="t-body-s t-muted">
            {COMMERCE.dispatch.text} · {COMMERCE.returns.text} · Questions go to{" "}
            {COMMERCE.support.email}
          </p>
          <p className="ck__stub t-body-s">
            This is a prototype. No payment was taken, no order was created, and
            no email will arrive.
          </p>
          <div className="ck-done__actions">
            <Button as="link" to="/shop" variant="primary">
              Keep shopping
            </Button>
            <Button as="link" to="/dash-diaries" variant="ghost">
              Read the Diaries
            </Button>
          </div>
        </div>
      </Band>
    </div>
  );
}

/* --------------------------------------------------------------------------
   WHAT A REAL CHECKOUT WOULD ADD, IN PLAIN TERMS

   This flow collects an address and a payment preference and then stops. Three
   things stand between it and taking money, and none of them are frontend
   work:

   1. A payment gateway. In India that is Razorpay, Cashfree or PayU. The
      browser never sees a card number: the gateway hands back a token, and the
      server charges the token. Cost is roughly 2 percent per transaction, plus
      the work of handling the callback when a payment succeeds after the
      shopper has already closed the tab.

   2. An order record on a server. Right now the cart lives in the shopper's
      browser. An order has to outlive the browser, because support, refunds
      and the courier all need to read it. That means a database and an
      endpoint, which means somewhere to run them.

   3. Stock. The catalogue's `available` flag is static. A real one decrements
      on purchase, which is where overselling comes from and why stock lives on
      the server rather than in the page.

   Until those exist, the honest thing is a checkout that says it is a
   prototype rather than one that mimics a receipt.
   -------------------------------------------------------------------------- */
