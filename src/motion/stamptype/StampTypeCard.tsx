/* ==========================================================================
   Stamp type: the mounted card.

   The supplied component was truncated partway through its cleanup, so the
   lifecycle below is written to match the flood type card exactly: the same
   observer, visibility and resize handling, the same font probe, and a full
   teardown. The view-transition dependency is dropped, as this project uses the
   native View Transitions API rather than a transition bus.
   ========================================================================== */

import { useEffect, useRef } from "react";
import { StampType } from "./engine";
import { WORLDS } from "./params";

export function StampTypeCard({ label }: { label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: StampType | null = null;
    let onScreen = false;
    let hidden = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden) engine.start();
      else engine.stop();
    };

    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new StampType(canvas);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();

      if (document.fonts?.load) {
        const probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden";
        probe.style.fontFamily = "var(--font-body)";
        probe.textContent = "Ag";
        document.body.appendChild(probe);
        const fam = getComputedStyle(probe)
          .fontFamily.split(",")[0]
          .replace(/["']/g, "")
          .trim();
        probe.remove();
        if (fam) {
          document.fonts.load(`600 1em "${fam}"`).then(
            () => engine?.setFont(`"${fam}", sans-serif`),
            () => {}
          );
        }
      }
    });

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
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      engine?.destroy();
    };
  }, []);

  return (
    <div
      className="stampcard"
      role="img"
      aria-label={
        label ??
        "Four lines of type on flat colour bars fly in from the edges one axis at a time, park to be read, then scatter off, printing a trail of their own silhouettes as they go, while the next set of lines and the next palette arrive."
      }
      style={{ backgroundColor: WORLDS[0].bg }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
