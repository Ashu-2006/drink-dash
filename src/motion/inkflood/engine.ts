/* ==========================================================================
   Ink flood: engine.

   Supplied implementation, with two additions, both marked:

   1. THE WORD KNOCKOUT. The brief specifies the word as a hole in the ink,
      knocked out with destination-out compositing on a separate ink layer, so
      letters show whatever field lies beneath and are revealed BY the flood
      rather than drawn over it. The supplied engine renders no text at all, so
      it is authored here, including both silent traps the brief names.

   2. stopAtEnd plus onComplete, so the same code path can run once as a
      curtain instead of forever as a card.
   ========================================================================== */

import { easeFn, sampleTable } from "./ease";
import { HALFTONE_DEFAULTS, drawHalftone, makeHalftoneTile } from "./halftone";
import { MEASURED } from "./presets/measured";
import type { Scene } from "./scene";

export class InkFlood {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;
  private scene: Scene;
  private tile: HTMLCanvasElement | null = null;

  /** ADDITION: a separate layer for the ink, so the word can be punched out of
      it without punching a hole in the background as well. */
  private layer: HTMLCanvasElement | null = null;

  /** ADDITION: the fitted font size, cached. Keyed on the font loading status,
      because a size fitted before the webfont loads is wrong forever. */
  private fitCache: { key: string; px: number } | null = null;
  private family = "sans-serif";

  private done = false;
  private onComplete?: () => void;

  readonly ok: boolean;

  private canvas: HTMLCanvasElement;

  constructor(
    canvas: HTMLCanvasElement,
    scene: Scene = MEASURED,
    opts: { onComplete?: () => void } = {}
  ) {
    this.canvas = canvas;
    this.scene = scene;
    this.onComplete = opts.onComplete;
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    if (this.ok) {
      this.resolveFamily();
      this.resize();
    }
  }

  /** TRAP ONE, and it is silent. Canvas ctx.font IGNORES CSS variables: the
      assignment fails, the context keeps 10px sans-serif, the word renders as a
      speck and nothing reports an error. The family has to be resolved through
      getComputedStyle before it ever reaches ctx.font. */
  private resolveFamily() {
    const w = this.scene.word;
    if (!w) return;
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden";
    probe.style.fontFamily = `var(${w.fontVar})`;
    probe.textContent = "Ag";
    document.body.appendChild(probe);
    const fam = getComputedStyle(probe).fontFamily;
    probe.remove();
    if (fam && fam !== "var(" + w.fontVar + ")") this.family = fam;
  }

