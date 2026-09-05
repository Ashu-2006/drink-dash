/* ==========================================================================
   The DASH wordmark.

   Uses the brand's real logo asset (/media/logo.webp, pulled from the store)
   rather than a hand traced approximation. Hand tracing a wordmark is how you
   end up shipping a worse version of someone's identity.

   The reveal is a clip-path wipe plus a settle, which works on a raster asset
   and needs no fake vector paths. The ribbon motif from the wordmark's A lives
   separately in <PathRule>, where a drawn line actually does a job.

   Under reduced motion the mark renders complete, never absent, because it is
   content.
   ========================================================================== */

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { reduced } from "./primitives";

gsap.registerPlugin(DrawSVGPlugin, useGSAP);

export function Logo({
  variant = "plain",
  onDone,
}: {
  variant?: "plain" | "draw";
  onDone?: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (variant !== "draw" || !root.current) return;
      const img = root.current.querySelector(".logo__img");
      if (!img) return;

      if (reduced()) {
        gsap.set(img, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, opacity: 1 });
        onDone?.();
        return;
      }

      gsap
        .timeline({ onComplete: () => onDone?.() })
        .fromTo(
          img,
          { clipPath: "inset(0% 100% 0% 0%)", scale: 1.06, opacity: 0 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            duration: 0.85,
            ease: "power3.inOut",
          }
        )
        // Settles back with a small overshoot, so the mark reads as arriving
        // and hitting a stop rather than gliding into place.
        .to(img, { scale: 1, duration: 0.5, ease: "back.out(1.4)" }, "-=0.35");
    },
    { scope: root, dependencies: [variant] }
  );

  return (
    <div ref={root} className="logo">
      <img
        className="logo__img"
        src="/media/logo.webp"
        alt="DASH Wellness Shots"
        width={608}
        height={322}
        decoding="sync"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The path motif, used as a section rule.
 *
 * The A in the DASH wordmark is a continuous ribbon looped into a leaf. It is a
 * CLOSED loop, which is the right reading for a daily ritual rather than a one
 * off. This draws that gesture as a line across a section break, on scroll.
 *
 * Reduced motion renders it fully drawn. The line carries meaning, so removing
 * it would remove content.
 */
export function PathRule({ flip = false }: { flip?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const path = ref.current?.querySelector("path");
      if (!path) return;
      if (reduced()) {
        gsap.set(path, { drawSVG: "100%" });
        return;
      }
      gsap.fromTo(
        path,
        { drawSVG: "0%" },
        {
          drawSVG: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 92%",
            end: "top 45%",
            scrub: 0.6,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <svg
      ref={ref}
      className={`pathrule${flip ? " pathrule--flip" : ""}`}
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* A long travelling line that loops once, the way the wordmark's A does. */}
      <path
        d="M0 60 H420 C470 60 500 26 540 26 C586 26 604 62 604 82 C604 102 588 112 570 112 C548 112 536 96 536 74 C536 44 566 26 604 26 C648 26 676 60 726 60 H1200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
