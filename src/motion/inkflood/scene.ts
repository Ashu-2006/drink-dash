/* ==========================================================================
   Ink flood: the scene contract.

   The renderer holds no numbers. Every look, whether measured off a reference
   clip or authored from scratch, is one Scene object fed to the same code path.

   Extended from the supplied contract in two places, both additive and both
   marked: `word` (the knockout described in the brief but absent from the
   supplied engine) and `stopAtEnd` (needed to run the loop once as a curtain
   rather than forever as a card).
   ========================================================================== */

export type SpineSample = readonly [x: number, y: number, r: number, frame: number];

export type TipSample = readonly [x: number, y: number, r: number];

export type EaseName =
  | "linear"
  | "measured"
  | "expoOut"
  | "expoIn"
  | "quintInOut"
  | "sineInOut"
  | "drift"
  | "surge";

export interface Palette {
  /** Each field becomes the other's background half a cycle later, so the two
      must be legible against each other. Two mid tones of similar luminance
      turn to mud on the swap. */
  fields: readonly [string, string];
  dot: string;
  accent?: string;
}

export interface FloodSpec {
  at: number;
  end: number;
  /** The zoom curve. */
  scale: readonly number[];
  /** The stroke width MULTIPLIER, on its own later curve. Multiplying, not
      adding: the fat valleys visibly swell faster than the thin crests. */
  swell: readonly number[];
  ease: EaseName;
}

export interface SparkSpec {
  offset: readonly [number, number];
  popAt: number;
  pop: readonly number[];
  radius: number;
  /** A third, faster curve. The sparks do not scale with the scene, which is
      exactly why they read as thrown off the wave. */
  diverge: readonly number[];
  shrinkAt: number;
  shrink: readonly number[];
  ease: EaseName;
}

/** ADDITION to the supplied contract.

    The brief specifies the word as a hole in the ink: knocked out with
    destination-out compositing on a separate ink layer, so letters show
    whatever field lies beneath and are revealed BY the flood rather than drawn
    over it. The supplied engine renders no text, so this is authored here. */
export interface WordSpec {
  text: string;
  /** CSS custom property holding the family. Canvas ctx.font IGNORES CSS
      variables: the assignment silently fails and the context keeps 10px sans
      serif. Must be resolved through getComputedStyle first. */
  fontVar: string;
  weight: number;
  /** Fraction of the reference square the word occupies at rest. */
  fit: number;
  /** Horizontal stretch across the flood, on the flood's own clock. */
  stretch: readonly [number, number];
  /** Vertical squash, against the stretch, so it reads as dragged not zoomed. */
  squash: readonly [number, number];
  /** Tracking opens as it stretches, in ems. */
  tracking: readonly [number, number];
}

export interface Scene {
  id: string;
  name: string;

  ref: number;
  fps: number;

  half: number;
  palette: Palette;

  spine: readonly SpineSample[];

  tip?: readonly TipSample[];
  tipAt: number;
  flood: FloodSpec;
  sparks?: SparkSpec;
  word?: WordSpec;

  restAt: number;

  /** ADDITION. When true the engine holds on the final flat field instead of
      looping, which is what a curtain needs. */
  stopAtEnd?: boolean;
}
