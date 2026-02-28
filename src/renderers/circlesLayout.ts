/**
 * ULWILA Color Score Editor - Circles Layout Computation
 *
 * Pure layout computation module for Mode B (circles rendering).
 * Given a Score and configuration, computes circle positions, sizes, and row info.
 */

import type { Score, NoteOrRest, Duration, Octave } from "../models/types";

/**
 * Configuration for circles layout computation.
 */
export interface CirclesLayoutConfig {
  canvasWidth: number;
  circleSize: number;       // Base diameter for quarter notes (default 40)
  circleSpacing: number;    // Horizontal spacing between circle centers (default 50)
  marginLeft: number;       // Left margin (default 20)
  marginTop: number;        // Top margin (default 30)
  rowSpacing: number;       // Vertical spacing between rows (default 80)
  lyricOffset: number;      // Vertical offset for lyrics below circles (default 25)
}

/**
 * Computed position and size for a single circle element.
 */
export interface CircleLayout {
  /** Center X coordinate */
  cx: number;
  /** Center Y coordinate */
  cy: number;
  /** Radius of the circle */
  radius: number;
  /** Index of the part this note belongs to */
  partIndex: number;
  /** Index of the note within the part */
  noteIndex: number;
  /** Whether this is a rest (empty gap) */
  isRest: boolean;
  /** Octave indicator for dot rendering */
  octave?: Octave;
  /** Sub-circles for eighth and sixteenth notes */
  subCircles?: Array<{ cx: number; cy: number; radius: number }>;
  /** Lyric text, if any */
  lyric?: string;
}

/**
 * A single row of circles in the layout.
 */
export interface CircleRow {
  /** Starting Y position of the row */
  startY: number;
  /** Circles in this row */
  circles: CircleLayout[];
}

/**
 * Complete circles layout result.
 */
export interface CirclesLayout {
  rows: CircleRow[];
  config: CirclesLayoutConfig;
  /** Total height needed for the SVG */
  totalHeight: number;
}

const DEFAULT_CONFIG: CirclesLayoutConfig = {
  canvasWidth: 800,
  circleSize: 40,
  circleSpacing: 50,
  marginLeft: 20,
  marginTop: 30,
  rowSpacing: 80,
  lyricOffset: 25,
};

/**
 * Maps a duration to the number of horizontal positions it occupies.
 */
function durationToPositions(duration: Duration): number {
  switch (duration) {
    case "whole":
      return 4;
    case "half":
      return 2;
    case "quarter":
      return 1;
    case "eighth":
      return 1;
    case "sixteenth":
      return 1;
    default:
      return 1;
  }
}

/**
 * Compute the circles layout for the entire score.
 *
 * @param score - The score to compute layout for
 * @param config - Optional partial configuration overrides
 * @returns Computed circles layout with rows, positions, and sizes
 */
export function computeCirclesLayout(
  score: Score,
  config?: Partial<CirclesLayoutConfig>
): CirclesLayout {
  const fullConfig: CirclesLayoutConfig = { ...DEFAULT_CONFIG, ...config };
  const baseRadius = fullConfig.circleSize / 2;

  // Collect all notes from all parts
  const allNotes: Array<{ note: NoteOrRest; partIndex: number; noteIndex: number }> = [];
  score.parts.forEach((part, partIndex) => {
    part.notes.forEach((note, noteIndex) => {
      allNotes.push({ note, partIndex, noteIndex });
    });
  });

  const rows: CircleRow[] = [];
  let currentRow: CircleLayout[] = [];
  let currentX = fullConfig.marginLeft + baseRadius;
  let currentRowY = fullConfig.marginTop + baseRadius;

  const maxX = fullConfig.canvasWidth - fullConfig.marginLeft - baseRadius;

  for (const { note, partIndex, noteIndex } of allNotes) {
    const isRest = note.type === "rest";
    const positions = durationToPositions(note.duration);
    const totalWidth = positions * fullConfig.circleSpacing;

    // Check if we need to wrap to a new row
    if (currentX + totalWidth - fullConfig.circleSpacing / 2 > maxX && currentRow.length > 0) {
      rows.push({ startY: currentRowY, circles: currentRow });
      currentRow = [];
      currentRowY += fullConfig.rowSpacing;
      currentX = fullConfig.marginLeft + baseRadius;
    }

    if (isRest) {
      // Rests are empty gaps - advance position but add a placeholder
      currentRow.push({
        cx: currentX + (totalWidth - fullConfig.circleSpacing) / 2,
        cy: currentRowY,
        radius: 0,
        partIndex,
        noteIndex,
        isRest: true,
      });
      currentX += totalWidth;
    } else {
      // note.type === "note"
      const circleLayout = computeNoteCircle(
        note,
        currentX,
        currentRowY,
        baseRadius,
        fullConfig,
        partIndex,
        noteIndex
      );
      currentRow.push(circleLayout);
      currentX += totalWidth;
    }
  }

  // Push the final row if it has content
  if (currentRow.length > 0) {
    rows.push({ startY: currentRowY, circles: currentRow });
  }

  // If no notes at all, create a single empty row
  if (rows.length === 0) {
    rows.push({ startY: currentRowY, circles: [] });
  }

  const lastRow = rows[rows.length - 1];
  const totalHeight = lastRow.startY + baseRadius + fullConfig.lyricOffset + 20;

  return {
    rows,
    config: fullConfig,
    totalHeight,
  };
}

