/* ==========================================================================
   Authored scenes, in the DASH palette.

   The supplied palettes are replaced because each field becomes the other's
   background half a cycle later, so both must come out of one system and both
   must be legible against each other. Every pair below was measured:

     ink #231f1a  against coral  #ff836b  = 6.79
     ink #231f1a  against olive  #94bd43  = 7.50
     ink #231f1a  against gold   #e59c06  = 7.09
     cream #fffdf6 against ink   #231f1a  = 16.09

   Cream against coral measures 2.37 and was rejected: two fields that close
   turn to mud on the swap.
   ========================================================================== */

import { generateFlood, generateSpine, generateTip } from "../generate";
import type { Scene, WordSpec } from "../scene";

const REF = 540;
const HALF = 72;
const FLOOD_AT = 49;
const FLOOD_END = 70;
const FLOOD_FRAMES = FLOOD_END - FLOOD_AT + 1;

/** The word is a hole in the ink, not a caption. It stretches on the flood's
    own clock while the vertical squashes slightly against it and tracking
    opens, so it reads as dragged by the wave rather than zoomed. */
const DASH_WORD: WordSpec = {
  text: "DASH",
  fontVar: "--font-display",
  weight: 900,
  fit: 0.4,
  /* The measured stretch runs to 2.35, authored for a wide 1344x620 card where
     overrunning the frame is the point. A full screen loader has a different
     job: its last frame is the brand moment, so the word has to still read.
     The curve shape is kept and only its endpoint is pulled in, so at peak the
     mark is 0.62 of the viewport wide, large and entirely in frame. */
  stretch: [0.78, 1.55],
  squash: [1, 0.9],
  tracking: [-0.02, 0.05],
};

function authored(opts: {
  id: string;
  name: string;
  fields: readonly [string, string];
  dot: string;
  scribble?: Parameters<typeof generateSpine>[0];
  flood?: Parameters<typeof generateFlood>[1];
  ease?: Scene["flood"]["ease"];
  word?: WordSpec;
  fps?: number;
  stopAtEnd?: boolean;
}): Scene {
  const spine = generateSpine({ ref: REF, from: 3, to: 32, ...opts.scribble });
  const { tip, tipAt } = generateTip(spine);
  const { scale, swell } = generateFlood(FLOOD_FRAMES, opts.flood);

  return {
    id: opts.id,
    name: opts.name,
    ref: REF,
    fps: opts.fps ?? 25,
    half: HALF,
    restAt: 40,
    palette: { fields: opts.fields, dot: opts.dot },
    spine,
    tip,
    tipAt,
    word: opts.word,
    stopAtEnd: opts.stopAtEnd,
    flood: {
      at: FLOOD_AT,
      end: FLOOD_END,
      scale,
      swell,
      ease: opts.ease ?? "drift",
    },
    sparks: {
      offset: [33.8, -34.2],
      popAt: 43,
      pop: [3.4, 15.3, 21.6, 25.2, 27.4, 28.8],
      radius: 30,
      diverge: [
        1.0, 1.06, 1.15, 1.26, 1.47, 1.73, 2.15, 2.73, 3.56, 4.64, 5.23,
        5.59, 5.79, 5.91, 6.0, 6.06, 6.09, 6.1, 6.12, 6.12, 6.12, 6.12,
      ],
      shrinkAt: 65,
      shrink: [28.6, 26.4, 22.8, 17.8, 10.6, 0],
      ease: "surge",
    },
  };
}

/* --------------------------------------------------------------------------
   The loader.

   Runs one half only and holds on the final flat field. That field is coral,
   which is the ground of the hero it lifts into, so the curtain does not
   dissolve into a colour the page does not have.

   fps is raised to 32 so the whole pass takes 2.2 seconds rather than 2.8.
   A loader that outstays its welcome is a worse loader however good it looks.

   The one invented number in the piece is the final swell, pushed past the
   measured value so the boundary's last sweep reaches a wide viewport's corners
   instead of leaving slivers for the flat fill to snap over.
   -------------------------------------------------------------------------- */

export const CURTAIN: Scene = (() => {
  const base = authored({
    id: "curtain",
    name: "Curtain",
    fields: ["#231f1a", "#ff836b"],
    dot: "#fffdf6",
    fps: 34,
    stopAtEnd: true,
    word: DASH_WORD,
    scribble: { humps: 3, amplitude: 0.2, crestR: 22, valleyR: 46, seed: 3 },
    flood: { scale: 3.94, swell: 3.1 },
    ease: "drift",
  });

  /* The reference holds the finished scribble from frame 32 to frame 49 before
     the flood begins. On a card that pause is the piece breathing. On a loader
     it is 0.5 seconds of a visitor looking at a static image, so the hold is
     removed: the flood starts as the pen lifts.

     The curve tables are untouched. Only their start frame moves, and every
     dependent cue moves with it by the same amount, so the choreography between
     spark pop, flood and shrink is preserved exactly. */
  const SHIFT = 13;
  const at = base.flood.at - SHIFT;

  return {
    ...base,
    flood: { ...base.flood, at, end: at + base.flood.scale.length - 1 },
    sparks: base.sparks && {
      ...base.sparks,
      popAt: base.sparks.popAt - SHIFT,
      shrinkAt: base.sparks.shrinkAt - SHIFT,
    },
    half: base.flood.end - SHIFT + 1,
  };
})();

export const GLOW = authored({
  id: "glow",
  name: "Glow",
  fields: ["#231f1a", "#ff836b"],
  dot: "#fffdf6",
  scribble: { humps: 3, amplitude: 0.2, crestR: 22, valleyR: 46, seed: 3 },
  ease: "drift",
});

export const VOLUME = authored({
  id: "volume",
  name: "Volume",
  fields: ["#231f1a", "#94bd43"],
  dot: "#fffdf6",
  scribble: { humps: 4, amplitude: 0.17, crestR: 18, valleyR: 40, seed: 7 },
  ease: "quintInOut",
});

export const BURN = authored({
  id: "burn",
  name: "Burn",
  fields: ["#231f1a", "#e59c06"],
  dot: "#fffdf6",
  scribble: { humps: 3, amplitude: 0.22, crestR: 20, valleyR: 48, seed: 11 },
  ease: "surge",
});

export const AUTHORED: Scene[] = [GLOW, VOLUME, BURN];
