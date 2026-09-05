/* ==========================================================================
   The DASH mark, used three ways.

   The mark is one closed path (public/logo-mark.svg, 221 x 280). It is
   inlined here as path data rather than loaded as a file because two of the
   three uses need it inside the document: a <pattern> cannot tile an external
   image without a second network request per band, and the draw-on animation
   needs the live path node to measure its own length.

     <MarkTexture>  a tiled watermark, the same device the cartons use
     <MarkDraw>     the outline drawing itself on as the section arrives
     <MarkGlyph>    a small inline mark, for bullets and ornaments

   Everything inherits currentColor, so a band sets the colour and the mark
   follows. Nothing here hardcodes a fill.
   ========================================================================== */

import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reduced } from "./primitives";

gsap.registerPlugin(ScrollTrigger);

/** Verbatim from public/logo-mark.svg. viewBox 0 0 221 280. */
export const MARK_PATH =
  "M116.189 0.311507C128.919 -1.32451 147.352 3.63961 157.579 11.5415C174.889 24.9158 184.404 46.2626 190.075 66.8741C191.161 70.8198 192.499 75.3045 193.054 79.2605C199.222 78.5368 211.805 79.0679 219.183 78.7045C219.077 86.2767 219.585 94.6933 219.826 102.331C220.071 110.028 220.043 118.955 220.793 126.526C214.543 126.103 205.132 126.483 198.456 126.393C198.474 126.562 198.489 126.73 198.501 126.898C201.655 173.347 190.06 273.45 129.611 277.829C115.482 278.95 101.485 274.427 90.6838 265.249C76.9979 253.389 71.77 236.797 70.5343 219.262C68.1797 181.298 82.2306 144.148 109.119 117.247C112.972 113.319 115.914 110.251 120.177 106.827C124.304 103.466 128.653 100.387 133.194 97.6131C135.75 96.0435 145.394 91.3359 146.624 89.9225C146.88 88.076 146.089 85.4075 145.653 83.51C142.869 73.6311 139.794 61.8615 133.282 53.7385C130.683 50.4959 126.976 48.0579 122.781 47.6136C117.452 47.0489 112.09 50.329 108.13 53.628C77.0026 79.5556 59.4038 176.052 53.9514 215.34C52.333 227.002 50.7734 238.919 49.6888 250.641C48.8063 260.179 48.3234 269.753 47.4692 279.296C33.3837 278.134 13.8828 276.493 0 276.112C2.02907 262.508 2.31155 248.584 3.98713 234.925C11.847 170.84 26.6103 74.6002 69.3286 24.5493C80.5712 11.377 98.9086 1.70385 116.189 0.311507ZM120.4 227.787C124.034 231.088 128.264 231.107 131.27 226.933C146.052 206.413 149.512 177.594 150.894 152.888C151.017 150.665 151.38 144.932 151.126 142.966C148.077 144.887 145.592 147.736 143.153 150.267C124.494 169.631 115.215 194.506 118.188 221.291C118.452 223.67 119.293 225.671 120.4 227.787Z";

const VIEW_W = 221;
const VIEW_H = 280;

/* -------------------------------------------------------------------------- */

/** A small inline mark. Sizes from font-size, colours from currentColor. */
export function MarkGlyph({
  size = "1em",
  className,
}: {
  size?: string | number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path d={MARK_PATH} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * A tiled watermark of the mark, the same device the cartons print.
 *
 * Absolutely positioned to fill its nearest positioned ancestor, so a band
 * only has to be `position: relative`. Purely decorative: it carries no alt
 * text and is hidden from the accessibility tree.
 */
export function MarkTexture({
  /** Tile edge in px. Larger reads as pattern, smaller as noise. */
  tile = 132,
  /** Rotation of the whole field, in degrees. */
  angle = -12,
  opacity = 0.06,
  className,
}: {
  tile?: number;
  angle?: number;
  opacity?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const id = `mark-tile-${uid}`;
  /* The glyph occupies about half the tile, so the field reads as a scatter
     rather than a grid of touching marks. */
  const glyph = tile * 0.46;
  const w = glyph * (VIEW_W / VIEW_H);

  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        color: "inherit",
        opacity,
      }}
    >
      <defs>
        <pattern
          id={id}
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${angle})`}
        >
          <path
            d={MARK_PATH}
            fill="currentColor"
            transform={`translate(${(tile - w) / 2} ${
              (tile - glyph) / 2
            }) scale(${w / VIEW_W} ${glyph / VIEW_H})`}
          />
          {/* A second, offset, smaller mark breaks the grid so the eye reads
              texture instead of wallpaper. */}
          <path
            d={MARK_PATH}
            fill="currentColor"
            opacity="0.55"
            transform={`translate(${tile * 0.74} ${tile * 0.66}) scale(${
              (w * 0.42) / VIEW_W
            } ${(glyph * 0.42) / VIEW_H})`}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The mark drawing itself: the outline strokes on as the section scrolls in,
 * then the fill fades up behind it.
 *
 * `scrub` ties it to scroll position rather than playing on a timer, so the
 * drawing tracks the reader instead of finishing before they arrive.
 *
 * Under reduced motion the finished state renders immediately. It is never
 * left undrawn, because the mark is the only thing in the block it sits in.
 */
export function MarkDraw({
  size = 260,
  strokeWidth = 2,
  className,
  scrub = true,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Tie progress to scroll position, or play once on entry. */
  scrub?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = wrap.current;
      if (!root) return;
      const line = root.querySelector<SVGPathElement>(".mark-draw__line");
      const fill = root.querySelector<SVGPathElement>(".mark-draw__fill");
      if (!line || !fill) return;

      if (reduced()) {
        gsap.set(line, { strokeDasharray: "none", strokeDashoffset: 0, opacity: 1 });
        gsap.set(fill, { opacity: 1 });
        return;
      }

      /* Measured, not guessed: the path length depends on the geometry, and a
         hardcoded dash array would break the moment the mark is redrawn. */
      const len = line.getTotalLength();
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
      gsap.set(fill, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 85%",
          end: scrub ? "bottom 55%" : "top 85%",
          scrub: scrub ? 0.6 : false,
          once: !scrub,
        },
      });
      tl.to(line, { strokeDashoffset: 0, ease: "none", duration: 1 }).to(
        fill,
        { opacity: 1, ease: "power2.out", duration: 0.45 },
        ">-0.2"
      );
    },
    { scope: wrap, dependencies: [scrub] }
  );

  return (
    <div ref={wrap} className={className} style={{ lineHeight: 0 }}>
      <svg
        width={size}
        height={size * (VIEW_H / VIEW_W)}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        aria-hidden="true"
        focusable="false"
        style={{ overflow: "visible", maxWidth: "100%", height: "auto" }}
      >
        <path className="mark-draw__fill" d={MARK_PATH} fill="currentColor" />
        <path
          className="mark-draw__line"
          d={MARK_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={0}
        />
      </svg>
    </div>
  );
}
