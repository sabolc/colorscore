/**
 * ULWILA Color Score Editor - Note Editor Component
 *
 * This component provides controls for editing a selected note's pitch,
 * duration, and octave, as well as deleting the selected note/rest.
 * Supports both single-note and range (multi-note) selection.
 */

import type { Pitch, Octave, Duration } from "../models/types";
import { ULWILA_COLORS, PITCH_NAMES } from "../constants/colors";
import { useScore, useScoreDispatch } from "../store/ScoreContext";
import { useSelection, useSelectionDispatch } from "../store/SelectionContext";
import { getSelectedCount, getSelectionRange } from "../store/selectionReducer";
import { useTranslation } from "../i18n";
import styles from "./NoteEditor.module.css";

const DURATION_VALUES: Duration[] = ["whole", "half", "quarter", "eighth", "sixteenth"];
const OCTAVE_VALUES: Octave[] = ["lower", "middle", "upper"];

export function NoteEditor() {
  const score = useScore();
  const scoreDispatch = useScoreDispatch();
  const selection = useSelection();
  const selectionDispatch = useSelectionDispatch();
  const { t } = useTranslation();

  if (!selection) {
    return (
      <div className={styles.noteEditor} data-testid="note-editor">
        <p className={styles.placeholder}>{t.noteEditor.noNoteSelected}</p>
      </div>
    );
  }

  const { partIndex, focusIndex } = selection;
  const selectedCount = getSelectedCount(selection);

  // Multi-selection mode: show summary + delete only
  if (selectedCount > 1) {
    const { start, end } = getSelectionRange(selection);

    const handleDeleteRange = () => {
      scoreDispatch({
        type: "DELETE_NOTES",
        payload: { partIndex, startIndex: start, endIndex: end },
      });
      selectionDispatch({ type: "CLEAR_SELECTION" });
    };

    return (
      <div className={styles.noteEditor} data-testid="note-editor">
        <h3 className={styles.heading}>
          {t.noteEditor.multipleSelected.replace("{count}", String(selectedCount))}
        </h3>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDeleteRange}
          aria-label={t.noteEditor.deleteSelected}
        >
          {t.noteEditor.deleteSelected}
        </button>
      </div>
    );
  }

  // Single selection mode
  const noteIndex = focusIndex;
  const part = score.parts[partIndex];
  const noteOrRest = part?.notes[noteIndex];

  if (!noteOrRest) {
    return (
      <div className={styles.noteEditor} data-testid="note-editor">
        <p className={styles.placeholder}>{t.noteEditor.noNoteSelected}</p>
      </div>
    );
  }

  const isRest = noteOrRest.type === "rest";
  const isNote = noteOrRest.type === "note";
  const currentPitch = isNote ? noteOrRest.pitch : null;
  const currentOctave = isNote ? noteOrRest.octave : null;
  const currentDuration = noteOrRest.duration;

  const handlePitchChange = (pitch: Pitch) => {
    scoreDispatch({
      type: "EDIT_NOTE",
      payload: { partIndex, noteIndex, changes: { pitch } },
    });
  };

  const handleDurationChange = (duration: Duration) => {
    if (isNote) {
      scoreDispatch({
        type: "EDIT_NOTE",
        payload: { partIndex, noteIndex, changes: { duration } },
      });
    }
  };

  const handleOctaveChange = (octave: Octave) => {
    scoreDispatch({
      type: "EDIT_NOTE",
      payload: { partIndex, noteIndex, changes: { octave } },
    });
  };

  const handleToggleLineBreak = () => {
    scoreDispatch({
      type: "TOGGLE_LINE_BREAK",
      payload: { partIndex, noteIndex },
    });
  };

  const handleDelete = () => {
    scoreDispatch({
      type: "DELETE_NOTE",
      payload: { partIndex, noteIndex },
    });
    selectionDispatch({ type: "CLEAR_SELECTION" });
  };

  return (
    <div className={styles.noteEditor} data-testid="note-editor">
      <h3 className={styles.heading}>
        {isRest ? t.noteEditor.editRest : t.noteEditor.editNote}
      </h3>

      {/* Pitch Controls */}
      <div className={styles.pitchSection}>
        {isNote && currentPitch && (
          <div className={styles.currentPitch}>
            <span
              className={styles.pitchIndicator}
              style={{ backgroundColor: ULWILA_COLORS[currentPitch] }}
            />
            <span>
              {t.noteLabels[currentPitch]}
            </span>
          </div>
        )}
        <div className={styles.pitchButtons} role="group" aria-label={t.noteEditor.pitchSelector}>
          {PITCH_NAMES.map((pitch) => (
            <button
              key={pitch}
              type="button"
              className={`${styles.pitchButton} ${
                currentPitch === pitch ? styles.activePitch : ""
              } ${pitch === "H" ? styles.hButton : ""}`}
              style={{ backgroundColor: ULWILA_COLORS[pitch] }}
              onClick={() => handlePitchChange(pitch)}
              disabled={isRest}
              aria-label={`${t.noteEditor.setPitchTo} ${pitch} - ${t.noteLabels[pitch]}`}
              aria-pressed={currentPitch === pitch}
            >
              {pitch}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selector */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel} htmlFor="note-editor-duration">
          {t.noteEditor.duration}
        </label>
        <select
          id="note-editor-duration"
          className={styles.selectControl}
          value={currentDuration}
          onChange={(e) => handleDurationChange(e.target.value as Duration)}
          aria-label={t.noteEditor.durationSelector}
        >
          {DURATION_VALUES.map((d) => (
            <option key={d} value={d}>
              {t.durations[d]}
            </option>
          ))}
        </select>
      </div>

      {/* Octave Selector */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel} htmlFor="note-editor-octave">
          {t.noteEditor.octave}
        </label>
        <select
          id="note-editor-octave"
          className={styles.selectControl}
          value={currentOctave ?? "middle"}
          onChange={(e) => handleOctaveChange(e.target.value as Octave)}
          disabled={isRest}
          aria-label={t.noteEditor.octaveSelector}
        >
          {OCTAVE_VALUES.map((o) => (
            <option key={o} value={o}>
              {t.octaves[o]}
            </option>
          ))}
        </select>
      </div>

      {/* Line Break Toggle */}
      <button
        type="button"
        className={`${styles.lineBreakButton} ${
          noteOrRest.lineBreakAfter ? styles.lineBreakActive : ""
        }`}
        onClick={handleToggleLineBreak}
        aria-label={t.noteEditor.toggleLineBreak}
        aria-pressed={!!noteOrRest.lineBreakAfter}
      >
        {t.noteEditor.lineBreak} ↵
      </button>

      {/* Delete Button */}
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleDelete}
        aria-label={t.noteEditor.deleteNote}
      >
        {t.noteEditor.delete}
      </button>
    </div>
  );
}
