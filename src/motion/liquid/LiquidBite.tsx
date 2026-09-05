/* ==========================================================================
   Liquid carve.

   A gooey blob tracks the cursor and knocks a hole out of the button surface.
   The bite is SUBTRACTIVE: an SVG <mask> removes a circle from the surface
   pill, then a goo filter (feGaussianBlur followed by an alpha threshold in
   feColorMatrix) rounds that hole and grows shoulders where it meets an edge.
   Surface tension, not a cut-out. A reveal pill sitting behind the surface
   shows through the carve, so the effect reads on any band.

   Stack note: this is GSAP, not framer-motion. GSAP is already the project's
   motion engine, and gsap.ticker gives every button on the page one shared
   rAF instead of one animation loop each. The blob is grown by tweening the
   circle r attribute rather than a transform, so a zero-size bbox never has
   to produce a transform origin.
   ========================================================================== */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode, PointerEvent as ReactPointerEvent, RefObject } from "react";
import gsap from "gsap";

/* Blur radius of the goo filter, in px. Every button in the system lands
   within a few px of 59 tall at every breakpoint, because the fluid root
   holds --size-font near 16 all the way down. One shared filter serves all of
   them, so the document carries exactly one filter node. */
const GOO_BLUR = 6;

/* Alpha threshold. Multiply alpha hard, then subtract, so the blurred edge
   snaps back to a firm contour and only the shoulders stay round. */
const GOO_GAIN = 19;
const GOO_BIAS = -9;

/* Blob diameter as a fraction of button height. The source ran 80px on a
   ~140px-tall button, so 0.57; the goo threshold then grows it by roughly the
   blur radius again. Much past this and the bite severs the pill top to
   bottom instead of biting into it. */
const BLOB_RATIO = 0.58;
const BLOB_MIN = 14;

/* Exponential follow. Small tau keeps up with the cursor, large tau lags and
   reads as viscous. The source ran 0.23 on a 120px-tall demo button; at our
   scale the travel is a fifth of that, so it needs to be proportionally
   tighter or the blob only ever trails and never arrives. */
const FOLLOW_TAU = 0.08;

/* Directional squash. The blob stretches along its velocity and thins across
   it, then relaxes. The pair is reciprocal, so area is preserved. */
const SQUASH_TAU = 0.09;
const SQUASH_PER_PX_PER_SEC = 0.0007;
const SQUASH_MAX = 1.28;
const SQUASH_MIN_SPEED = 8; /* px/s below which the heading is left alone */

/* The blur-then-threshold pass grows the hole slightly past the raw circle.
   The clipped label copy has to grow with it or a fringe of the outer colour
   survives around the bite. */
const BITE_FRINGE = 1.08;

const OPEN = { duration: 0.55, ease: "power3.out" } as const;
const CLOSE = { duration: 0.4, ease: "power2.inOut" } as const;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const canHover = () =>
  typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------------------
   One filter for the whole document. Mounted once at the app root.
   -------------------------------------------------------------------------- */

export const GOO_FILTER_ID = "dash-goo";

