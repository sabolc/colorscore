/**
 * ULWILA Color Score Editor - Staff Renderer
 *
 * React SVG component that renders the musical staff notation.
 */

import React from "react";
import type { Score, NoteOrRest } from "../models/types";
import { computeLayout, type NoteLayout, type StaffSystem } from "./staffLayout";
import {
  REST_SYMBOLS,
  renderNotehead,
  isNoteheadFilled,
  hasStem,
  getFlagCount,
} from "./staffSymbols";
import { ULWILA_COLORS, getAccentedColors } from "../constants/colors";

interface StaffRendererProps {
  score: Score;
  selection: { partIndex: number; noteIndex: number } | null;
  onNoteClick?: (partIndex: number, noteIndex: number) => void;
  width?: number;
}

const StaffRenderer: React.FC<StaffRendererProps> = ({
  score,
  selection,
  onNoteClick,
  width = 800,
}) => {
  const layout = computeLayout(score, { canvasWidth: width });
  const { config } = layout;

  // Calculate total SVG height needed
  const lastSystem = layout.systems[layout.systems.length - 1];
  const svgHeight = lastSystem
    ? lastSystem.startY + config.staffHeight + config.marginTop
    : config.marginTop + config.staffHeight;

  /**
   * Render staff lines for a system
   */
  const renderStaffLines = (system: StaffSystem) => {
    const lines = [];
    for (let i = 0; i < 5; i++) {
      const y = system.startY + i * config.staffLineSpacing;
      lines.push(
        <line
          key={`staff-line-${i}`}
          x1={system.startX - 10}
          y1={y}
          x2={width - 20}
          y2={y}
          stroke="black"
          strokeWidth="1"
          className="staff-line"
        />
      );
    }
    return lines;
  };

  /**
   * Render clef symbol on every system
   */
  const renderClef = (system: StaffSystem, _systemIndex: number) => {
    const clefFont = "'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', serif";

    if (score.clef === "bass") {
      // Bass clef (𝄢 U+1D122) — anchor on the F line (2nd from top = index 1)
      const clefX = system.startX - 35;
      const clefY = system.startY + config.staffLineSpacing * 2.5;
      return (
        <text
          key="clef"
          x={clefX}
          y={clefY}
          fontSize={config.staffHeight * 0.6}
          fontFamily={clefFont}
          fill="black"
          textAnchor="middle"
          dominantBaseline="central"
          className="bass-clef"
        >
          {"\uD834\uDD22"}
        </text>
      );
    }

    // Treble clef (𝄞 U+1D11E) — anchor centered on staff
    const clefX = system.startX - 35;
    const clefY = system.startY + config.staffHeight * 0.55;
    return (
      <text
        key="clef"
        x={clefX}
        y={clefY}
        fontSize={config.staffHeight * 0.8}
        fontFamily={clefFont}
        fill="black"
        textAnchor="middle"
        dominantBaseline="central"
        className="treble-clef"
      >
        {"\uD834\uDD1E"}
      </text>
    );
  };

  /**
   * Render time signature
   */
  const renderTimeSignature = (system: StaffSystem, systemIndex: number) => {
    if (systemIndex > 0) {
      // Only show time signature on first system
      return null;
    }

    const tsX = system.startX - 20;
    const tsY = system.startY + config.staffLineSpacing * 2;

    return (
      <g key="time-signature">
        <text
          x={tsX}
          y={tsY - 5}
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          fill="black"
        >
          {score.timeSignature.beats}
        </text>
        <text
          x={tsX}
          y={tsY + 15}
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          fill="black"
        >
          {score.timeSignature.beatValue}
        </text>
      </g>
    );
  };

  /**
   * Calculate Y pixel coordinate from staff position
   */
  const staffPositionToY = (staffPosition: number, systemY: number): number => {
    // Staff position 0 = bottom line (E in treble clef)
    // Each position is half a staffLineSpacing
    const bottomLineY = systemY + 4 * config.staffLineSpacing;
    return bottomLineY - staffPosition * (config.staffLineSpacing / 2);
  };

  /**
   * Render ledger lines for notes outside the staff
   */
  const renderLedgerLines = (noteLayout: NoteLayout, system: StaffSystem) => {
    const lines = [];
    const { y, x } = noteLayout;

    // Ledger lines above the staff (staff position > 8)
    if (y > 8) {
      for (let pos = 10; pos <= y; pos += 2) {
        const ledgerY = staffPositionToY(pos, system.startY);
        lines.push(
          <line
            key={`ledger-above-${pos}`}
            x1={x - 8}
            y1={ledgerY}
            x2={x + 8}
            y2={ledgerY}
            stroke="black"
            strokeWidth="1"
          />
        );
      }
    }

    // Ledger lines below the staff (staff position < 0)
    if (y < 0) {
      for (let pos = -2; pos >= y; pos -= 2) {
        const ledgerY = staffPositionToY(pos, system.startY);
        lines.push(
          <line
            key={`ledger-below-${pos}`}
            x1={x - 8}
            y1={ledgerY}
            x2={x + 8}
            y2={ledgerY}
            stroke="black"
            strokeWidth="1"
          />
        );
      }
    }

    return lines;
  };

  /**
   * Render a single note
   */
  const renderNote = (noteLayout: NoteLayout, system: StaffSystem, note: NoteOrRest) => {
    const { x, y, partIndex, noteIndex, isRest } = noteLayout;
    const pixelY = staffPositionToY(y, system.startY);

    const isSelected =
      selection && selection.partIndex === partIndex && selection.noteIndex === noteIndex;

    if (isRest || note.type === "rest") {
      // Render rest symbol — paths are centered at origin
      const restPath = REST_SYMBOLS[note.duration];
      return (
        <g
          key={`note-${partIndex}-${noteIndex}`}
          onClick={() => onNoteClick && onNoteClick(partIndex, noteIndex)}
          style={{ cursor: "pointer" }}
        >
          <path
            d={restPath}
            transform={`translate(${x},${pixelY})`}
            fill="black"
            stroke="black"
            strokeWidth="1.5"
          />
          {isSelected && (
            <rect
              x={x - 12}
              y={pixelY - 14}
              width={24}
              height={28}
              fill="none"
              stroke="blue"
              strokeWidth="2"
              rx="4"
            />
          )}
        </g>
      );
    }

    // Render note (TypeScript now knows note is Note type)
    const color = ULWILA_COLORS[note.pitch];
    const noteheadParams = renderNotehead(isNoteheadFilled(note.duration));
    const stemHeight = 30;
    // Stem direction based on octave: lower octave = up (-1), middle/upper = down (+1)
    const stemDirection = noteLayout.octave === "lower" ? -1 : 1;

    const handleClick = () => {
      if (onNoteClick) {
        onNoteClick(partIndex, noteIndex);
      }
    };

    return (
      <g
        key={`note-${partIndex}-${noteIndex}`}
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      >
        {/* Ledger lines */}
        {renderLedgerLines(noteLayout, system)}

        {/* Notehead */}
        {note.type === "note" && note.accented ? (
          // Accented note: two vertical semicircles
          (() => {
            const { left, right } = getAccentedColors(note.pitch);
            const { rx, ry, filled } = noteheadParams;
            // Left semicircle: arc bulging left (sweep=0, large-arc=1)
            const leftPath = `M ${x} ${pixelY - ry} A ${rx} ${ry} 0 1 0 ${x} ${pixelY + ry} Z`;
            // Right semicircle: arc bulging right (sweep=1, large-arc=1)
            const rightPath = `M ${x} ${pixelY - ry} A ${rx} ${ry} 0 1 1 ${x} ${pixelY + ry} Z`;
            return (
              <>
                <path d={leftPath} fill={filled ? left : "white"} stroke="none" />
                <path d={rightPath} fill={filled ? right : "white"} stroke="none" />
                {/* Full ellipse outline */}
                <ellipse cx={x} cy={pixelY} rx={rx} ry={ry} fill="none" stroke={left} strokeWidth="1.5" />
              </>
            );
          })()
        ) : (
          <ellipse
            cx={x}
            cy={pixelY}
            rx={noteheadParams.rx}
            ry={noteheadParams.ry}
            fill={noteheadParams.filled ? color : "white"}
            stroke={color}
            strokeWidth="1.5"
          />
        )}

        {/* Stem */}
        {hasStem(note.duration) && (
          <line
            x1={x + (stemDirection === 1 ? -noteheadParams.rx : noteheadParams.rx)}
            y1={pixelY}
            x2={x + (stemDirection === 1 ? -noteheadParams.rx : noteheadParams.rx)}
            y2={pixelY + stemDirection * stemHeight}
            stroke="black"
            strokeWidth="1.5"
          />
        )}

        {/* Flags */}
        {getFlagCount(note.duration) > 0 && (
          <g>
            {Array.from({ length: getFlagCount(note.duration) }).map((_, i) => (
              <path
                key={`flag-${i}`}
                d={`M0,0 Q5,${stemDirection * 3} 8,${stemDirection * 5}`}
                transform={`translate(${x + (stemDirection === 1 ? -noteheadParams.rx : noteheadParams.rx)},${pixelY + stemDirection * (stemHeight - i * 4)})`}
                fill="none"
                stroke="black"
                strokeWidth="1.5"
              />
            ))}
          </g>
        )}

        {/* Selection highlight */}
        {isSelected && (
          <rect
            x={x - 12}
            y={pixelY - 12}
            width={24}
            height={24}
            fill="none"
            stroke="blue"
            strokeWidth="2"
            rx="4"
          />
        )}

        {/* Lyrics text below the staff */}
        {note.type === "note" && note.lyric && (
          <text
            x={x}
            y={system.startY + config.staffHeight + 20}
            textAnchor="middle"
            fontSize="12"
            fill="black"
            className="lyric-text"
          >
            {note.lyric}
          </text>
        )}
      </g>
    );
  };

  /**
   * Render bar lines
   */
  const renderBarLines = (system: StaffSystem) => {
    return system.barLines.map((x, index) => (
      <line
        key={`barline-${index}`}
        x1={x}
        y1={system.startY}
        x2={x}
        y2={system.startY + 4 * config.staffLineSpacing}
        stroke="black"
        strokeWidth="1.5"
      />
    ));
  };

  /**
   * Render a complete staff system
   */
  const renderSystem = (system: StaffSystem, systemIndex: number) => {
    // Get notes from score for rendering
    const systemNotes = system.notes.map((noteLayout) => {
      const part = score.parts[noteLayout.partIndex];
      const note = part?.notes[noteLayout.noteIndex];
      return { noteLayout, note };
    });

    return (
      <g key={`system-${systemIndex}`} className="staff-system">
        {/* Staff lines */}
        <g className="staff-lines">{renderStaffLines(system)}</g>

        {/* Clef */}
        {renderClef(system, systemIndex)}

        {/* Time signature */}
        {renderTimeSignature(system, systemIndex)}

        {/* Bar lines */}
        {renderBarLines(system)}

        {/* Notes */}
        {systemNotes.map(({ noteLayout, note }) =>
          note ? renderNote(noteLayout, system, note) : null
        )}
      </g>
    );
  };

  return (
    <svg
      width={width}
      height={svgHeight}
      style={{ display: "block", margin: "0 auto" }}
      data-testid="staff-renderer"
    >
      {layout.systems.map((system, index) => renderSystem(system, index))}
    </svg>
  );
};

export default StaffRenderer;
