/**
 * ULWILA Color Score Editor - Core Type Definitions
 *
 * This module defines all TypeScript types for the score editor.
 */

export type Pitch = "C" | "D" | "E" | "F" | "G" | "A" | "H";

export type Octave = "lower" | "middle" | "upper";

export type Duration = "whole" | "half" | "quarter" | "eighth" | "sixteenth";

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
}

export interface Rest {
  type: "rest";
  duration: Duration;
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
