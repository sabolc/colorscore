/**
 * ULWILA Color Score Editor - Core Type Definitions
 *
 * This module defines all TypeScript types for the score editor.
 */

export type Pitch = "C" | "D" | "E" | "F" | "G" | "A" | "H";

export type Octave = "lower" | "middle" | "upper";

export type Duration = "whole" | "half" | "quarter" | "eighth" | "sixteenth";

/**
 * Manual override of the derived measure accent: force the mark on, or force
 * it off. Absent means "derive it from the time signature".
 */
export type MeasureAccent = "on" | "off";

export type RenderingMode = "staff" | "circles";

export type Clef = "treble" | "bass";

export interface TimeSignature {
  beats: number;
  beatValue: number;
}

export interface Note {
  type: "note";
  pitch: Pitch;
  octave: Octave;
  duration: Duration;
  lyric?: string;
  accented?: boolean;
  /**
   * Manual override for the measure accent — the black triangle that ULWILA
   * uses instead of bar lines. Absent means the accent is derived from the
   * time signature. Unrelated to `accented`, which marks an altered/sharp
   * pitch drawn as a two-color split circle.
   */
  measureAccent?: MeasureAccent;
  /**
   * A repeated section begins before this element. The paired repeatEnd marks
   * its last element; see SPEC-SCORE-EDITING-R-REPEAT-UNBALANCED for how an
   * unpaired mark reads.
   */
  repeatStart?: boolean;
  /** A repeated section ends after this element. */
  repeatEnd?: boolean;
  /**
   * Visual grouping gap after this note, as published ULWILA scores use to
   * separate words and phrases. Purely typographic: it carries no duration,
   * is not a rest, and does not affect beat counting.
   */
  spaceAfter?: boolean;
  lineBreakAfter?: boolean;
}

export interface Rest {
  type: "rest";
  duration: Duration;
  /**
   * Carried over when a note is converted into this rest, so converting back
   * restores the syllable. Never displayed while the element is a rest — the
   * rest is a container for it, not its owner.
   */
  lyric?: string;
  /**
   * Manual override for the measure accent — the black triangle that ULWILA
   * uses instead of bar lines. Absent means the accent is derived from the
   * time signature. Unrelated to `accented`, which marks an altered/sharp
   * pitch drawn as a two-color split circle.
   */
  measureAccent?: MeasureAccent;
  /**
   * A repeated section begins before this element. The paired repeatEnd marks
   * its last element; see SPEC-SCORE-EDITING-R-REPEAT-UNBALANCED for how an
   * unpaired mark reads.
   */
  repeatStart?: boolean;
  /** A repeated section ends after this element. */
  repeatEnd?: boolean;
  /** Visual grouping gap after this rest. See {@link Note.spaceAfter}. */
  spaceAfter?: boolean;
  lineBreakAfter?: boolean;
}

export type NoteOrRest = Note | Rest;

export interface Part {
  name?: string;
  notes: NoteOrRest[];
}

export interface Score {
  title: string;
  tempo?: number;
  renderingMode: RenderingMode;
  timeSignature: TimeSignature;
  clef: Clef;
  parts: Part[];
}
