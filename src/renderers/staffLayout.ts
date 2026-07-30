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
  /** Total SVG height needed, including notes reaching outside the staff */
  totalHeight: number;
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

/** Diatonic step of each pitch inside its octave (C = 0 ... H/B = 6). */
const PITCH_STEP: Record<Pitch, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  H: 6,
};

/**
 * ULWILA's three registers as scientific octave numbers. The main register is
 * the one around middle C, which is what the plain (dotless) circles mean.
 */
const OCTAVE_NUMBER: Record<Octave, number> = {
  lower: 3,
  middle: 4,
  upper: 5,
};

/**
 * Diatonic index of the note sitting on each clef's bottom staff line:
 * E4 for treble, G2 for bass.
 */
/**
 * Vertical room a note needs beyond its own centre: the notehead itself plus
 * the ledger lines that carry it outside the staff.
 */
const NOTE_CLEARANCE = 14;

const CLEF_BOTTOM_LINE: Record<Clef, number> = {
  treble: 4 * 7 + PITCH_STEP.E,
  bass: 2 * 7 + PITCH_STEP.G,
};

/**
 * Convert pitch and octave to staff position.
 * Returns a number where 0 = bottom line of staff, one unit per diatonic step
 * (line to adjacent space).
 *
 * The pitch is resolved to an absolute position first and only then measured
 * against the clef, so a note keeps its sounding pitch when the clef changes.
 * Adding a clef-specific pitch offset to a clef-independent octave offset --
 * as this did before -- made the same note read two octaves apart in bass
 * clef, and put the whole treble range an octave too high.
 *
 * Treble (bottom line E4): middle C sits at -2, the first ledger line below
 * the staff, per SPEC-STAFF-RENDERING-R-PITCH-PLACEMENT. Middle-octave G is
 * at 2, the second line up -- the line the treble clef names.
 *
 * Bass (bottom line G2): middle C sits at 10, the first ledger line above the
 * staff. Lower-octave F is at 6, the fourth line -- the line the bass clef
 * names.
 */
export function pitchToStaffPosition(pitch: Pitch, octave: Octave, clef: Clef): number {
  const diatonicIndex = OCTAVE_NUMBER[octave] * 7 + PITCH_STEP[pitch];
  return diatonicIndex - CLEF_BOTTOM_LINE[clef];
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

  for (const { note, partIndex, noteIndex } of allNotes) {
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

    // Force line break if the note has lineBreakAfter set
    if (note.lineBreakAfter) {
      systems.push(currentSystem);
      const nextY = currentSystem.startY + fullConfig.staffHeight + fullConfig.systemSpacing;
      currentSystem = {
        startX: fullConfig.marginLeft,
        startY: nextY,
        notes: [],
        barLines: [],
      };
      currentX = fullConfig.marginLeft;
      continue;
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
  }

  // Add the last system if it has notes
  if (currentSystem.notes.length > 0) {
    systems.push(currentSystem);
  }

  // If no notes, add an empty system
  if (systems.length === 0) {
    systems.push(currentSystem);
  }

  // Notes can sit well outside the staff — the middle octave is far above a
  // bass staff, the lower octave far below a treble one. Measure how far and
  // give them room, otherwise the noteheads are clipped by the SVG edge.
  const halfStep = fullConfig.staffLineSpacing / 2;
  // Offsets relative to a system's startY. The staff itself spans 0 to
  // staffHeight; only notes reaching past that need extra clearance.
  let contentTop = 0;
  let contentBottom = fullConfig.staffHeight;
  for (const system of systems) {
    for (const note of system.notes) {
      const offset = fullConfig.staffHeight - note.y * halfStep;
      contentTop = Math.min(contentTop, offset - NOTE_CLEARANCE);
      contentBottom = Math.max(contentBottom, offset + NOTE_CLEARANCE);
    }
  }

  const bottomOffset = contentBottom;

  // Push everything down if the highest note would land above the top edge
  const extraTop = Math.max(0, -contentTop);
  if (extraTop > 0) {
    for (const system of systems) {
      system.startY += extraTop;
    }
  }

  const lastStartY = systems[systems.length - 1].startY;
  const totalHeight =
    lastStartY + Math.max(bottomOffset, fullConfig.staffHeight) + fullConfig.marginTop;

  return {
    systems,
    config: fullConfig,
    totalHeight,
  };
}
