/**
 * ULWILA Color Score Editor - Staff Symbols
 *
 * SVG path helpers and symbol definitions for musical notation.
 */

import type { Duration } from "../models/types";

/**
 * Treble clef (G clef) SVG path.
 * Single continuous stroke path — a vertical line with a lower curl (G-line loop)
 * and an upper S-curve, resembling a stylized treble clef.
 * Origin (0,0) sits on the G line (second line from bottom).
 * Spans from y≈-28 (top) to y≈+20 (bottom curl).
 */
export const TREBLE_CLEF_PATH =
  // Vertical spine from bottom curl up through the staff
  "M4,20 C4,16 0,14 0,10 C0,6 4,4 4,0 " +
  // Continue up through the staff
  "C4,-4 2,-8 2,-12 C2,-18 4,-24 8,-28 " +
  // Top curve back down
  "C10,-26 10,-22 8,-18 " +
  // S-curve back down through staff
  "C6,-14 2,-10 2,-6 C2,-2 4,0 8,0 " +
  // G-line curl (the characteristic loop)
  "C12,0 14,-2 14,-6 C14,-10 10,-12 6,-12 " +
  "C2,-12 0,-10 0,-6 " +
  // Bottom descender
  "C0,-2 2,2 4,6 C6,10 6,14 4,18 C2,22 -2,22 -2,18";

/**
 * Bass clef (F clef) SVG path — just the curved body, no dots.
 * Origin (0,0) is at the F line (second from top). Dots rendered separately.
 */
export const BASS_CLEF_PATH =
  "M0,0 C4,-2 10,-6 12,-12 C14,-18 10,-22 4,-22 " +
  "C-2,-22 -4,-16 -4,-12 C-4,-6 0,0 6,4 C10,6 14,10 14,14";

/** Vertical offset of bass clef dots from the F line (second line from top). */
export const BASS_CLEF_DOT_OFFSETS = { dot1Y: -8, dot2Y: -2, dotX: 18, dotR: 2 };

/**
 * Rest symbol paths for each duration.
 * Sized to be clearly visible on the staff (roughly 8-20px tall).
 */
export const REST_SYMBOLS: Record<Duration, string> = {
  // Whole rest: filled rectangle hanging below the 4th line
  whole: "M-7,-5 L7,-5 L7,0 L-7,0 Z",
  // Half rest: filled rectangle sitting on the 3rd line
  half: "M-7,0 L7,0 L7,5 L-7,5 Z",
  // Quarter rest: stylized lightning bolt / zigzag
  quarter:
    "M3,-10 L-3,-4 L3,0 L-3,4 L3,10 " +
    "L1,10 L-5,4 L1,0 L-5,-4 L1,-10 Z",
  // Eighth rest: filled dot + curved flag + stem
  eighth:
    "M3,-6 A2,2 0 1,0 3,-5.99 Z " +
    "M3,-5 C5,-5 8,-8 8,-10 " +
    "M2,-4 L0,10",
  // Sixteenth rest: two filled dots + two curved flags + stem
  sixteenth:
    "M3,-6 A2,2 0 1,0 3,-5.99 Z " +
    "M3,-5 C5,-5 8,-8 8,-10 " +
    "M3,0 A2,2 0 1,0 3,0.01 Z " +
    "M3,1 C5,1 8,-2 8,-4 " +
    "M2,-4 L-1,14",
};

/**
 * Render a notehead as an SVG ellipse.
 * @param filled - Whether the notehead should be filled (quarter notes and shorter)
 * @returns SVG element parameters
 */
export function renderNotehead(filled: boolean): { rx: number; ry: number; filled: boolean } {
  return {
    rx: 6,
    ry: filled ? 4.5 : 5,
    filled,
  };
}

/**
 * Determine if a note should have a filled notehead based on duration.
 */
export function isNoteheadFilled(duration: Duration): boolean {
  return duration === "quarter" || duration === "eighth" || duration === "sixteenth";
}

/**
 * Determine if a note should have a stem based on duration.
 */
export function hasStem(duration: Duration): boolean {
  return duration !== "whole";
}

/**
 * Get the number of flags for a note based on duration.
 */
export function getFlagCount(duration: Duration): number {
  if (duration === "eighth") return 1;
  if (duration === "sixteenth") return 2;
  return 0;
}
