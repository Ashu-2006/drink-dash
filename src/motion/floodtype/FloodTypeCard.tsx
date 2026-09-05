/* ==========================================================================
   Flood type: the mounted card.

   Adapted from the supplied component in two ways only:
   - the view-transition dependency is dropped, since this project uses the
     native View Transitions API rather than a transition bus
   - the font probe reads --font-body, which is General Sans, at weight 400
   ========================================================================== */

import { useEffect, useRef } from "react";
import { FloodType } from "./engine";
import { FONT_VAR, FONT_WEIGHT, PRESETS } from "./params";

export function FloodTypeCard({ label }: { label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: FloodType | null = null;
    let onScreen = false;
    let hidden = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden) engine.start();
      else engine.stop();
    };

    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new FloodType(canvas);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();

      // Resolve the real family name behind the CSS variable, then wait for the
      // face to load before laying out. Measuring against a fallback would size
      // every lockup wrong.
      if (document.fonts?.load) {
        const probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden";
        probe.style.fontFamily = `var(${FONT_VAR})`;
        probe.textContent = "Ag";
        document.body.appendChild(probe);
        const fam = getComputedStyle(probe)
          .fontFamily.split(",")[0]
          .replace(/["']/g, "")
          .trim();
        probe.remove();
        if (fam) {
          document.fonts
            .load(`${FONT_WEIGHT} 1em "${fam}"`)
            .then(
              () => engine?.setFont(`"${fam}", sans-serif`),
              () => {}
            );
        }
      }
    });

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      engine?.setPointer(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        ((e.clientY - r.top) / r.height) * 2 - 1
      );
    };
    const onLeave = () => engine?.clearPointer();

    // Never preventDefault here: the lean is decoration, not a control, and a
    // finger dragging across the card must still scroll the page.
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    canvas.addEventListener("pointerup", onLeave);

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.2 }
    );
    io.observe(canvas);

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => engine?.resize(), 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerup", onLeave);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      engine?.destroy();
    };
  }, []);

  return (
    <div
      className="floodcard"
      role="img"
      aria-label={
        label ??
        "A two word phrase falls in from above one letter at a time, holds still, then rushes forward until it overruns the frame with every letter turned to its own angle, and tumbles out of the bottom so the next phrase can fall in."
      }
      style={{ backgroundColor: PRESETS[0].bg }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
