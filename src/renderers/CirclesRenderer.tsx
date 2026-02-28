/**
 * ULWILA Color Score Editor - Circles Renderer
 *
 * React SVG component that renders Mode B (pure color circles without staff lines).
 * Each note is displayed as a colored circle using the ULWILA color system.
 */

import React from "react";
import type { Score, Pitch } from "../models/types";
import { computeCirclesLayout, type CircleLayout } from "./circlesLayout";
import { ULWILA_COLORS, getAccentedColors } from "../constants/colors";

export interface CirclesRendererProps {
  score: Score;
  selection: { partIndex: number; noteIndex: number } | null;
  onNoteClick?: (partIndex: number, noteIndex: number) => void;
  width?: number;
}

/**
 * Renders a circle as two vertical semicircles for accented (sharp) notes.
 */
function renderSemicircle(
  cx: number,
  cy: number,
  r: number,
  leftColor: string,
  rightColor: string,
  rightIsYellow: boolean
): React.ReactNode {
  // Left semicircle: arc bulging left (sweep=0, large-arc=1)
  const leftPath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} Z`;
  // Right semicircle: arc bulging right (sweep=1, large-arc=1)
  const rightPath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} Z`;
  const strokeColor = rightIsYellow ? "#333333" : leftColor;
  const strokeW = rightIsYellow ? 2 : 1;
  return (
    <>
      <path d={leftPath} fill={leftColor} stroke="none" className="note-circle" />
      <path d={rightPath} fill={rightColor} stroke="none" className="note-circle" />
      {/* Full circle outline */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={strokeColor} strokeWidth={strokeW} />
    </>
  );
}

/**
 * Renders a single circle (or sub-circles for eighth/sixteenth notes).
 */
function renderCircleElement(
  circle: CircleLayout,
  score: Score,
  selection: CirclesRendererProps["selection"],
  onNoteClick: CirclesRendererProps["onNoteClick"]
): React.ReactNode {
  if (circle.isRest) {
    // Rests are empty gaps; render nothing visible
    return null;
  }

  const part = score.parts[circle.partIndex];
  const noteOrRest = part?.notes[circle.noteIndex];
  if (!noteOrRest || noteOrRest.type === "rest") return null;

  const note = noteOrRest;
  const pitch = note.pitch as Pitch;
  const color = ULWILA_COLORS[pitch];
  const isYellow = pitch === "H";
  const isSelected =
    selection !== null &&
    selection.partIndex === circle.partIndex &&
    selection.noteIndex === circle.noteIndex;

  const handleClick = () => {
    if (onNoteClick) {
      onNoteClick(circle.partIndex, circle.noteIndex);
    }
  };

  // Determine octave dot rendering
  const renderOctaveDot = (cx: number, cy: number, radius: number) => {
    if (!circle.octave || circle.octave === "middle") return null;
    const dotRadius = Math.max(2, radius * 0.15);
    const dotColor = circle.octave === "lower" ? "#000000" : "#FFFFFF";
    return (
      <circle
        cx={cx}
        cy={cy}
        r={dotRadius}
        fill={dotColor}
        className="octave-dot"
        data-octave={circle.octave}
      />
    );
  };

  // If we have sub-circles (eighth or sixteenth notes), render those instead
  if (circle.subCircles && circle.subCircles.length > 0) {
    return (
      <g
        key={`circle-${circle.partIndex}-${circle.noteIndex}`}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
        data-testid={`note-circle-${circle.partIndex}-${circle.noteIndex}`}
      >
        {circle.subCircles.map((sub, i) => (
          <React.Fragment key={`sub-${i}`}>
            {note.accented ? (
              (() => {
                const { left, right } = getAccentedColors(pitch);
                const rightIsYellow = right === ULWILA_COLORS.H;
                return renderSemicircle(sub.cx, sub.cy, sub.radius, left, right, rightIsYellow);
              })()
            ) : (
              <circle
                cx={sub.cx}
                cy={sub.cy}
                r={sub.radius}
                fill={color}
                stroke={isYellow ? "#333333" : color}
                strokeWidth={isYellow ? 2 : 1}
                className="note-circle"
                data-pitch={pitch}
              />
            )}
            {renderOctaveDot(sub.cx, sub.cy, sub.radius)}
          </React.Fragment>
        ))}
        {/* Selection highlight ring around the group */}
        {isSelected && (
          <circle
            cx={circle.cx}
            cy={circle.cy}
            r={circle.radius + 8}
            fill="none"
            stroke="blue"
            strokeWidth={2}
            className="selection-ring"
          />
        )}
        {/* Lyric text */}
        {circle.lyric && (
          <text
            x={circle.cx}
            y={circle.cy + circle.radius + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#333"
            className="lyric-text"
          >
            {circle.lyric}
          </text>
        )}
      </g>
    );
  }

  // Standard single circle (quarter, half, whole)
  return (
    <g
      key={`circle-${circle.partIndex}-${circle.noteIndex}`}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      data-testid={`note-circle-${circle.partIndex}-${circle.noteIndex}`}
    >
      {note.accented ? (
        (() => {
          const { left, right } = getAccentedColors(pitch);
          const rightIsYellow = right === ULWILA_COLORS.H;
          return renderSemicircle(circle.cx, circle.cy, circle.radius, left, right, rightIsYellow);
        })()
      ) : (
        <circle
          cx={circle.cx}
          cy={circle.cy}
          r={circle.radius}
          fill={color}
          stroke={isYellow ? "#333333" : color}
          strokeWidth={isYellow ? 2 : 1}
          className="note-circle"
          data-pitch={pitch}
        />
      )}
      {/* Octave dot */}
      {renderOctaveDot(circle.cx, circle.cy, circle.radius)}
      {/* Selection highlight ring */}
      {isSelected && (
        <circle
          cx={circle.cx}
          cy={circle.cy}
          r={circle.radius + 4}
          fill="none"
          stroke="blue"
          strokeWidth={2}
          className="selection-ring"
        />
      )}
      {/* Lyric text */}
      {circle.lyric && (
        <text
          x={circle.cx}
          y={circle.cy + circle.radius + 20}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          className="lyric-text"
        >
          {circle.lyric}
        </text>
      )}
    </g>
  );
}

/**
 * CirclesRenderer component.
 *
 * Renders a musical score as colored circles in a horizontal layout (ULWILA Mode B).
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
          {row.circles.map((circle) =>
            renderCircleElement(circle, score, selection, onNoteClick)
          )}
        </g>
      ))}
    </svg>
  );
};

export default CirclesRenderer;
