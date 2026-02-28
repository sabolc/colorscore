/**
 * ULWILA Color Score Editor — Translation type definitions
 *
 * Defines the shape of all translation dictionaries. Every supported
 * language must implement this interface fully.
 */

import type { Pitch, Octave, Duration } from "../models/types";

export interface Translations {
  toolbar: {
    untitledScore: string;
    scoreTitle: string;
    timeSignature: string;
    clef: string;
    treble: string;
    bass: string;
    staff: string;
    circles: string;
    staffMode: string;
    circlesMode: string;
    renderingMode: string;
    exportPdf: string;
    exportPng: string;
    exportSvg: string;
    save: string;
    load: string;
    saveScore: string;
    loadScore: string;
    loadScoreFile: string;
    language: string;
  };
  noteInput: {
    addNote: string;
    addRest: string;
    addNoteAria: string;
    addRestAria: string;
    duration: string;
    durationSelector: string;
    octave: string;
    octaveSelector: string;
    accented: string;
    toggleAccented: string;
  };
  noteEditor: {
    editNote: string;
    editRest: string;
    noNoteSelected: string;
    pitchSelector: string;
    duration: string;
    durationSelector: string;
    octave: string;
    octaveSelector: string;
    setPitchTo: string;
    delete: string;
    deleteNote: string;
  };
  lyrics: {
    lyric: string;
    syllable: string;
    enterLyric: string;
    lyricInput: string;
  };
  durations: Record<Duration, string>;
  octaves: Record<Octave, string>;
  noteLabels: Record<Pitch, string>;
  export: {
    untitledScore: string;
  };
}

export type SupportedLanguage = "en" | "hu";
