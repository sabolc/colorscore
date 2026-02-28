/**
 * ULWILA Color Score Editor - Staff Layout Computation
 *
 * Pure layout computation module. Given a Score and canvas width, compute positions.
 */

import type { Score, NoteOrRest, Pitch, Octave, Clef, Duration } from "../models/types";

export interface LayoutConfig {
  canvasWidth: number;
  staffLineSpacing: number; // default 10px between lines
  noteSpacing: number; // default 30px between notes
  marginLeft: number; // default 60px (space for clef + time sig)
  marginTop: number; // default 40px
  staffHeight: number; // 4 * staffLineSpacing (5 lines, 4 gaps)
  systemSpacing: number; // space between wrapped staff systems, default 80px
}

export interface NoteLayout {
  x: number;
  y: number; // y position on staff (based on pitch + octave)
  noteIndex: number;
  partIndex: number;
  isRest: boolean;
  octave?: Octave; // octave register (used for stem direction)
}

export interface StaffSystem {
  startX: number;
  startY: number;
  notes: NoteLayout[];
  barLines: number[]; // x positions
}

export interface StaffLayout {
  systems: StaffSystem[];
  config: LayoutConfig;
}

const DEFAULT_CONFIG: LayoutConfig = {
  canvasWidth: 800,
  staffLineSpacing: 10,
  noteSpacing: 30,
  marginLeft: 60,
  marginTop: 40,
  staffHeight: 40, // 4 * 10
  systemSpacing: 80,
};

/**
 * Duration to beats conversion based on standard musical notation.
 */
const DURATION_TO_BEATS: Record<Duration, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
};

/**
 * Convert pitch and octave to staff position.
 * Returns a number where 0 = bottom line of staff.
 * Each position unit is half a staffLineSpacing (one step = half the line-to-line distance).
 *
 * For treble clef positions (bottom line = E):
 * - Lower octave: C=−2, D=−1, E=0, F=1, G=2, A=3, H(B)=4
 * - Middle octave: C=5, D=6, E=7, F=8, G=9, A=10, H(B)=11
 * - Upper octave: C=12, D=13, E=14, F=15, G=16, A=17, H(B)=18
 *
 * For bass clef positions (bottom line = G):
 * - Lower octave: C=−4, D=−3, E=−2, F=−1, G=0, A=1, H(B)=2
 * - Middle octave: C=3, D=4, E=5, F=6, G=7, A=8, H(B)=9
 * - Upper octave: C=10, D=11, E=12, F=13, G=14, A=15, H(B)=16
 */
export function pitchToStaffPosition(pitch: Pitch, octave: Octave, clef: Clef): number {
  const treblePitchOffsets: Record<Pitch, number> = {
    C: -2,
    D: -1,
    E: 0,
    F: 1,
    G: 2,
    A: 3,
    H: 4,
  };

  const bassPitchOffsets: Record<Pitch, number> = {
    C: -4,
    D: -3,
    E: -2,
    F: -1,
    G: 0,
    A: 1,
    H: 2,
  };

  const octaveOffsets: Record<Octave, number> = {
    lower: 0,
    middle: 7,
    upper: 14,
  };

  const pitchOffsets = clef === "bass" ? bassPitchOffsets : treblePitchOffsets;

  return pitchOffsets[pitch] + octaveOffsets[octave];
}

/**
 * Compute layout for the entire score.
 */
export function computeLayout(score: Score, config?: Partial<LayoutConfig>): StaffLayout {
  const fullConfig: LayoutConfig = { ...DEFAULT_CONFIG, ...config };

  // Collect all notes from all parts
  const allNotes: Array<{ note: NoteOrRest; partIndex: number; noteIndex: number }> = [];
  score.parts.forEach((part, partIndex) => {
    part.notes.forEach((note, noteIndex) => {
      allNotes.push({ note, partIndex, noteIndex });
    });
  });

  // Compute positions
  const systems: StaffSystem[] = [];
  let currentSystem: StaffSystem = {
    startX: fullConfig.marginLeft,
    startY: fullConfig.marginTop,
    notes: [],
    barLines: [],
  };

  let currentX = fullConfig.marginLeft;
  let currentBeats = 0;
  // Normalize beats per measure to quarter-note equivalents.
  // DURATION_TO_BEATS maps durations relative to quarter notes (quarter=1).
  // For 4/4: 4 * (4/4) = 4 quarter-note beats per measure.
  // For 3/4: 3 * (4/4) = 3 quarter-note beats per measure.
  // For 6/8: 6 * (4/8) = 3 quarter-note beats per measure.
  const beatsPerMeasure = score.timeSignature.beats * (4 / score.timeSignature.beatValue);

  allNotes.forEach(({ note, partIndex, noteIndex }) => {
    const isRest = note.type === "rest";

    // Calculate Y position
    let y: number;
    if (isRest) {
      // Rests are positioned at the center of the staff
      y = 4; // Middle line position
    } else {
      y = pitchToStaffPosition(note.pitch, note.octave, score.clef);
    }

    // Add note layout
    currentSystem.notes.push({
      x: currentX,
      y,
      noteIndex,
      partIndex,
      isRest,
      ...(note.type === "note" ? { octave: note.octave } : {}),
    });

    // Track beats for bar lines
    const noteBeats = DURATION_TO_BEATS[note.duration];
    currentBeats += noteBeats;

    currentX += fullConfig.noteSpacing;

    // Insert bar line when measure is complete
    if (currentBeats >= beatsPerMeasure) {
      currentSystem.barLines.push(currentX - fullConfig.noteSpacing / 2);
      currentBeats = 0;
    }

    // Check if we need to wrap to a new system
    if (currentX > fullConfig.canvasWidth - fullConfig.marginLeft) {
      systems.push(currentSystem);
      const nextY = currentSystem.startY + fullConfig.staffHeight + fullConfig.systemSpacing;
      currentSystem = {
        startX: fullConfig.marginLeft,
        startY: nextY,
        notes: [],
        barLines: [],
      };
      currentX = fullConfig.marginLeft;
    }
  });

  // Add the last system if it has notes
  if (currentSystem.notes.length > 0) {
    systems.push(currentSystem);
  }

  // If no notes, add an empty system
  if (systems.length === 0) {
    systems.push(currentSystem);
  }

  return {
    systems,
    config: fullConfig,
  };
}
