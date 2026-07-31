/**
 * ULWILA Color Score Editor - Note Editor Component
 *
 * This component provides controls for editing a selected note's pitch,
 * duration, and octave, as well as deleting the selected note/rest.
 * Supports both single-note and range (multi-note) selection.
 */

import type { Pitch, Octave, Duration } from "../models/types";
import { ULWILA_COLORS, PITCH_NAMES, ACCENTED_PITCHES } from "../constants/colors";
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
  const isAccented = isNote && Boolean(noteOrRest.accented);
  const canBeAccented = currentPitch !== null && ACCENTED_PITCHES.includes(currentPitch);
  const currentDuration = noteOrRest.duration;

  const handlePitchChange = (pitch: Pitch) => {
    // E and H have no sharp, so retuning onto one drops the flag with it
    const changes = ACCENTED_PITCHES.includes(pitch)
      ? { pitch }
      : { pitch, accented: undefined };
    scoreDispatch({
      type: "EDIT_NOTE",
      payload: { partIndex, noteIndex, changes },
    });
  };

  const handleToggleAccented = () => {
    scoreDispatch({
      type: "EDIT_NOTE",
      payload: {
        partIndex,
        noteIndex,
        // undefined rather than false, so the flag stays out of exported JSON
        changes: { accented: isAccented ? undefined : true },
      },
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

  const handleToggleRepeat = (edge: "start" | "end") => {
    scoreDispatch({
      type: edge === "start" ? "TOGGLE_REPEAT_START" : "TOGGLE_REPEAT_END",
      payload: { partIndex, noteIndex },
    });
  };

  const handleCycleMeasureAccent = () => {
    scoreDispatch({
      type: "CYCLE_MEASURE_ACCENT",
      payload: { partIndex, noteIndex },
    });
  };

  const handleToggleSpace = () => {
    scoreDispatch({
      type: "TOGGLE_SPACE",
      payload: { partIndex, noteIndex },
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

      {/* Sharp toggle — the same control the note palette offers when adding */}
      <button
        type="button"
        className={`${styles.accentedButton} ${isAccented ? styles.accentedActive : ""}`}
        onClick={handleToggleAccented}
        disabled={isRest || !canBeAccented}
        aria-label={t.noteEditor.toggleAccented}
        aria-pressed={isAccented}
      >
        {t.noteEditor.accented} ♯
      </button>

      {/* Marker group — kept on shared rows; this panel is already the tallest
          thing in the editor and two more full-width rows would grow it again */}
      <div className={styles.markerGroup} role="group" aria-label={t.noteEditor.markersLabel}>
      {/* Measure accent — three states, so a pressed flag cannot describe it */}
      <button
        type="button"
        className={`${styles.markerButton} ${
          noteOrRest.measureAccent === "on"
            ? styles.measureAccentOn
            : noteOrRest.measureAccent === "off"
              ? styles.measureAccentOff
              : ""
        }`}
        onClick={handleCycleMeasureAccent}
        aria-label={`${t.noteEditor.cycleMeasureAccent} — ${
          noteOrRest.measureAccent === "on"
            ? t.noteEditor.measureAccentOn
            : noteOrRest.measureAccent === "off"
              ? t.noteEditor.measureAccentOff
              : t.noteEditor.measureAccentAuto
        }`}
      >
        {t.noteEditor.measureAccent} ▼{" "}
        {noteOrRest.measureAccent === "on"
          ? t.noteEditor.measureAccentOn
          : noteOrRest.measureAccent === "off"
            ? t.noteEditor.measureAccentOff
            : t.noteEditor.measureAccentAuto}
      </button>

      {/* Grouping Gap Toggle — a plain space, not a rest */}
      <button
        type="button"
        className={`${styles.markerButton} ${
          noteOrRest.spaceAfter ? styles.markerActive : ""
        }`}
        onClick={handleToggleSpace}
        aria-label={t.noteEditor.toggleSpace}
        aria-pressed={!!noteOrRest.spaceAfter}
      >
        {t.noteEditor.space} ␣
      </button>

      {/* Line Break Toggle */}
      <button
        type="button"
        className={`${styles.markerButton} ${
          noteOrRest.lineBreakAfter ? styles.markerActive : ""
        }`}
        onClick={handleToggleLineBreak}
        aria-label={t.noteEditor.toggleLineBreak}
        aria-pressed={!!noteOrRest.lineBreakAfter}
      >
        {t.noteEditor.lineBreak} ↵
      </button>

      <button
        type="button"
        className={`${styles.markerButton} ${
          noteOrRest.repeatStart ? styles.markerActive : ""
        }`}
        onClick={() => handleToggleRepeat("start")}
        aria-label={t.noteEditor.toggleRepeatStart}
        aria-pressed={!!noteOrRest.repeatStart}
      >
        𝄆 {t.noteEditor.repeatStart}
      </button>

      <button
        type="button"
        className={`${styles.markerButton} ${
          noteOrRest.repeatEnd ? styles.markerActive : ""
        }`}
        onClick={() => handleToggleRepeat("end")}
        aria-label={t.noteEditor.toggleRepeatEnd}
        aria-pressed={!!noteOrRest.repeatEnd}
      >
        𝄇 {t.noteEditor.repeatEnd}
      </button>
      </div>

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
