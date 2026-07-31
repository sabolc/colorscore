/**
 * ULWILA Color Score Editor - Circles Renderer
 *
 * React SVG component that renders Mode B (pure color circles without staff lines).
 * Each note is displayed with its ULWILA rhythm glyph, filled with the ULWILA
 * color of its pitch. See `circlesLayout.ts` for the glyph vocabulary.
 */

import React from "react";
import type { Score, Pitch } from "../models/types";
import {
  computeCirclesLayout,
  glyphPath,
  glyphHalfPaths,
  measureAccentPath,
  repeatSignParts,
  type CircleLayout,
  type Glyph,
} from "./circlesLayout";
import { ULWILA_COLORS, getAccentedColors, getOctaveDotStyle } from "../constants/colors";
import { isNoteSelected, type SelectionState } from "../store/selectionReducer";

/** Outline color for uncolored rest glyphs. */
const REST_STROKE = "#333333";

export interface CirclesRendererProps {
  score: Score;
  selection: SelectionState | null;
  onNoteClick?: (partIndex: number, noteIndex: number, event?: React.MouseEvent) => void;
  width?: number;
}

/**
 * Renders a glyph split into two vertical halves, for accented (sharp) notes.
 * The left half uses the note's own color, the right half the neighbor's.
 */
function renderSplitGlyph(
  glyph: Glyph,
  leftColor: string,
  rightColor: string,
  rightIsYellow: boolean
): React.ReactNode {
  const { left, right } = glyphHalfPaths(glyph);
  const strokeColor = rightIsYellow ? "#333333" : leftColor;
  const strokeW = rightIsYellow ? 2 : 1;
  return (
    <>
      <path d={left} fill={leftColor} stroke="none" className="note-circle" />
      <path d={right} fill={rightColor} stroke="none" className="note-circle" />
      {/* Outline of the full glyph */}
      <path d={glyphPath(glyph)} fill="none" stroke={strokeColor} strokeWidth={strokeW} />
    </>
  );
}

/**
 * Renders one colored note glyph.
 */
function renderNoteGlyph(glyph: Glyph, pitch: Pitch, accented: boolean): React.ReactNode {
  const color = ULWILA_COLORS[pitch];
  const isYellow = pitch === "H";

  if (accented) {
    const { left, right } = getAccentedColors(pitch);
    const rightIsYellow = right === ULWILA_COLORS.H;
    return renderSplitGlyph(glyph, left, right, rightIsYellow);
  }

  const stroke = isYellow ? "#333333" : color;
  const strokeWidth = isYellow ? 2 : 1;

  // Plain circles stay <circle> elements; everything else is a path.
  if (glyph.kind === "circle") {
    return (
      <circle
        cx={glyph.cx}
        cy={glyph.cy}
        r={glyph.radius}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className="note-circle"
        data-pitch={pitch}
        data-glyph={glyph.kind}
      />
    );
  }

  return (
    <path
      d={glyphPath(glyph)}
      fill={color}
      stroke={stroke}
      strokeWidth={strokeWidth}
      className="note-circle"
      data-pitch={pitch}
      data-glyph={glyph.kind}
    />
  );
}

/**
 * Renders one uncolored rest glyph (outline only).
 */
function renderRestGlyph(glyph: Glyph): React.ReactNode {
  return (
    <path
      d={glyphPath(glyph)}
      fill="none"
      stroke={REST_STROKE}
      strokeWidth={2}
      className="rest-symbol"
      data-glyph={glyph.kind}
    />
  );
}

/**
 * Renders one repeat sign: a thick and a thin vertical line with two dots on
 * the side the repeated section lies on.
 */
