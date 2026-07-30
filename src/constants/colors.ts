/**
 * ULWILA Color Score Editor - Color Constants
 *
 * This module defines the ULWILA color mapping for musical pitches.
 * Each pitch is assigned a specific color according to the ULWILA system.
 */

import type { Octave, Pitch } from "../models/types";

/**
 * ULWILA color mapping for musical pitches.
 * Each pitch maps to a specific hex color value.
 */
export const ULWILA_COLORS: Record<Pitch, string> = {
  C: "#1A1A1A", // Black
  D: "#8B4513", // Brown
  E: "#0000CD", // Blue
  F: "#228B22", // Green
  G: "#DC143C", // Red
  A: "#FF8C00", // Orange
  H: "#FFD700", // Yellow/Gold
};

/**
 * Array of all pitch names in the ULWILA system.
 */
export const PITCH_NAMES: Pitch[] = ["C", "D", "E", "F", "G", "A", "H"];

/**
 * Pitches that have a sharp (black piano key above them).
 * E and H have no sharp — E→F and H→C are natural half-steps.
 */
export const ACCENTED_PITCHES: Pitch[] = ["C", "D", "F", "G", "A"];

/**
 * For an accented (sharp) note, returns the two colors for the semicircle
 * rendering: left = the note's own color, right = the next higher pitch's color.
 */
export function getAccentedColors(pitch: Pitch): { left: string; right: string } {
  const NEXT_PITCH: Partial<Record<Pitch, Pitch>> = {
    C: "D",
    D: "E",
    F: "G",
    G: "A",
    A: "H",
  };

  const nextPitch = NEXT_PITCH[pitch];
  if (!nextPitch) {
    // E and H have no sharp — fallback to same color for both halves
    return { left: ULWILA_COLORS[pitch], right: ULWILA_COLORS[pitch] };
  }
  return { left: ULWILA_COLORS[pitch], right: ULWILA_COLORS[nextPitch] };
}

/** Fill color of the octave indicator dot, per octave. */
export const OCTAVE_DOT_FILL: Record<Octave, string | null> = {
  lower: "#000000",
  middle: null, // middle octave has no dot
  upper: "#FFFFFF",
};

/**
 * Halo ring color per dot fill. The halo is the opposite of the dot, so it
 * separates the dot from the note color while staying visible against the dot
 * itself.
 */
export const OCTAVE_DOT_HALO: Record<string, string> = {
  "#000000": "#FFFFFF",
  "#FFFFFF": "#333333",
};

/**
 * Minimum contrast ratio between the dot and the note color below which the
 * dot needs a halo ring to stay visible.
 */
const DOT_CONTRAST_THRESHOLD = 2.5;

/** Relative luminance of a #rrggbb color, per WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => {
    const srgb = parseInt(value.slice(i, i + 2), 16) / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Contrast ratio between two #rrggbb colors, per WCAG 2.1 (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Style of the octave indicator dot for a given pitch and octave.
 *
 * Returns null for the middle octave, which carries no dot. Otherwise returns
 * the dot fill plus an optional halo ring color. The halo is needed when the
 * dot would otherwise disappear into the note color — the black lower-octave
 * dot on the near-black C, or the white upper-octave dot on the yellow H. The
 * ULWILA source figure draws exactly this: the low C is a black dot separated
 * from the black circle by a white ring (Bakos 2014, Melléklet 1. ábra).
 */
export function getOctaveDotStyle(
  pitch: Pitch,
  octave: Octave
): { fill: string; halo: string | null } | null {
  const fill = OCTAVE_DOT_FILL[octave];
  if (!fill) return null;

  const noteColor = ULWILA_COLORS[pitch];
  if (contrastRatio(fill, noteColor) >= DOT_CONTRAST_THRESHOLD) {
    return { fill, halo: null };
  }

  return { fill, halo: OCTAVE_DOT_HALO[fill] ?? null };
}

/**
 * @deprecated NOTE_LABELS moved to i18n translation dictionaries.
 * Use useTranslation().t.noteLabels instead.
 * Kept temporarily for backward compatibility during migration.
 */
export const NOTE_LABELS: Record<Pitch, string> = {
  C: "C (Do)",
  D: "D (Ré)",
  E: "E (Mi)",
  F: "F (Fa)",
  G: "G (Sol)",
  A: "A (La)",
  H: "H (Si)",
};
