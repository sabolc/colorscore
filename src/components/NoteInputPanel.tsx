/**
 * ULWILA Color Score Editor - Note Input Panel
 *
 * This component provides the user interface for inputting notes and rests.
 */


import type { Pitch, Octave, Duration } from "../models/types";
import { ULWILA_COLORS, PITCH_NAMES, ACCENTED_PITCHES } from "../constants/colors";
import { useScoreDispatch } from "../store/ScoreContext";
import { useSelection, useSelectionDispatch } from "../store/SelectionContext";
import { getSelectedCount } from "../store/selectionReducer";
import { useNoteInput } from "../store/NoteInputContext";
import { useTranslation } from "../i18n";
import styles from "./NoteInputPanel.module.css";

export default function NoteInputPanel() {
  const dispatch = useScoreDispatch();
  const selection = useSelection();
  const selectionDispatch = useSelectionDispatch();
  const { t } = useTranslation();

  /**
   * Where a new element goes: directly after the selected one when exactly one
   * is selected, otherwise appended to the end as before.
   */
  const insertAfter =
    selection && getSelectedCount(selection) === 1 ? selection.focusIndex : undefined;

  /** Move the selection onto the element just inserted, so a run continues. */
  const selectInserted = () => {
    if (insertAfter === undefined || !selection) return;
    selectionDispatch({
      type: "SELECT_NOTE",
      payload: { partIndex: selection.partIndex, noteIndex: insertAfter + 1 },
    });
  };

  // The palette's selection now lives in a context, so the Note Editor can
  // read it when converting a rest into a note.
  const {
    pitch: selectedPitch,
    duration: selectedDuration,
    octave: selectedOctave,
    accented: selectedAccented,
    setPitch: setSelectedPitch,
    setDuration: setSelectedDuration,
    setOctave: setSelectedOctave,
    setAccented: setSelectedAccented,
  } = useNoteInput();

  const canBeAccented = selectedPitch !== null && ACCENTED_PITCHES.includes(selectedPitch);

  const handlePitchClick = (pitch: Pitch) => {
    setSelectedPitch(pitch);
    // Auto-clear accented when switching to a pitch that has no sharp
    if (!ACCENTED_PITCHES.includes(pitch)) {
      setSelectedAccented(false);
    }
  };

  const handleAddNote = () => {
    if (selectedPitch) {
      dispatch({
        type: "ADD_NOTE",
        payload: {
          pitch: selectedPitch,
          octave: selectedOctave,
          duration: selectedDuration,
          ...(selectedAccented ? { accented: true } : {}),
          ...(insertAfter !== undefined ? { insertAfter } : {}),
        },
      });
      selectInserted();
      // Keep pitch selected so user can rapidly add same pitch
    }
  };

  const handleAddRest = () => {
    dispatch({
      type: "ADD_REST",
      payload: {
        duration: selectedDuration,
        ...(insertAfter !== undefined ? { insertAfter } : {}),
      },
    });
    selectInserted();
  };

  const durations: Duration[] = ["whole", "half", "quarter", "eighth", "sixteenth"];
  const octaves: Octave[] = ["lower", "middle", "upper"];

  return (
    <div className={styles.noteInputPanel}>
      {/* Pitch Buttons */}
      <div className={styles.pitchButtons}>
        {PITCH_NAMES.map((pitch) => {
          const solfege = t.noteLabels[pitch];
          return (
            <button
              key={pitch}
              type="button"
              className={`${styles.pitchButton} ${
                selectedPitch === pitch ? styles.selected : ""
              } ${pitch === "H" ? styles.hButton : ""}`}
              style={{ backgroundColor: ULWILA_COLORS[pitch] }}
              onClick={() => handlePitchClick(pitch)}
              aria-label={`${pitch} - ${solfege}`}
              aria-pressed={selectedPitch === pitch}
            >
              {pitch}
            </button>
          );
        })}
      </div>

      {/* Accented Toggle */}
      <div className={styles.accentedRow}>
        <button
          type="button"
          className={`${styles.accentedToggle} ${selectedAccented ? styles.accentedActive : ""}`}
          onClick={() => setSelectedAccented(!selectedAccented)}
          disabled={!canBeAccented}
          aria-label={t.noteInput.toggleAccented}
          aria-pressed={selectedAccented}
        >
          ♯
        </button>
        <span className={styles.accentedLabel}>
          {selectedAccented && selectedPitch ? `${selectedPitch}♯` : t.noteInput.accented}
        </span>
      </div>

      {/* Action Buttons — directly below pitch for quick access */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          className={styles.addNoteButton}
          onClick={handleAddNote}
          disabled={!selectedPitch}
          aria-label={t.noteInput.addNoteAria}
        >
          {t.noteInput.addNote}
        </button>
        <button
          type="button"
          className={styles.restButton}
          onClick={handleAddRest}
          aria-label={t.noteInput.addRestAria}
        >
          {t.noteInput.addRest}
        </button>
      </div>

      {/* Duration Selector */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>{t.noteInput.duration}</label>
        <div className={styles.buttonGroup} role="group" aria-label={t.noteInput.durationSelector}>
          {durations.map((duration) => (
            <button
              key={duration}
              type="button"
              className={`${styles.durationButton} ${
                selectedDuration === duration ? styles.active : ""
              }`}
              onClick={() => setSelectedDuration(duration)}
              aria-pressed={selectedDuration === duration}
            >
              {t.durations[duration]}
            </button>
          ))}
        </div>
      </div>

      {/* Octave Selector */}
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel}>{t.noteInput.octave}</label>
        <div className={styles.buttonGroup} role="group" aria-label={t.noteInput.octaveSelector}>
          {octaves.map((octave) => (
            <button
              key={octave}
              type="button"
              className={`${styles.octaveButton} ${
                selectedOctave === octave ? styles.active : ""
              }`}
              onClick={() => setSelectedOctave(octave)}
              aria-pressed={selectedOctave === octave}
            >
              {t.octaves[octave]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
