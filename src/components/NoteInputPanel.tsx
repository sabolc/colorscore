/**
 * ULWILA Color Score Editor - Note Input Panel
 *
 * This component provides the user interface for inputting notes and rests.
 */

import { useState } from "react";
import type { Pitch, Octave, Duration } from "../models/types";
import { ULWILA_COLORS, PITCH_NAMES, ACCENTED_PITCHES } from "../constants/colors";
import { useScoreDispatch } from "../store/ScoreContext";
import { useTranslation } from "../i18n";
import styles from "./NoteInputPanel.module.css";

export default function NoteInputPanel() {
  const dispatch = useScoreDispatch();
  const { t } = useTranslation();

  // Local state for selected parameters
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration>("quarter");
  const [selectedOctave, setSelectedOctave] = useState<Octave>("middle");
  const [selectedAccented, setSelectedAccented] = useState(false);

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
        },
      });
      // Keep pitch selected so user can rapidly add same pitch
    }
  };

  const handleAddRest = () => {
    dispatch({
      type: "ADD_REST",
      payload: {
        duration: selectedDuration,
      },
    });
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
