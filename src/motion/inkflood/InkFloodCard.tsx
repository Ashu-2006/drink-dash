/* ==========================================================================
   Ink flood: mounted components.

   Two of them, one engine:
   - InkFloodCard, the looping card
   - InkFloodCurtain, the page loader, which runs one pass and holds on the
     final flat field

   The view-transition dependency from the supplied component is dropped, since
   this project uses the native View Transitions API rather than a transition
   bus.
   ========================================================================== */

import { useEffect, useRef } from "react";
import { InkFlood } from "./engine";
import { CURTAIN, DEFAULT_SCENE } from "./presets";
import type { Scene } from "./scene";

/* -------------------------------------------------------------------------- */

export function InkFloodCard({ scene = DEFAULT_SCENE }: { scene?: Scene } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<InkFlood | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: InkFlood | null = null;
    let onScreen = false;
    let hidden = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden) engine.start();
      else engine.stop();
    };

    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new InkFlood(canvas, scene);
      engineRef.current = engine;
      if (!engine.ok) return;
      // One static frame, the resting scribble, under reduced motion.
      if (reduced) engine.renderStill();
      else sync();
      // A size fitted before the webfont loads is wrong forever, so re-render
      // once the faces have settled.
      document.fonts?.ready.then(() => engine?.renderStill()).catch(() => {});
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
      engineRef.current = null;
      engine?.destroy();
    };
  }, []);

  const mounted = useRef(scene);
  useEffect(() => {
    if (mounted.current === scene) return;
    mounted.current = scene;
    engineRef.current?.setScene(scene);
  }, [scene]);

  return (
    <div
      className="inkcard"
      role="img"
      aria-label="A pen writes a thick scribble across a dark field, the scribble swells until its ink floods the whole card, and the word DASH is revealed as a hole punched through the ink."
      style={{ backgroundColor: scene.palette.fields[0] }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** The page loader. One pass, holding on the final flat field, which is the
    colour of the hero it lifts into. */
export function InkFloodCurtain({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion never reaches here: Intro skips the curtain entirely.
    // This is kept as a guard in case the component is mounted directly.
    if (reduced) {
      onDone();
      return;
    }

    let engine: InkFlood | null = null;
    // Never trap the visitor behind the curtain. If anything stalls, the page
    // opens anyway.
    const failsafe = window.setTimeout(onDone, 4200);

    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new InkFlood(canvas, CURTAIN, {
        onComplete: () => {
          window.clearTimeout(failsafe);
          onDone();
        },
      });
      if (!engine.ok) {
        window.clearTimeout(failsafe);
        onDone();
        return;
      }
      engine.start();
    });

    const onResize = () => engine?.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      window.removeEventListener("resize", onResize);
      engine?.destroy();
    };
  }, [onDone]);

  return <canvas ref={canvasRef} className="curtain__canvas" aria-hidden="true" />;
}