export function GooDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      className="goo-defs"
    >
      <defs>
        {/* sRGB, not the linearRGB default. With a hard alpha gain and
            premultiplied colour, linear interpolation washes the fill out at
            every edge the threshold touches. */}
        <filter
          id={GOO_FILTER_ID}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={GOO_BLUR}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GOO_GAIN} ${GOO_BIAS}`}
          />
        </filter>
      </defs>
    </svg>
  );
}

/* --------------------------------------------------------------------------
   The hook. Returns the root ref, the pointer bindings, and the SVG layer to
   render behind the label.
   -------------------------------------------------------------------------- */

type Bind = {
  onPointerEnter: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

export function useLiquidBite(enabled = true): {
  ref: RefObject<HTMLElement | null>;
  bind: Bind;
  layer: ReactNode;
  carveLabelRef: RefObject<HTMLSpanElement | null>;
} {
  const root = useRef<HTMLElement | null>(null);
  const follow = useRef<SVGGElement>(null);
  const squash = useRef<SVGGElement>(null);
  const blob = useRef<SVGCircleElement>(null);
  const carveLabel = useRef<HTMLSpanElement>(null);

  /* Radius and blob size are the only things that need a measured box. The
     mask and filter regions are in object-bounding-box units, so they are
     correct on the first frame with no measurement at all. */
  const [box, setBox] = useState({ w: 0, h: 0 });
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const read = () =>
      setBox((prev) =>
        prev.w === el.offsetWidth && prev.h === el.offsetHeight
          ? prev
          : { w: el.offsetWidth, h: el.offsetHeight }
      );
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rx = box.h ? Math.min(box.w, box.h) / 2 : 0;
  const blobR = box.h ? Math.max(BLOB_MIN, (box.h * BLOB_RATIO) / 2) : 0;

  const chase = useRef({ x: 0, y: 0, tx: 0, ty: 0, squash: 1, angle: 0 });
  const running = useRef(false);

  /* Held in a ref so the identity is stable: gsap.ticker.remove needs the
     same function object it was handed. */
  const tick = useRef((_time: number, deltaMs: number) => {
    const dt = Math.min(0.05, deltaMs / 1000);
    const st = chase.current;

    const k = 1 - Math.exp(-dt / FOLLOW_TAU);
    const dx = (st.tx - st.x) * k;
    const dy = (st.ty - st.y) * k;
    st.x += dx;
    st.y += dy;

    const speed = Math.hypot(dx, dy) / dt;
    const want = Math.min(SQUASH_MAX, 1 + speed * SQUASH_PER_PX_PER_SEC);
    st.squash += (want - st.squash) * (1 - Math.exp(-dt / SQUASH_TAU));
    if (speed > SQUASH_MIN_SPEED) st.angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (follow.current)
      follow.current.style.transform = `translate(${st.x}px, ${st.y}px)`;
    if (squash.current)
      squash.current.style.transform = `rotate(${st.angle}deg) scale(${st.squash}, ${
        1 / st.squash
      })`;

    /* The label, clipped to the bite, in the colour that reads against the
       carve. A white blob under a cream label would erase it, so the copy
       underneath shows through the hole instead. The label box is centred in
       the button, so the chase offsets carry over unchanged. CSS clip-path
       cannot reference the SVG <mask>, so this is a plain circle; it lands a
       hair inside the gooed edge, which BITE_FRINGE pays back. */
    if (carveLabel.current && blob.current) {
      const r = blob.current.r.baseVal.value * BITE_FRINGE;
      carveLabel.current.style.clipPath = `circle(${r}px at calc(50% + ${st.x}px) calc(50% + ${st.y}px))`;
    }
  });

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    gsap.ticker.add(tick.current);
  }, []);

  const stop = useCallback(() => {
    if (!running.current) return;
    running.current = false;
    gsap.ticker.remove(tick.current);
  }, []);

  /* Navigating away, an unmount mid-hover, or the disabled flag flipping all
     leave the ticker running and a tween pointing at a detached node. */
  useEffect(() => {
    const node = blob.current;
    return () => {
      stop();
      if (node) gsap.killTweensOf(node);
    };
  }, [stop]);

  const centre = useCallback((e: ReactPointerEvent) => {
    const el = root.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      dx: e.clientX - (r.left + r.width / 2),
      dy: e.clientY - (r.top + r.height / 2),
    };
  }, []);

  const open = useCallback(
    (at: { dx: number; dy: number } | null) => {
      if (!blob.current) return;
      const st = chase.current;
      /* Snap on entry rather than easing from the last exit point, so the
         blob is born under the cursor instead of flying across the pill. */
      st.tx = at?.dx ?? 0;
      st.ty = at?.dy ?? 0;
      st.x = st.tx;
      st.y = st.ty;
      st.squash = 1;
      if (follow.current)
        follow.current.style.transform = `translate(${st.x}px, ${st.y}px)`;
      start();
      gsap.to(blob.current, { attr: { r: blobR }, ...OPEN, overwrite: true });
    },
    [blobR, start]
  );

  const close = useCallback(() => {
    if (!blob.current) {
      stop();
      return;
    }
    gsap.to(blob.current, {
      attr: { r: 0 },
      ...CLOSE,
      overwrite: true,
      onComplete: stop,
    });
  }, [stop]);

  const live = enabled && canHover() && !reducedMotion();

  const bind: Bind = {
    onPointerEnter: (e) => {
      if (!live || e.pointerType === "touch") return;
      open(centre(e));
    },
    onPointerMove: (e) => {
      if (!live || !running.current) return;
      const o = centre(e);
      if (!o) return;
      chase.current.tx = o.dx;
      chase.current.ty = o.dy;
    },
    onPointerLeave: () => {
      if (!running.current) return;
      close();
    },
    /* Keyboard gets the same state, parked at centre. Without this the
       focus-visible button would be the only one in the system with no
       hover-equivalent affordance. */
    onFocus: () => {
      if (!enabled || reducedMotion()) return;
      if (!root.current?.matches(":focus-visible")) return;
      open(null);
    },
    onBlur: () => {
      if (!running.current) return;
      close();
    },
  };

  const uid = useId().replace(/:/g, "");
  const maskId = `bite-${uid}`;

  const layer = (
    <svg className="btn__bg" aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId} x="-0.25" y="-0.25" width="1.5" height="1.5">
          <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
          <g ref={follow} className="btn__follow">
            <g ref={squash} className="btn__squash">
              <circle ref={blob} cx="50%" cy="50%" r="0" fill="#000" />
            </g>
          </g>
        </mask>
      </defs>

      {/* Behind: what the carve reveals. */}
      <g filter={`url(#${GOO_FILTER_ID})`}>
        <rect className="btn__reveal" width="100%" height="100%" rx={rx} ry={rx} />
      </g>

      {/* In front: the pill, minus the bite. Gooed on its own so the hole
          keeps its shoulders. Gooing both layers together would fill the
          alpha hole and leave the filter nothing to round. */}
      <g filter={`url(#${GOO_FILTER_ID})`}>
        <rect
          className="btn__surface"
          width="100%"
          height="100%"
          rx={rx}
          ry={rx}
          mask={`url(#${maskId})`}
        />
      </g>

      {/* Outline, for the variants that have one. It sits above the carve and
          outside the filter: a 2px stroke blurred at stdDeviation 6 falls
          under the alpha threshold and vanishes entirely. So the edge stays
          crisp and only the interior gets bitten. Inset by half the stroke
          width so it lands inside the box rather than straddling it. */}
      <rect
        className="btn__stroke"
        x="1"
        y="1"
        width={Math.max(0, box.w - 2)}
        height={Math.max(0, box.h - 2)}
        rx={Math.max(0, rx - 1)}
        ry={Math.max(0, rx - 1)}
      />
    </svg>
  );

  return { ref: root, bind, layer, carveLabelRef: carveLabel };
}
