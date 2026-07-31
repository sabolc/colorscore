/**
 * ULWILA Color Score Editor - Note Input Selection Context
 *
 * Holds what the note palette currently has chosen: pitch, duration, octave and
 * the sharp flag. This lived in NoteInputPanel's local state until the Note
 * Editor needed it too — converting a rest into a note has to decide which note,
 * and the palette's selection is already the app's answer to "what note would
 * you add right now".
 *
 * Only these four values are lifted; the palette itself stays where it is.
 */

import React, { createContext, useContext, useMemo, useState } from "react";
import type { Duration, Octave, Pitch } from "../models/types";

export interface NoteInputSelection {
  pitch: Pitch | null;
  duration: Duration;
  octave: Octave;
  accented: boolean;
}

interface NoteInputContextValue extends NoteInputSelection {
  setPitch: (pitch: Pitch | null) => void;
  setDuration: (duration: Duration) => void;
  setOctave: (octave: Octave) => void;
  setAccented: (accented: boolean) => void;
}

const NoteInputContext = createContext<NoteInputContextValue | null>(null);

export function NoteInputProvider({ children }: { children: React.ReactNode }) {
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [duration, setDuration] = useState<Duration>("quarter");
  const [octave, setOctave] = useState<Octave>("middle");
  const [accented, setAccented] = useState(false);

  const value = useMemo(
    () => ({
      pitch,
      duration,
      octave,
      accented,
      setPitch,
      setDuration,
      setOctave,
      setAccented,
    }),
    [pitch, duration, octave, accented],
  );

  return <NoteInputContext.Provider value={value}>{children}</NoteInputContext.Provider>;
}

/**
 * Read the palette's current selection. Falls back to a sensible default when
 * no provider is mounted, so a component can be tested in isolation.
 */
export function useNoteInput(): NoteInputContextValue {
  const context = useContext(NoteInputContext);
  if (context) return context;
  return {
    pitch: null,
    duration: "quarter",
    octave: "middle",
    accented: false,
    setPitch: () => {},
    setDuration: () => {},
    setOctave: () => {},
    setAccented: () => {},
  };
}