function renderRepeatSign(
  cx: number,
  cy: number,
  radius: number,
  facing: "left" | "right"
): React.ReactNode {
  const { thick, thin, dots } = repeatSignParts(cx, cy, radius, facing);
  return (
    <g className="repeat-sign" data-facing={facing}>
      <rect {...thick} fill="#333333" />
      <rect {...thin} fill="#333333" />
      {dots.map((dot, i) => (
        <circle key={`dot-${i}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill="#333333" />
      ))}
    </g>
  );
}

/**
 * Renders a single note or rest symbol with its octave dots, selection ring,
 * lyric, and line-break indicator.
 */
function renderSymbol(
  symbol: CircleLayout,
  score: Score,
  selection: CirclesRendererProps["selection"],
  onNoteClick: CirclesRendererProps["onNoteClick"]
): React.ReactNode {
  const part = score.parts[symbol.partIndex];
  const noteOrRest = part?.notes[symbol.noteIndex];
  if (!noteOrRest) return null;

  const isRest = noteOrRest.type === "rest";
  const isSelected = isNoteSelected(selection, symbol.partIndex, symbol.noteIndex);

  const handleClick = (e: React.MouseEvent) => {
    if (onNoteClick) {
      onNoteClick(symbol.partIndex, symbol.noteIndex, e);
    }
  };

  // Octave dot in the center of each colored glyph (lower = black, upper = white).
  // A halo ring keeps the dot visible when it matches the note color too closely,
  // e.g. the black lower-octave dot on the near-black C.
  const renderOctaveDot = (glyph: Glyph, key: string) => {
    if (isRest || !symbol.octave) return null;
    const dotStyle = getOctaveDotStyle((noteOrRest as { pitch: Pitch }).pitch, symbol.octave);
    if (!dotStyle) return null;

    const haloWidth = dotStyle.halo ? Math.max(1.5, glyph.radius * 0.09) : 0;
    // Keep the dot plus its halo inside the glyph.
    const maxRadius = glyph.width * 0.4 - haloWidth / 2;
    const dotRadius = Math.min(Math.max(2, glyph.radius * 0.15), maxRadius);

    return (
      <circle
        key={key}
        cx={glyph.cx}
        cy={glyph.cy}
        r={dotRadius}
        fill={dotStyle.fill}
        stroke={dotStyle.halo ?? undefined}
        strokeWidth={dotStyle.halo ? haloWidth : undefined}
        className="octave-dot"
        data-octave={symbol.octave}
      />
    );
  };

  const testId = isRest
    ? `rest-symbol-${symbol.partIndex}-${symbol.noteIndex}`
    : `note-circle-${symbol.partIndex}-${symbol.noteIndex}`;

  return (
    <g
      key={`symbol-${symbol.partIndex}-${symbol.noteIndex}`}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      data-testid={testId}
    >
      {/* Repeat signs — this project's convention, not the method's */}
      {symbol.repeatStartX !== undefined &&
        renderRepeatSign(symbol.repeatStartX, symbol.cy, symbol.radius, "right")}
      {symbol.repeatEndX !== undefined &&
        renderRepeatSign(symbol.repeatEndX, symbol.cy, symbol.radius, "left")}

      {/* Measure accent — the ULWILA stress mark that replaces bar lines */}
      {symbol.hasMeasureAccent && (
        <path
          d={measureAccentPath(symbol)}
          fill="#000000"
          className="measure-accent"
        />
      )}
      {symbol.glyphs.map((glyph, i) => (
        <React.Fragment key={`glyph-${i}`}>
          {isRest
            ? renderRestGlyph(glyph)
            : renderNoteGlyph(
                glyph,
                (noteOrRest as { pitch: Pitch }).pitch,
                Boolean((noteOrRest as { accented?: boolean }).accented)
              )}
          {renderOctaveDot(glyph, `dot-${i}`)}
        </React.Fragment>
      ))}
      {/* Selection highlight ring around the whole symbol */}
      {isSelected && (
        <rect
          x={symbol.cx - symbol.width / 2 - 5}
          y={symbol.cy - symbol.radius - 5}
          width={symbol.width + 10}
          height={symbol.radius * 2 + 10}
          rx={6}
          fill="none"
          stroke="blue"
          strokeWidth={2}
          className="selection-ring"
        />
      )}
      {/* Lyric text */}
      {symbol.lyric && (
        <text
          x={symbol.cx}
          y={symbol.cy + symbol.radius + 20}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          className="lyric-text"
        >
          {symbol.lyric}
        </text>
      )}
      {/* Line break indicator */}
      {noteOrRest.lineBreakAfter && (
        <text
          x={symbol.cx + symbol.width / 2 + 6}
          y={symbol.cy - symbol.radius}
          fontSize="12"
          fill="#999"
          textAnchor="start"
          className="line-break-indicator"
        >
          {"↵"}
        </text>
      )}
    </g>
  );
}

/**
 * CirclesRenderer component.
 *
 * Renders a musical score as ULWILA rhythm glyphs in a horizontal layout (Mode B).
 */
const CirclesRenderer: React.FC<CirclesRendererProps> = ({
  score,
  selection,
  onNoteClick,
  width = 800,
}) => {
  const layout = computeCirclesLayout(score, { canvasWidth: width });

  return (
    <svg
      width={width}
      height={layout.totalHeight}
      style={{ display: "block", margin: "0 auto" }}
      data-testid="circles-renderer"
    >
      {layout.rows.map((row, rowIndex) => (
        <g key={`row-${rowIndex}`} className="circles-row">
          {row.circles.map((symbol) =>
            renderSymbol(symbol, score, selection, onNoteClick)
          )}
        </g>
      ))}
    </svg>
  );
};

export default CirclesRenderer;
