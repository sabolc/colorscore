/**
 * ULWILA Color Score Editor - Lyrics Editor Component
 *
 * This component provides a text input for attaching lyrics (syllables)
 * to the currently selected note. Lyrics only apply to notes, not rests.
 */

import { useScore, useScoreDispatch } from "../store/ScoreContext";
import { useSelection } from "../store/SelectionContext";
import { useTranslation } from "../i18n";
import styles from "./LyricsEditor.module.css";

export function LyricsEditor() {
  const score = useScore();
  const selection = useSelection();
  const dispatch = useScoreDispatch();
  const { t } = useTranslation();

  if (!selection) {
    return null;
  }

  const { partIndex, noteIndex } = selection;
  const part = score.parts[partIndex];
  const noteOrRest = part?.notes[noteIndex];

  if (!noteOrRest) {
    return null;
  }

  const isRest = noteOrRest.type === "rest";
  const currentLyric =
    noteOrRest.type === "note" ? noteOrRest.lyric ?? "" : "";

  const handleLyricChange = (value: string) => {
    dispatch({
      type: "SET_LYRIC",
      payload: { partIndex, noteIndex, lyric: value },
    });
  };

  if (isRest) {
    return null;
  }

  return (
    <div className={styles.lyricsEditor} data-testid="lyrics-editor">
      <h3 className={styles.heading}>{t.lyrics.lyric}</h3>
      <div className={styles.controlGroup}>
        <label className={styles.controlLabel} htmlFor="lyrics-editor-input">
          {t.lyrics.syllable}
        </label>
        <input
          id="lyrics-editor-input"
          type="text"
          className={styles.lyricInput}
          value={currentLyric}
          onChange={(e) => handleLyricChange(e.target.value)}
          placeholder={t.lyrics.enterLyric}
          aria-label={t.lyrics.lyricInput}
        />
      </div>
    </div>
  );
}
