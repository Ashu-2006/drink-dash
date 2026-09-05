/* ==========================================================================
   Cart.

   The store holds references, not snapshots: a line is a sku and a quantity,
   and price, name and availability are resolved from the catalogue on every
   read. A snapshot would let a cart quietly disagree with the product page
   after a price change, and the cart is the one place where being wrong costs
   money. The cost of resolving is that a sku which leaves the catalogue makes
   its line unresolvable, so that case is handled explicitly rather than
   crashing: the line is dropped and the shopper is told.

   Persistence is localStorage, wrapped in try/catch. Private mode and blocked
   site data both throw on access rather than returning null, and a cart that
   cannot be saved is not a reason to fail to render one.
   ========================================================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  COMMERCE,
  byHandle,
  packTiers,
  products,
  proposals,
  tierFor,
} from "./catalog";
import type { Pack, Product, ThemeKey } from "./catalog";

const STORAGE_KEY = "dash.cart.v1";

/* Quantity ceiling per line. Not a stock rule, a fat-finger rule: the stepper
   is a hit target next to a remove control, and an unbounded counter is how a
   cart ends up at 97 units of one sku. */
export const QTY_MAX = 12;

/* -------------------------------------------------------------------------- */

export type CartRef =
  | { kind: "pack"; sku: string }
  | { kind: "bundle"; id: string };

export type CartEntry = CartRef & { qty: number };

/** What every "Add to cart" control on the site is handed. Pages pass a
    reference to what is being bought, never a display label: a label cannot
    be priced, cannot be deduplicated, and cannot be checked for stock. */
export type AddFn = (ref: CartRef, qty?: number) => void;

/** A line with everything the UI needs, resolved from the catalogue. */
export type CartLine = {
  key: string;
  kind: "pack" | "bundle";
  qty: number;
  name: string;
  detail: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  theme: ThemeKey | null;
  to: string | null;
  available: boolean;
  ref: CartRef;
};

const keyOf = (r: CartRef) => (r.kind === "pack" ? `pack:${r.sku}` : `bundle:${r.id}`);

/* -------------------------------------------------------------------------- */

type PackHit = { product: Product; pack: Pack };

const packBySku = (sku: string): PackHit | null => {
  for (const product of products) {
    const pack = product.packs.find((p) => p.sku === sku);
    if (pack) return { product, pack };
  }
  return null;
};

/* The tier the product pages call the Recommended Pack, read off the tier
   table by name rather than hardcoded as 30, so renaming or resizing the tier
   is a single edit in the catalogue. */
const recommendedServings = packTiers.find((t) =>
  /recommended/i.test(t.name)
)?.servings;

/* Bundles are not products, so they are not in `products` and have no sku.
   They live here in one lookup, keyed by the id the UI passes.

   The 30 Day Trio has no price in the catalogue because it is a proposal, not
   a listed product. Pricing it as the sum of its parts is the only honest
   default: it is exactly what the shopper would pay buying the three packs
   separately, so the bundle never quietly costs more than its contents. */
const sumOfRecommendedPacks = () =>
  products.reduce((total, product) => {
    const pack = product.packs.find(
      (k) => k.servings === recommendedServings && k.available
    );
    return total + (pack?.price ?? 0);
  }, 0);

const bundleTable = (): Record<
  string,
  { name: string; detail: string; price: number; note?: string }
> => ({
  trio: {
    name: proposals.trio.name,
    detail: proposals.trio.detail,
    price: proposals.trio.price,
    note: proposals.trio.note,
  },
  day30: {
    name: proposals.bundles[0].name,
    detail: proposals.bundles[0].detail,
    price: sumOfRecommendedPacks(),
  },
});

export function resolveLine(entry: CartEntry): CartLine | null {
  if (entry.kind === "pack") {
    const hit = packBySku(entry.sku);
    if (!hit) return null;
    const { product, pack } = hit;
    const tier = tierFor(pack.servings);
    return {
      key: keyOf(entry),
      kind: "pack",
      qty: entry.qty,
      name: product.name,
      detail: `${tier?.name ?? `${pack.servings} servings`} · ${pack.servings} servings`,
      price: pack.price,
      compareAt: pack.compareAt,
      image: product.images[0] ?? null,
      theme: product.theme,
      to: `/products/${product.handle}`,
      available: pack.available,
      ref: { kind: "pack", sku: entry.sku },
    };
  }
  const b = bundleTable()[entry.id];
  if (!b) return null;
  return {
    key: keyOf(entry),
    kind: "bundle",
    qty: entry.qty,
    name: b.name,
    detail: b.detail,
    price: b.price,
    compareAt: null,
    image: products[0]?.images[0] ?? null,
    theme: null,
    to: "/shop",
    available: true,
    ref: { kind: "bundle", id: entry.id },
  };
}

/* -------------------------------------------------------------------------- */

type Action =
  | { type: "add"; ref: CartRef; qty: number }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "hydrate"; entries: CartEntry[] };

const clampQty = (n: number) => Math.max(0, Math.min(QTY_MAX, Math.round(n)));

