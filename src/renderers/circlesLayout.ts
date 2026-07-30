/**
 * ULWILA Color Score Editor - Circles Layout Computation
 *
 * Pure layout computation module for Mode B (circles rendering).
 * Given a Score and configuration, computes symbol positions, sizes, and row info.
 *
 * Rhythm glyphs follow the ULWILA rhythm table (Vető–Ullrich 1997; Bakos 2014,
 * "Az Ulwila – színes kotta módszer", 2. táblázat):
 *
 *   quarter    ○           one colored circle
 *   half       ○○          two circles joined
 *   whole      ○○○○        four circles joined
 *   eighth     ◖           one half circle, flat edge on the right
 *                          ("a nyolcad hangok jele a jobbra nyitott félkör")
 *   sixteenth  ▏           one narrow vertical bar ("vonás, téglalap alak")
 *
 * Rests use the same rhythmic proportions but uncolored (outline-only) glyphs:
 *
 *   quarter rest    ⬡       one empty hexagon
 *   half rest       ⬡⬡      two empty hexagons
 *   whole rest      ⬡⬡⬡⬡    four empty hexagons
 *   eighth rest     ◁       left half of an empty hexagon (vertical right edge)
 *   sixteenth rest  ▏       one empty narrow bar
 */

import type { Score, NoteOrRest, Duration, Octave } from "../models/types";

/**
 * Configuration for circles layout computation.
 */
export interface CirclesLayoutConfig {
  canvasWidth: number;
  circleSize: number;       // Base diameter for quarter notes (default 40)
  circleSpacing: number;    // Horizontal width of one quarter-note beat slot (default 50)
  marginLeft: number;       // Left margin (default 20)
  marginTop: number;        // Top margin (default 30)
  rowSpacing: number;       // Vertical spacing between rows (default 80)
  lyricOffset: number;      // Vertical offset for lyrics below circles (default 25)
}

/**
 * The primitive shapes the ULWILA rhythm glyphs are built from.
 *
 * - `circle`      — full circle of `radius`
 * - `half-circle` — half disc bulging left, flat vertical edge on the right
 * - `bar`         — narrow vertical rectangle (`width` x 2*`radius`)
 * - `hexagon`     — pointy-top hexagon of circumradius `radius`
 * - `half-hexagon`— left half of a pointy-top hexagon, vertical edge on the right
 */
export type GlyphKind = "circle" | "half-circle" | "bar" | "hexagon" | "half-hexagon";

/**
 * A single primitive shape making up a note or rest symbol.
 * `cx`/`cy` is the center of the glyph's bounding box.
 */
export interface Glyph {
  kind: GlyphKind;
  cx: number;
  cy: number;
  /** Arc/circum radius; also half the glyph height */
  radius: number;
  /** Bounding box width of the glyph */
  width: number;
}

/**
 * Computed position and size for a single note or rest symbol.
 */
export interface CircleLayout {
  /** Center X of the whole symbol (used for lyrics and selection) */
  cx: number;
  /** Center Y coordinate */
  cy: number;
  /** Base radius (half the symbol height) */
  radius: number;
  /** Total bounding width of the symbol's glyphs */
  width: number;
  /** The primitive shapes to draw, left to right */
  glyphs: Glyph[];
  /** Index of the part this note belongs to */
  partIndex: number;
  /** Index of the note within the part */
  noteIndex: number;
  /** Whether this is a rest (uncolored, outline-only glyphs) */
  isRest: boolean;
  /**
   * Whether this symbol starts a measure and so carries the accent triangle.
   * Deliberately not called `accented` — that property means an altered/sharp
   * pitch, which is a different thing drawn a different way.
   */
  hasMeasureAccent: boolean;
  /** Octave indicator for dot rendering */
  octave?: Octave;
  /** Lyric text, if any */
  lyric?: string;
}

/**
 * A single row of symbols in the layout.
 */
