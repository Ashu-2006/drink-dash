/* ==========================================================================
   Flood type: parameters.

   Curves, timings and constants are as supplied. Only the presets are changed,
   because a piece running on the DASH site should say DASH words rather than
   design vocabulary, and its two colour worlds must come out of the DASH
   palette.

   Every pair below was checked numerically, not by eye. All clear 5:1, which
   matters because at peak scale the ink covers most of the frame and the ground
   survives only as counters and slivers.
   ========================================================================== */

export const FPS = 30;

export const HOLD_TICKS = 10;

export const ENTER_TICKS = 14;

export const ENTER_STAGGER = 3;

export const ENTER_RISE = 1.3;

export const ENTER_TURN = 95;

export const TURN_LAG = 2.5;

const SHIFT = ENTER_TICKS + ENTER_STAGGER;

export const LEAD_START = 9 + SHIFT;

export const LEAD_TICKS = 10;

export const ZOOM_START = 12 + SHIFT;
export const ZOOM_TICKS = 22;

export const ESCAPE_START = ZOOM_START + 18;
export const ESCAPE_TICKS = 15;

export const CYCLE_TICKS = ESCAPE_START + ESCAPE_TICKS;

export const SCALE_TABLE = [
  0.0, 0.008, 0.02, 0.04, 0.075, 0.14, 0.29, 0.56, 0.8, 0.94, 1.02, 1.058,
  1.045, 1.022, 1.006, 1.0,
] as const;

export const ROT_TABLE = [
  0.0, 0.0, 0.08, 0.269, 0.461, 0.613, 0.715, 0.804, 0.865, 0.918, 0.941,
  0.968, 0.99, 1.0,
] as const;

export const LEAD_TABLE = [1.0] as const;

export const LEAD_PIVOT = 0.81;

export const LEAD_REST = 1.0;

export const ENTER_TABLE = [
  0.0, 0.021, 0.052, 0.104, 0.196, 0.372, 0.632, 0.826, 0.951, 1.021, 1.043,
  1.032, 1.013, 1.0,
] as const;

export const FALL_TABLE = [
  0.0, 0.01, 0.022, 0.036, 0.057, 0.085, 0.122, 0.169, 0.226, 0.302, 0.407,
  0.555, 0.778, 1.0,
] as const;

export const PEAK_SCALE = 2.2;

export const SPIN_MAX = 95;

export const SPIN_TAIL = 2.6;

export const ESCAPE_SPIN_MAX = 130;

export const EDGE_CULL = 0.02;

export const TUMBLE_MAX = 200;

export const FALL_SPREAD = 0.16;

export const DEPTH_SPREAD = 0.08;

export const DEPTH_AT_REST = 0.35;

export const FLOOD_SQUEEZE = -0.1;

export const FOCUS_DRIFT = 0;

export const SMEAR_STEPS = 3;

export const SMEAR_MIN_SPEED = 0.018;

export const SMEAR_REACH = 0.85;

export const PULL = 0.055;

export const PULL_EASE = 0.13;

export const HOLD_STRETCH = 34;

/* The body face at a light weight, per the brief: a thin word growing enormous
   reads as type at peak, where a heavy one reads as a blob. General Sans ships
   200 to 700, so 400 is a real weight and the browser never synthesises a fake
   bold by smearing stems. */
export const FONT_VAR = "--font-body";
export const FONT_WEIGHT = 400;

export const PITCH_OVER_CAP = 1.084;

export const TRACK_REST = -0.035;

export const TRACK_ZOOM = -0.062;

export const TARGET_WIDTH = 0.68;

export const MAX_CAP = 0.3;

export interface Preset {
  lines: [string, string];
  bg: string;
  ink: string;
  spin: number;
}

/* Two-word lockups from the brand's own vocabulary. The second line is set
   longer than the first wherever possible, so the lockup sits as a trapezoid.

   Contrast, measured: coral on ink 6.79, ink on coral 6.79, ink on olive 7.50,
   ink on gold 7.09, deep coral on cream 5.71, olive on ink 7.50. */
export const PRESETS: Preset[] = [
  { lines: ["Skin", "Glow"], bg: "#231f1a", ink: "#ff836b", spin: 1 },
  { lines: ["Hair", "Growth"], bg: "#231f1a", ink: "#94bd43", spin: 1.15 },
  { lines: ["One", "Shot"], bg: "#ff836b", ink: "#231f1a", spin: 0.55 },
  { lines: ["Daily", "Ritual"], bg: "#94bd43", ink: "#231f1a", spin: 0.85 },
  { lines: ["Sixty", "Millilitres"], bg: "#e59c06", ink: "#231f1a", spin: 1.3 },
  { lines: ["Named", "Doses"], bg: "#fffdf6", ink: "#9e4e3f", spin: 0.7 },
];

export function sample(table: readonly number[], u: number): number {
  if (!(u > 0)) return table[0];
  if (u >= 1) return table[table.length - 1];

  // A one entry table is a legitimate way to disable a curve. A naive lerp
  // would read past the end and return NaN, which blanks the canvas.
  if (table.length < 2) return table[0];
  const x = u * (table.length - 1);
  const i = Math.floor(x);
  return table[i] + (table[i + 1] - table[i]) * (x - i);
}
