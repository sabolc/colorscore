/**
 * ULWILA Color Score Editor - Color Constants
 *
 * This module defines the ULWILA color mapping for musical pitches.
 * Each pitch is assigned a specific color according to the ULWILA system.
 */

import type { Pitch } from "../models/types";

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
