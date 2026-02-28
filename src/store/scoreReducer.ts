/**
 * ULWILA Color Score Editor - Score Reducer
 *
 * This module defines the state management logic for the musical score.
 */

import type {
  Score,
  Note,
  Rest,
  Duration,
  Pitch,
  Octave,
  TimeSignature,
  Clef,
  RenderingMode,
} from "../models/types";

export type ScoreAction =
  | {
      type: "ADD_NOTE";
      payload: { pitch: Pitch; octave: Octave; duration: Duration; accented?: boolean };
    }
  | { type: "ADD_REST"; payload: { duration: Duration } }
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_TIME_SIGNATURE"; payload: TimeSignature }
  | { type: "SET_CLEF"; payload: Clef }
  | { type: "SET_RENDERING_MODE"; payload: RenderingMode }
  | { type: "LOAD_SCORE"; payload: Score }
  | {
      type: "EDIT_NOTE";
      payload: {
        partIndex: number;
        noteIndex: number;
        changes: Partial<Pick<Note, "pitch" | "octave" | "duration" | "accented">>;
      };
    }
  | { type: "DELETE_NOTE"; payload: { partIndex: number; noteIndex: number } }
  | {
      type: "REORDER_NOTE";
      payload: { partIndex: number; fromIndex: number; toIndex: number };
    }
  | {
      type: "SET_LYRIC";
      payload: { partIndex: number; noteIndex: number; lyric: string };
    };

export const initialScoreState: Score = {
  title: "",
  renderingMode: "staff",
  timeSignature: { beats: 4, beatValue: 4 },
  clef: "treble",
  parts: [{ notes: [] }],
};

export function scoreReducer(state: Score, action: ScoreAction): Score {
  switch (action.type) {
    case "ADD_NOTE": {
      const newNote: Note = {
        type: "note",
        pitch: action.payload.pitch,
        octave: action.payload.octave,
        duration: action.payload.duration,
        ...(action.payload.accented ? { accented: true } : {}),
      };

      return {
        ...state,
        parts: [
          {
            ...state.parts[0],
            notes: [...state.parts[0].notes, newNote],
          },
          ...state.parts.slice(1),
        ],
      };
    }

    case "ADD_REST": {
      const newRest: Rest = {
        type: "rest",
        duration: action.payload.duration,
      };

      return {
        ...state,
        parts: [
          {
            ...state.parts[0],
            notes: [...state.parts[0].notes, newRest],
          },
          ...state.parts.slice(1),
        ],
      };
    }

    case "SET_TITLE": {
      return {
        ...state,
        title: action.payload,
      };
    }

    case "SET_TIME_SIGNATURE": {
      return {
        ...state,
        timeSignature: action.payload,
      };
    }

    case "SET_CLEF": {
      return {
        ...state,
        clef: action.payload,
      };
    }

    case "SET_RENDERING_MODE": {
      return {
        ...state,
        renderingMode: action.payload,
      };
    }

    case "LOAD_SCORE": {
      return action.payload;
    }

    case "EDIT_NOTE": {
      const { partIndex, noteIndex, changes } = action.payload;
      const part = state.parts[partIndex];
      if (!part) return state;
      const existingNote = part.notes[noteIndex];
      if (!existingNote || existingNote.type !== "note") return state;

      const updatedNote: Note = { ...existingNote, ...changes };
      const newNotes = [...part.notes];
      newNotes[noteIndex] = updatedNote;

      const newParts = [...state.parts];
      newParts[partIndex] = { ...part, notes: newNotes };

      return { ...state, parts: newParts };
    }

    case "DELETE_NOTE": {
      const { partIndex, noteIndex } = action.payload;
      const part = state.parts[partIndex];
      if (!part) return state;

      const newNotes = part.notes.filter((_, i) => i !== noteIndex);
      const newParts = [...state.parts];
      newParts[partIndex] = { ...part, notes: newNotes };

      return { ...state, parts: newParts };
    }

    case "REORDER_NOTE": {
      const { partIndex, fromIndex, toIndex } = action.payload;
      const part = state.parts[partIndex];
      if (!part) return state;

      const newNotes = [...part.notes];
      const [movedNote] = newNotes.splice(fromIndex, 1);
      newNotes.splice(toIndex, 0, movedNote);

      const newParts = [...state.parts];
      newParts[partIndex] = { ...part, notes: newNotes };

      return { ...state, parts: newParts };
    }

    case "SET_LYRIC": {
      const { partIndex, noteIndex, lyric } = action.payload;
      const part = state.parts[partIndex];
      if (!part) return state;
      const existingNote = part.notes[noteIndex];
      if (!existingNote || existingNote.type !== "note") return state;

      const updatedNote: Note = lyric
        ? { ...existingNote, lyric }
        : { ...existingNote };
      if (!lyric) {
        delete updatedNote.lyric;
      }

      const newNotes = [...part.notes];
      newNotes[noteIndex] = updatedNote;

      const newParts = [...state.parts];
      newParts[partIndex] = { ...part, notes: newNotes };

      return { ...state, parts: newParts };
    }

    default:
      return state;
  }
}