function reducer(state: CartEntry[], action: Action): CartEntry[] {
  switch (action.type) {
    case "hydrate":
      return action.entries;

    case "add": {
      const key = keyOf(action.ref);
      const found = state.find((e) => keyOf(e) === key);
      if (!found) {
        const qty = clampQty(action.qty);
        return qty > 0 ? [...state, { ...action.ref, qty }] : state;
      }
      /* Adding an sku already in the cart increments rather than duplicating,
         and saturates at the ceiling instead of refusing. */
      return state.map((e) =>
        keyOf(e) === key ? { ...e, qty: clampQty(e.qty + action.qty) } : e
      );
    }

    case "setQty": {
      const qty = clampQty(action.qty);
      if (qty === 0) return state.filter((e) => keyOf(e) !== action.key);
      return state.map((e) => (keyOf(e) === action.key ? { ...e, qty } : e));
    }

    case "remove":
      return state.filter((e) => keyOf(e) !== action.key);

    case "clear":
      return [];
  }
}

/* -------------------------------------------------------------------------- */

function read(): CartEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    /* Anything in storage is user-editable and may be from an older build, so
       every field is checked rather than trusted. */
    return parsed.flatMap((e): CartEntry[] => {
      if (!e || typeof e !== "object") return [];
      const o = e as Record<string, unknown>;
      const qty = clampQty(typeof o.qty === "number" ? o.qty : 0);
      if (qty <= 0) return [];
      if (o.kind === "pack" && typeof o.sku === "string")
        return [{ kind: "pack", sku: o.sku, qty }];
      if (o.kind === "bundle" && typeof o.id === "string")
        return [{ kind: "bundle", id: o.id, qty }];
      return [];
    });
  } catch {
    return [];
  }
}

function write(entries: CartEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* Quota, private mode, or blocked site data. The cart still works for this
       session; it just will not survive a reload. Nothing to tell the shopper
       until they try to come back, and nothing they could do about it. */
  }
}

/* -------------------------------------------------------------------------- */

export type CartApi = {
  entries: CartEntry[];
  lines: CartLine[];
  /** Lines whose sku is no longer in the catalogue, already removed. */
  dropped: number;
  count: number;
  subtotal: number;
  savings: number;
  msg: string;
  open: boolean;
  add: (ref: CartRef, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(reducer, []);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [dropped, setDropped] = useState(0);
  const hydrated = useRef(false);
  const busy = useRef(false);

  /* Read once on mount rather than in the reducer initialiser, so the first
     server-identical render is an empty cart and hydration cannot mismatch. */
  useEffect(() => {
    const stored = read();
    const live = stored.filter((e) => resolveLine(e) !== null);
    if (live.length !== stored.length) setDropped(stored.length - live.length);
    if (live.length) dispatch({ type: "hydrate", entries: live });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    write(entries);
  }, [entries]);

  const lines = useMemo(
    () => entries.map(resolveLine).filter((l): l is CartLine => l !== null),
    [entries]
  );

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((n, l) => n + l.price * l.qty, 0),
    [lines]
  );
  const savings = useMemo(
    () =>
      lines.reduce(
        (n, l) => n + (l.compareAt ? (l.compareAt - l.price) * l.qty : 0),
        0
      ),
    [lines]
  );

  const add = useCallback((ref: CartRef, qty = 1) => {
    /* Duplicate-submit guard. A double tap on a 48px target is one intent. */
    if (busy.current) return;
    busy.current = true;
    window.setTimeout(() => (busy.current = false), 400);

    const line = resolveLine({ ...ref, qty });
    if (!line) {
      setMsg("That option is no longer available");
      return;
    }
    if (!line.available) {
      setMsg(`${line.name} is out of stock`);
      return;
    }
    dispatch({ type: "add", ref, qty });
    setMsg(`${line.name} added to cart`);
    setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    dispatch({ type: "setQty", key, qty });
  }, []);

  const remove = useCallback((key: string) => {
    dispatch({ type: "remove", key });
    setMsg("Removed from cart");
  }, []);

  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  /* The live region has to change to be announced, and it must not sit there
     repeating itself to a screen reader on every later render. */
  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(""), 3000);
    return () => window.clearTimeout(t);
  }, [msg]);

  const value = useMemo<CartApi>(
    () => ({
      entries,
      lines,
      dropped,
      count,
      subtotal,
      savings,
      msg,
      open,
      add,
      setQty,
      remove,
      clear,
      setOpen,
    }),
    [entries, lines, dropped, count, subtotal, savings, msg, open, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** The cart's assertive channel. One live region for the whole app, so an
    "added to cart" is announced once rather than once per mounted button. */
export function CartAnnounce() {
  const { msg } = useCart();
  return (
    <p className="visually-hidden" role="status" aria-live="polite">
      {msg}
    </p>
  );
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/* --------------------------------------------------------------------------
   Convenience for call sites that only know a product.
   -------------------------------------------------------------------------- */

/** The pack a card should add: the Recommended Pack if it is in stock, else
    the cheapest one that is. Returns null when nothing is buyable, which is
    what a card needs to know to disable itself. */
export function defaultPack(handle: string): Pack | null {
  const product = byHandle(handle);
  if (!product) return null;
  const inStock = product.packs.filter((p) => p.available);
  if (!inStock.length) return null;
  const recommended = inStock.find((p) => p.servings === recommendedServings);
  return recommended ?? inStock.reduce((a, b) => (a.price <= b.price ? a : b));
}

/* Shipping is free on every order per the product pages. The shipping policy
   contradicts this; see COMMERCE.knownContradiction. The promise on the page
   is the one a shopper acted on, so it is the one honoured here. */
export const shippingFor = (_subtotal: number) => 0;

export const orderTotal = (subtotal: number) => subtotal + shippingFor(subtotal);

export { COMMERCE };