  setScene(scene: Scene) {
    this.scene = scene;
    this.fitCache = null;
    this.done = false;
    this.resolveFamily();
    this.t0 = performance.now();
    if (!this.running) this.renderStill();
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);
    this.tile = null;
    this.layer = null;
    this.fitCache = null;
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      this.draw((now - this.t0) / 1000);
      if (this.done) return;
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(this.scene.restAt / this.scene.fps);
  }

  destroy() {
    this.stop();
    this.ctx = null;
    this.tile = null;
    this.layer = null;
  }

  /** Between keyframes a fast dot travels far enough that a plain circle
      strobes, so dots are drawn as a capsule from where they just were to where
      they are, centred on the moment. The clip's own frame blending. */
  private capsule(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    r: number
  ) {
    if (r <= 0) return;
    ctx.beginPath();
    if (Math.hypot(x1 - x0, y1 - y0) < 0.5) {
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.lineWidth = r * 2;
      ctx.lineCap = "round";
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  /** The stroke is the pen's trail, not a revealed path: the ink is simply
      every dab the brush has laid. Dab spacing is tied to the local radius
      (0.4r keeps boundary ripple under 2 percent of r), so the flood never
      multiplies the dab count as it scales. */
  private stampInk(ctx: CanvasRenderingContext2D, u: number, k: number) {
    const { spine } = this.scene;
    for (let i = 0; i < spine.length - 1; i++) {
      const [ax, ay, ar, af] = spine[i];
      if (af > u) break;
      const [bx, by, br, bf] = spine[i + 1];

      const seg = bf <= u ? 1 : (u - af) / (bf - af);
      const dist = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.ceil((dist * seg) / Math.max(2, ar * k * 0.4)));
      for (let j = 0; j <= n; j++) {
        const t = (j / n) * seg;
        const r = (ar + (br - ar) * t) * k;
        ctx.beginPath();
        ctx.arc(ax + (bx - ax) * t, ay + (by - ay) * t, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /** The reference square maps onto the card's height, centred, uniform scale.
      The path is never stretched to the card: this is handwriting, and
      stretching mangles it. The flat background and the flood own the extra
      width. */
  private toScene(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    flip: boolean
  ) {
    const { ref } = this.scene;
    ctx.translate(W / 2, H / 2);
    if (flip) ctx.scale(-1, 1);
    const hs = H / ref;
    ctx.scale(hs, hs);
    ctx.translate(-ref / 2, -ref / 2);
  }

  private screen(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const o = HALFTONE_DEFAULTS;
    if (!this.tile) this.tile = makeHalftoneTile(o.pitch, o.radius, this.dpr);
    drawHalftone(ctx, this.tile, W, H, this.dpr, o.alpha);
  }

  /** ADDITION: fit the word once, cached on the font loading status.
      TRAP TWO, also silent: a size fitted before the webfont loads is wrong
      forever, so the cache key carries document.fonts.status. */
  private fitWord(ctx: CanvasRenderingContext2D, W: number): number {
    const w = this.scene.word!;
    const status = typeof document !== "undefined" ? document.fonts?.status : "loaded";
    const key = `${w.text}|${w.weight}|${Math.round(W)}|${status}|${this.family}`;
    if (this.fitCache?.key === key) return this.fitCache.px;

    const target = W * w.fit;
    let px = 100;
    ctx.font = `${w.weight} ${px}px ${this.family}`;
    const at100 = ctx.measureText(w.text).width || 1;
    px = (target / at100) * 100;

    this.fitCache = { key, px };
    return px;
  }

  /** ADDITION: the word as a hole in the ink.

      Drawn with destination-out on the ink layer, so it removes ink rather than
      adding paint. Where the ink has not reached yet, the letters do not exist
      yet, which is the whole point: they are revealed BY the flood. */
  private punchWord(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    t: number
  ) {
    const w = this.scene.word;
    if (!w) return;

    const px = this.fitWord(ctx, W);
    const stretch = w.stretch[0] + (w.stretch[1] - w.stretch[0]) * t;
    const squash = w.squash[0] + (w.squash[1] - w.squash[0]) * t;
    const track = w.tracking[0] + (w.tracking[1] - w.tracking[0]) * t;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.font = `${w.weight} ${px}px ${this.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";

    ctx.translate(W / 2, H / 2);
    ctx.scale(stretch, squash);

    // Tracking has to be walked per glyph: canvas letterSpacing is not
    // universally supported and silently does nothing where it is not.
    const chars = [...w.text];
    const gap = px * track;
    let total = 0;
    for (const c of chars) total += ctx.measureText(c).width;
    total += gap * (chars.length - 1);

    let pen = -total / 2;
    ctx.textAlign = "left";
    for (const c of chars) {
      ctx.fillText(c, pen, 0);
      pen += ctx.measureText(c).width + gap;
    }
    ctx.restore();
  }

  private draw(time: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = this.scene;
    const { dpr } = this;
    const W = this.canvas.width / dpr;
    const H = this.canvas.height / dpr;
    if (W <= 0 || H <= 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const halfSecs = s.half / s.fps;
    const total = s.stopAtEnd ? Math.min(time, halfSecs * 2) : time % (halfSecs * 2);
    const second = !s.stopAtEnd && total >= halfSecs;
    const u = (total - (second ? halfSecs : 0)) * s.fps;
    const [fieldA, fieldB] = s.palette.fields;
    const bg = second ? fieldB : fieldA;
    const ink = second ? fieldA : fieldB;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // The loop is a colour swap, not a reset: each half ends as a flat field of
    // its ink colour, which is precisely the background the mirrored second
    // half draws on.
    if (u >= s.flood.end) {
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, W, H);
      if (s.word) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        this.punchWord(ctx, W, H, 1);
        ctx.restore();
        // Repaint the ground through the hole.
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      this.screen(ctx, W, H);
      if (s.stopAtEnd && !this.done) {
        this.done = true;
        this.running = false;
        this.onComplete?.();
      }
      return;
    }

    const flooding = u >= s.flood.at;
    const fe = easeFn(s.flood.ease);
    const zoom = flooding ? sampleTable(s.flood.scale, s.flood.at, u, fe) : 1;
    const k = flooding ? sampleTable(s.flood.swell, s.flood.at, u, fe) : 1;
    const floodT = flooding
      ? Math.min(1, (u - s.flood.at) / (s.flood.end - s.flood.at))
      : 0;

    // ---- ink layer, so the word can be punched out of it alone -------------
    let target = ctx;
    if (s.word) {
      if (!this.layer) {
        this.layer = document.createElement("canvas");
      }
      if (this.layer.width !== this.canvas.width || this.layer.height !== this.canvas.height) {
        this.layer.width = this.canvas.width;
        this.layer.height = this.canvas.height;
      }
      const lg = this.layer.getContext("2d")!;
      lg.setTransform(1, 0, 0, 1, 0, 0);
      lg.clearRect(0, 0, this.layer.width, this.layer.height);
      lg.setTransform(dpr, 0, 0, dpr, 0, 0);
      target = lg;
    }

    target.save();
    this.toScene(target, W, H, second);
    target.translate(s.ref / 2, s.ref / 2);
    target.scale(zoom, zoom);
    target.translate(-s.ref / 2, -s.ref / 2);
    target.fillStyle = ink;
    this.stampInk(target, u, k);
    target.restore();

    if (s.word && target !== ctx) {
      this.punchWord(target, W, H, floodT);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.layer!, 0, 0);
      ctx.restore();
    }

    // ---- sparks and pen tip, always on the visible context -----------------
    ctx.save();
    this.toScene(ctx, W, H, second);
    ctx.fillStyle = s.palette.dot;
    ctx.strokeStyle = s.palette.dot;

    const sp = s.sparks;
    if (sp && u >= sp.popAt) {
      const se = easeFn(sp.ease);
      const rNow =
        u < s.flood.at
          ? sampleTable(sp.pop, sp.popAt, u, se)
          : u < sp.shrinkAt
            ? sp.radius
            : sampleTable(sp.shrink, sp.shrinkAt, u, se);

      const div = (v: number) =>
        v < s.flood.at ? 1 : sampleTable(sp.diverge, s.flood.at, v, se);
      const now = div(u + 0.5);
      const was = div(Math.max(u - 0.5, sp.popAt));
      const c = s.ref / 2;
      for (const sign of [1, -1]) {
        this.capsule(
          ctx,
          c + sign * sp.offset[0] * was,
          c + sign * sp.offset[1] * was,
          c + sign * sp.offset[0] * now,
          c + sign * sp.offset[1] * now,
          rNow
        );
      }
    }

    if (s.tip && u >= s.tipAt && u < s.tipAt + s.tip.length) {
      const [x, y, r] = this.tipPos(u);
      if (r > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    this.screen(ctx, W, H);
  }

  private tipPos(u: number): [number, number, number] {
    const tip = this.scene.tip!;
    const k = Math.min(Math.max(u - this.scene.tipAt, 0), tip.length - 1);
    const i = Math.min(Math.floor(k), tip.length - 2);
    const t = k - i;
    const a = tip[i];
    const b = tip[i + 1];
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }
}