/**
 * Compute circle layout for a single note based on its duration.
 */
function computeNoteCircle(
  note: { type: "note"; pitch: string; octave: Octave; duration: Duration; lyric?: string },
  startX: number,
  rowY: number,
  baseRadius: number,
  config: CirclesLayoutConfig,
  partIndex: number,
  noteIndex: number
): CircleLayout {
  const { duration, octave, lyric } = note;

  switch (duration) {
    case "whole": {
      // Whole note: larger circle spanning ~4 positions
      const centerX = startX + (4 - 1) * config.circleSpacing / 2;
      return {
        cx: centerX,
        cy: rowY,
        radius: baseRadius * 1.8,
        partIndex,
        noteIndex,
        isRest: false,
        octave,
        lyric,
      };
    }
    case "half": {
      // Half note: larger circle spanning ~2 positions
      const centerX = startX + (2 - 1) * config.circleSpacing / 2;
      return {
        cx: centerX,
        cy: rowY,
        radius: baseRadius * 1.4,
        partIndex,
        noteIndex,
        isRest: false,
        octave,
        lyric,
      };
    }
    case "quarter": {
      // Quarter note: standard circle
      return {
        cx: startX,
        cy: rowY,
        radius: baseRadius,
        partIndex,
        noteIndex,
        isRest: false,
        octave,
        lyric,
      };
    }
    case "eighth": {
      // Eighth note: two smaller circles side by side
      const smallRadius = baseRadius * 0.6;
      const gap = smallRadius * 2.2;
      return {
        cx: startX,
        cy: rowY,
        radius: smallRadius,
        partIndex,
        noteIndex,
        isRest: false,
        octave,
        lyric,
        subCircles: [
          { cx: startX - gap / 2, cy: rowY, radius: smallRadius },
          { cx: startX + gap / 2, cy: rowY, radius: smallRadius },
        ],
      };
    }
    case "sixteenth": {
      // Sixteenth note: four tiny circles in 2x2 grid
      const tinyRadius = baseRadius * 0.4;
      const gap = tinyRadius * 2.4;
      return {
        cx: startX,
        cy: rowY,
        radius: tinyRadius,
        partIndex,
        noteIndex,
        isRest: false,
        octave,
        lyric,
        subCircles: [
          { cx: startX - gap / 2, cy: rowY - gap / 2, radius: tinyRadius },
          { cx: startX + gap / 2, cy: rowY - gap / 2, radius: tinyRadius },
          { cx: startX - gap / 2, cy: rowY + gap / 2, radius: tinyRadius },
          { cx: startX + gap / 2, cy: rowY + gap / 2, radius: tinyRadius },
        ],
      };
    }
    default:
      return {
        cx: startX,
        cy: rowY,
        radius: baseRadius,
        partIndex,
        noteIndex,
        isRest: false,
        octave,
        lyric,
      };
  }
}
