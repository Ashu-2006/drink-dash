import { MEASURED } from "./measured";
import { AUTHORED, BURN, CURTAIN, GLOW, VOLUME } from "./authored";
import type { Scene } from "../scene";

export { MEASURED, CURTAIN, GLOW, VOLUME, BURN };

/** The measured motion, in the DASH palette, with the wordmark knocked out.
    One scene definition; the flip transform handles the mirrored half. */
export const DASH_SCENE: Scene = {
  ...GLOW,
  spine: MEASURED.spine,
  tip: MEASURED.tip,
  tipAt: MEASURED.tipAt,
  flood: MEASURED.flood,
  sparks: MEASURED.sparks,
  word: CURTAIN.word,
};

export const DEFAULT_SCENE = DASH_SCENE;

export const SCENES: Scene[] = [MEASURED, ...AUTHORED];

export function sceneById(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}
