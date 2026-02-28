/**
 * ULWILA Color Score Editor - JSON Persistence
 *
 * Save and load Score files as JSON.
 * Provides download-to-file and file-to-Score round-trip fidelity.
 */

import type {
  Score,
  Pitch,
  Octave,
  Duration,
  RenderingMode,
  Clef,
  NoteOrRest,
  Part,
} from "../models/types";

const VALID_PITCHES: readonly Pitch[] = [
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "H",
] as const;

const VALID_OCTAVES: readonly Octave[] = [
  "lower",
  "middle",
  "upper",
] as const;

const VALID_DURATIONS: readonly Duration[] = [
  "whole",
  "half",
  "quarter",
  "eighth",
  "sixteenth",
] as const;

const VALID_RENDERING_MODES: readonly RenderingMode[] = [
  "staff",
  "circles",
] as const;

const VALID_CLEFS: readonly Clef[] = ["treble", "bass"] as const;

/**
 * Sanitize a title string into a safe filename.
 * Replaces any non-alphanumeric character with an underscore.
 */
function sanitizeFilename(title: string): string {
  const sanitized = title.replace(/[^a-z0-9]/gi, "_");
  return sanitized || "score";
}

/**
 * Save a score as a JSON file download.
 * Creates a Blob with the serialized Score and triggers a browser download
 * via a temporary anchor element.
 */
export function saveScore(score: Score): void {
  const json = JSON.stringify(score, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const filename = sanitizeFilename(score.title || "score") + ".json";

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate and parse a NoteOrRest entry from untrusted input.
 */
function validateNoteOrRest(
  entry: unknown,
  partIndex: number,
  noteIndex: number,
): NoteOrRest {
  if (typeof entry !== "object" || entry === null) {
    throw new Error(
      `parts[${partIndex}].notes[${noteIndex}]: must be an object`,
    );
  }

  const obj = entry as Record<string, unknown>;
  const prefix = `parts[${partIndex}].notes[${noteIndex}]`;

  if (obj.type === "note") {
    // Validate pitch
    if (
      typeof obj.pitch !== "string" ||
      !(VALID_PITCHES as readonly string[]).includes(obj.pitch)
    ) {
      throw new Error(
        `${prefix}: invalid pitch "${String(obj.pitch)}" — expected one of ${VALID_PITCHES.join(", ")}`,
      );
    }

    // Validate octave
    if (
      typeof obj.octave !== "string" ||
      !(VALID_OCTAVES as readonly string[]).includes(obj.octave)
    ) {
      throw new Error(
        `${prefix}: invalid octave "${String(obj.octave)}" — expected one of ${VALID_OCTAVES.join(", ")}`,
      );
    }

    // Validate duration
    if (
      typeof obj.duration !== "string" ||
      !(VALID_DURATIONS as readonly string[]).includes(obj.duration)
    ) {
      throw new Error(
        `${prefix}: invalid duration "${String(obj.duration)}" — expected one of ${VALID_DURATIONS.join(", ")}`,
      );
    }

    // Validate optional lyric
    if (obj.lyric !== undefined && typeof obj.lyric !== "string") {
      throw new Error(`${prefix}: lyric must be a string if provided`);
    }

    // Validate optional accented
    if (obj.accented !== undefined && typeof obj.accented !== "boolean") {
      throw new Error(`${prefix}: accented must be a boolean if provided`);
    }

    const note: NoteOrRest = {
      type: "note",
      pitch: obj.pitch as Pitch,
      octave: obj.octave as Octave,
      duration: obj.duration as Duration,
    };

    if (obj.lyric !== undefined) {
      (note as { lyric: string }).lyric = obj.lyric as string;
    }
    if (obj.accented !== undefined) {
      (note as { accented: boolean }).accented = obj.accented as boolean;
    }

    return note;
  }

  if (obj.type === "rest") {
    // Validate duration
    if (
      typeof obj.duration !== "string" ||
      !(VALID_DURATIONS as readonly string[]).includes(obj.duration)
    ) {
      throw new Error(
        `${prefix}: invalid duration "${String(obj.duration)}" — expected one of ${VALID_DURATIONS.join(", ")}`,
      );
    }

    return {
      type: "rest",
      duration: obj.duration as Duration,
    };
  }

  throw new Error(
    `${prefix}: invalid type "${String(obj.type)}" — expected "note" or "rest"`,
  );
}

/**
 * Validate and parse a Part entry from untrusted input.
 */
function validatePart(entry: unknown, index: number): Part {
  if (typeof entry !== "object" || entry === null) {
    throw new Error(`parts[${index}]: must be an object`);
  }

  const obj = entry as Record<string, unknown>;

  if (!Array.isArray(obj.notes)) {
    throw new Error(`parts[${index}]: must have a "notes" array`);
  }

  // Validate optional name
  if (obj.name !== undefined && typeof obj.name !== "string") {
    throw new Error(`parts[${index}]: name must be a string if provided`);
  }

  const notes = obj.notes.map((n: unknown, ni: number) =>
    validateNoteOrRest(n, index, ni),
  );

  const part: Part = { notes };
  if (obj.name !== undefined) {
    part.name = obj.name as string;
  }

  return part;
}

/**
 * Read a File/Blob as text using FileReader.
 * This is used instead of Blob.prototype.text() for broader compatibility
 * (e.g., jsdom test environments where .text() is not available).
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Load a score from a JSON file.
 * Validates the structure and returns a Score object.
 * Throws a descriptive Error on invalid input.
 */
export async function loadScore(file: File): Promise<Score> {
  const text = await readFileAsText(file);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON file");
  }

  // Must be a non-null object (not array, not primitive)
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Score must be a JSON object");
  }

  const obj = parsed as Record<string, unknown>;

  // title
  if (typeof obj.title !== "string") {
    throw new Error('Score must have a "title" string');
  }

  // renderingMode
  if (
    typeof obj.renderingMode !== "string" ||
    !(VALID_RENDERING_MODES as readonly string[]).includes(obj.renderingMode)
  ) {
    throw new Error(
      `Invalid renderingMode "${String(obj.renderingMode)}" — expected one of ${VALID_RENDERING_MODES.join(", ")}`,
    );
  }

  // clef
  if (
    typeof obj.clef !== "string" ||
    !(VALID_CLEFS as readonly string[]).includes(obj.clef)
  ) {
    throw new Error(
      `Invalid clef "${String(obj.clef)}" — expected one of ${VALID_CLEFS.join(", ")}`,
    );
  }

  // timeSignature
  if (typeof obj.timeSignature !== "object" || obj.timeSignature === null) {
    throw new Error('Score must have a "timeSignature" object');
  }

  const ts = obj.timeSignature as Record<string, unknown>;
  if (typeof ts.beats !== "number" || typeof ts.beatValue !== "number") {
    throw new Error(
      "timeSignature must have numeric \"beats\" and \"beatValue\"",
    );
  }

  // parts
  if (!Array.isArray(obj.parts)) {
    throw new Error('Score must have a "parts" array');
  }

  const parts = obj.parts.map((p: unknown, i: number) => validatePart(p, i));

  // Build validated Score
  const score: Score = {
    title: obj.title,
    renderingMode: obj.renderingMode as RenderingMode,
    timeSignature: { beats: ts.beats, beatValue: ts.beatValue },
    clef: obj.clef as Clef,
    parts,
  };

  // Preserve optional tempo
  if (obj.tempo !== undefined) {
    if (typeof obj.tempo !== "number") {
      throw new Error("tempo must be a number if provided");
    }
    score.tempo = obj.tempo;
  }

  return score;
}