export interface CircleRow {
  /** Starting Y position of the row */
  startY: number;
  /** Symbols in this row */
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

/** Width of a sixteenth-note bar, as a fraction of the base circle diameter. */
const BAR_WIDTH_RATIO = 0.18;

/** Width of a pointy-top hexagon, as a fraction of its circumradius (2*cos30°). */
const HEXAGON_WIDTH_RATIO = Math.sqrt(3);

/**
 * Width of a grouping gap, in quarter-note beat units. Published ULWILA scores
 * separate words and phrases with a plain space; this is that space. It carries
 * no duration and is never drawn — only advanced past.
 */
export const GAP_BEATS = 0.5;

/**
 * Geometry of the measure accent — the solid black triangle ULWILA places above
 * the first note of a measure, in place of a bar line.
 */
export const ACCENT_WIDTH = 14;
export const ACCENT_HEIGHT = 12;
/** Clearance between the triangle's tip and the top of the glyph below it. */
export const ACCENT_GAP = 4;

/** Tolerance for the beat accumulator, which sums fractional durations. */
const BEAT_EPSILON = 1e-9;

/**
 * Maps a duration to the number of quarter-note beat slots it occupies.
 * Eighths and sixteenths take a fraction of a slot so that two eighths or
 * four sixteenths fill exactly one beat, as the ULWILA method requires.
 */
export function durationToBeats(duration: Duration): number {
  switch (duration) {
    case "whole":
      return 4;
    case "half":
      return 2;
    case "quarter":
      return 1;
    case "eighth":
      return 0.5;
    case "sixteenth":
      return 0.25;
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
  // currentX tracks the left edge of the next symbol's beat span
  let currentX = fullConfig.marginLeft;
  let currentRowY = fullConfig.marginTop + baseRadius;

  const maxX = fullConfig.canvasWidth - fullConfig.marginLeft;
  const gapWidth = GAP_BEATS * fullConfig.circleSpacing;
  // Measure length in quarter-note beats, matching how staffLayout places bar
  // lines, so the two rendering modes agree on where measures start.
  const beatsPerMeasure =
    score.timeSignature.beats * (4 / score.timeSignature.beatValue);
  let beatsElapsed = 0;
  // Gap owed by the previous element. Held rather than applied immediately so
  // that a gap at the end of a row is dropped instead of indenting the next one.
  let pendingGap = 0;

  for (const { note, partIndex, noteIndex } of allNotes) {
    const spanWidth = durationToBeats(note.duration) * fullConfig.circleSpacing;
    let gapBefore = pendingGap;

    // Check if we need to wrap to a new row — the pending gap counts towards
    // the width, but is discarded once we do wrap.
    if (currentX + gapBefore + spanWidth > maxX && currentRow.length > 0) {
      rows.push({ startY: currentRowY, circles: currentRow });
      currentRow = [];
      currentRowY += fullConfig.rowSpacing;
      currentX = fullConfig.marginLeft;
      gapBefore = 0;
    }

    // The accent falls on whatever element begins a measure. An override on the
    // element wins, which is what a song starting on an upbeat needs.
    const startsMeasure =
      beatsPerMeasure > 0 &&
      Math.abs(beatsElapsed % beatsPerMeasure) < BEAT_EPSILON;
    const hasMeasureAccent =
      note.measureAccent === undefined ? startsMeasure : note.measureAccent === "on";
    beatsElapsed += durationToBeats(note.duration);

    currentX += gapBefore;
    currentRow.push(
      computeSymbol(
        note,
        currentX,
        spanWidth,
        currentRowY,
        baseRadius,
        partIndex,
        noteIndex,
        hasMeasureAccent
      )
    );
    currentX += spanWidth;
    pendingGap = note.spaceAfter ? gapWidth : 0;

    // Force line break if the note has lineBreakAfter set
    if (note.lineBreakAfter) {
      rows.push({ startY: currentRowY, circles: currentRow });
      currentRow = [];
      currentRowY += fullConfig.rowSpacing;
      currentX = fullConfig.marginLeft;
      pendingGap = 0;
      continue;
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
  // The triangle is drawn above the row. Symbols are never moved to make room
  // for it — the default top margin already clears it — but assert the room is
  // there so a smaller margin cannot silently clip the accents.
  const accentTop =
    fullConfig.marginTop + baseRadius - baseRadius - ACCENT_GAP - ACCENT_HEIGHT;
  if (accentTop < 0) {
    // Shift every row down by the shortfall, preserving relative spacing.
    const shortfall = -accentTop;
    for (const row of rows) {
      row.startY += shortfall;
      for (const symbol of row.circles) {
        symbol.cy += shortfall;
        for (const glyph of symbol.glyphs) glyph.cy += shortfall;
      }
    }
    return { rows, config: fullConfig, totalHeight: totalHeight + shortfall };
  }

  return {
    rows,
    config: fullConfig,
    totalHeight,
  };
}

/**
 * Build the glyph sequence for one note or rest and center it in its beat span.
 */
function computeSymbol(
  note: NoteOrRest,
  spanLeft: number,
  spanWidth: number,
  rowY: number,
  baseRadius: number,
  partIndex: number,
  noteIndex: number,
  hasMeasureAccent: boolean
): CircleLayout {
  const isRest = note.type === "rest";
  const glyphs = buildGlyphs(note.duration, isRest, baseRadius);

  // Total ink width of the glyph run (glyphs of a multi-circle note touch).
  const inkWidth = glyphs.reduce((sum, g) => sum + g.width, 0);
  // Center the glyph run inside the beat span.
  let x = spanLeft + (spanWidth - inkWidth) / 2;
  for (const glyph of glyphs) {
    glyph.cx = x + glyph.width / 2;
    glyph.cy = rowY;
    x += glyph.width;
  }

  const centerX = spanLeft + spanWidth / 2;

  return {
    cx: centerX,
    cy: rowY,
    radius: baseRadius,
    width: inkWidth,
    glyphs,
    partIndex,
    noteIndex,
    isRest,
    hasMeasureAccent,
    octave: note.type === "note" ? note.octave : undefined,
    lyric: note.type === "note" ? note.lyric : undefined,
  };
}

/**
 * Return the ULWILA glyph run for a duration. Positions are filled in later by
 * `computeSymbol`; only `kind`, `radius`, and `width` are set here.
 */
function buildGlyphs(duration: Duration, isRest: boolean, baseRadius: number): Glyph[] {
  const roundKind: GlyphKind = isRest ? "hexagon" : "circle";
  const halfKind: GlyphKind = isRest ? "half-hexagon" : "half-circle";
  const roundWidth = isRest ? baseRadius * HEXAGON_WIDTH_RATIO : baseRadius * 2;
  const halfWidth = roundWidth / 2;
  const barWidth = baseRadius * 2 * BAR_WIDTH_RATIO;

  const round = (count: number): Glyph[] =>
    Array.from({ length: count }, () => ({
      kind: roundKind,
      cx: 0,
      cy: 0,
      radius: baseRadius,
      width: roundWidth,
    }));

  switch (duration) {
    case "whole":
      return round(4);
    case "half":
      return round(2);
    case "quarter":
      return round(1);
    case "eighth":
      return [{ kind: halfKind, cx: 0, cy: 0, radius: baseRadius, width: halfWidth }];
    case "sixteenth":
      return [{ kind: "bar", cx: 0, cy: 0, radius: baseRadius, width: barWidth }];
    default:
      return round(1);
  }
}

/**
 * Build the SVG path `d` attribute for a glyph.
 * Circles are drawn as `<circle>` elements by the renderer, so they are not
 * handled here.
 */
export function glyphPath(glyph: Glyph): string {
  const { cx, cy, radius: r, width } = glyph;

  switch (glyph.kind) {
    case "half-circle": {
      // Half disc bulging left with a flat vertical edge on the right
      // ("jobbra nyitott félkör").
      const edgeX = cx + width / 2;
      return `M ${edgeX} ${cy - r} A ${r} ${r} 0 0 0 ${edgeX} ${cy + r} Z`;
    }
    case "bar": {
      const halfW = width / 2;
      return (
        `M ${cx - halfW} ${cy - r} L ${cx + halfW} ${cy - r} ` +
        `L ${cx + halfW} ${cy + r} L ${cx - halfW} ${cy + r} Z`
      );
    }
    case "hexagon": {
      const halfW = width / 2;
      const halfR = r / 2;
      return (
        `M ${cx} ${cy - r} L ${cx + halfW} ${cy - halfR} L ${cx + halfW} ${cy + halfR} ` +
        `L ${cx} ${cy + r} L ${cx - halfW} ${cy + halfR} L ${cx - halfW} ${cy - halfR} Z`
      );
    }
    case "half-hexagon": {
      // Left half of a pointy-top hexagon; the cut edge is vertical, on the right.
      const halfW = width / 2;
      const halfR = r / 2;
      return (
        `M ${cx + halfW} ${cy - r} L ${cx + halfW} ${cy + r} ` +
        `L ${cx - halfW} ${cy + halfR} L ${cx - halfW} ${cy - halfR} Z`
      );
    }
    case "circle":
    default: {
      // Circle as a path, for completeness (renderer uses <circle>).
      return (
        `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} ` +
        `A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
      );
    }
  }
}

/**
 * SVG path for the measure accent triangle above a symbol: solid, pointing
 * down, centred over the symbol's first glyph.
 */
export function measureAccentPath(symbol: CircleLayout): string {
  const first = symbol.glyphs[0];
  const cx = first ? first.cx : symbol.cx;
  const bottom = symbol.cy - symbol.radius - ACCENT_GAP;
  const top = bottom - ACCENT_HEIGHT;
  const halfW = ACCENT_WIDTH / 2;
  return `M ${cx - halfW} ${top} L ${cx + halfW} ${top} L ${cx} ${bottom} Z`;
}

/**
 * Split a glyph vertically into a left and a right half path. Used to render
 * altered (accented) notes, where the left half carries the note's own ULWILA
 * color and the right half the neighboring pitch's color.
 */
export function glyphHalfPaths(glyph: Glyph): { left: string; right: string } {
  const { cx, cy, radius: r, width } = glyph;
  const halfW = width / 2;

  switch (glyph.kind) {
    case "half-circle": {
      // Cut the half disc with a vertical line through the middle of its
      // bounding box (x = cx). The chord meets the arc at cy ± r*sqrt(3)/2.
      const edgeX = cx + halfW;
      const chordY = (r * Math.sqrt(3)) / 2;
      return {
        left:
          `M ${cx} ${cy - chordY} A ${r} ${r} 0 0 0 ${cx} ${cy + chordY} Z`,
        right:
          `M ${edgeX} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy - chordY} ` +
          `L ${cx} ${cy + chordY} A ${r} ${r} 0 0 0 ${edgeX} ${cy + r} Z`,
      };
    }
    case "bar": {
      return {
        left: `M ${cx - halfW} ${cy - r} L ${cx} ${cy - r} L ${cx} ${cy + r} L ${cx - halfW} ${cy + r} Z`,
        right: `M ${cx} ${cy - r} L ${cx + halfW} ${cy - r} L ${cx + halfW} ${cy + r} L ${cx} ${cy + r} Z`,
      };
    }
    case "circle":
    default: {
      return {
        left: `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} Z`,
        right: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} Z`,
      };
    }
  }
}
