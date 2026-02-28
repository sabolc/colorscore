/**
 * ULWILA Color Score Editor - JSON Persistence Tests
 *
 * Unit tests for saveScore and loadScore round-trip fidelity,
 * validation, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { saveScore, loadScore } from "../jsonPersistence";
import type { Score } from "../../models/types";

/**
 * Helper: create a minimal valid Score object.
 */
function makeValidScore(overrides: Partial<Score> = {}): Score {
  return {
    title: "Test Score",
    renderingMode: "staff",
    timeSignature: { beats: 4, beatValue: 4 },
    clef: "treble",
    parts: [
      {
        notes: [
          { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
        ],
      },
    ],
    ...overrides,
  };
}

/**
 * Helper: create a File object from a string.
 */
function makeFile(content: string, name = "score.json"): File {
  return new File([content], name, { type: "application/json" });
}

/**
 * Helper: create a File from a Score object.
 */
function makeScoreFile(score: Score, name = "score.json"): File {
  return makeFile(JSON.stringify(score, null, 2), name);
}

// ─── saveScore ───────────────────────────────────────────────────────────────

describe("saveScore", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let appendChildSpy: MockInstance<[node: Node], Node>;
  let removeChildSpy: MockInstance<[child: Node], Node>;
  let clickedElement: HTMLAnchorElement | null;

  beforeEach(() => {
    clickedElement = null;

    createObjectURLMock = vi
      .fn()
      .mockReturnValue("blob:http://localhost/fake-url");
    revokeObjectURLMock = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).URL.createObjectURL = createObjectURLMock;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).URL.revokeObjectURL = revokeObjectURLMock;

    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => {
        // Capture the anchor so we can inspect it
        if (node instanceof HTMLAnchorElement) {
          clickedElement = node;
          vi.spyOn(node, "click").mockImplementation(() => {});
        }
        return node;
      });

    removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a Blob with correct JSON content", () => {
    const score = makeValidScore();
    saveScore(score);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blob = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json");
  });

  it("generates correct filename from title", () => {
    const score = makeValidScore({ title: "My Song" });
    saveScore(score);

    expect(clickedElement).not.toBeNull();
    expect(clickedElement!.download).toBe("My_Song.json");
  });

  it('uses "score" for empty title', () => {
    const score = makeValidScore({ title: "" });
    saveScore(score);

    expect(clickedElement).not.toBeNull();
    expect(clickedElement!.download).toBe("score.json");
  });

  it("sanitizes special characters in filename", () => {
    const score = makeValidScore({ title: "Für Elise / No. 1" });
    saveScore(score);

    expect(clickedElement).not.toBeNull();
    // Non-alphanumeric chars replaced with underscores
    expect(clickedElement!.download).toBe("F_r_Elise___No__1.json");
    expect(clickedElement!.download).not.toMatch(/[^a-z0-9_.]/i);
  });

  it("triggers download flow: appendChild, click, removeChild, revokeObjectURL", () => {
    const score = makeValidScore();
    saveScore(score);

    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(clickedElement).not.toBeNull();
    expect(clickedElement!.click).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith(
      "blob:http://localhost/fake-url",
    );
  });

  it("serializes all score fields including optional ones", async () => {
    const score = makeValidScore({
      title: "Full Score",
      tempo: 120,
      parts: [
        {
          name: "Soprano",
          notes: [
            {
              type: "note",
              pitch: "A",
              octave: "upper",
              duration: "half",
              lyric: "la",
              accented: true,
            },
            { type: "rest", duration: "quarter" },
          ],
        },
      ],
    });

    saveScore(score);

    // Verify serialized content by reading the blob via FileReader
    // (jsdom does not implement Blob.prototype.text)
    const blob = createObjectURLMock.mock.calls[0][0] as Blob;
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.readAsText(blob);
    });
    const parsed = JSON.parse(text);

    expect(parsed.title).toBe("Full Score");
    expect(parsed.tempo).toBe(120);
    expect(parsed.parts[0].name).toBe("Soprano");
    expect(parsed.parts[0].notes[0].lyric).toBe("la");
    expect(parsed.parts[0].notes[0].accented).toBe(true);
    expect(parsed.parts[0].notes[1].type).toBe("rest");
  });
});

// ─── loadScore ───────────────────────────────────────────────────────────────

describe("loadScore", () => {
  it("parses a valid JSON file and returns a Score", async () => {
    const score = makeValidScore();
    const file = makeScoreFile(score);

    const result = await loadScore(file);

    expect(result.title).toBe("Test Score");
    expect(result.renderingMode).toBe("staff");
    expect(result.timeSignature).toEqual({ beats: 4, beatValue: 4 });
    expect(result.clef).toBe("treble");
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0].notes).toHaveLength(1);
    expect(result.parts[0].notes[0]).toEqual({
      type: "note",
      pitch: "C",
      octave: "middle",
      duration: "quarter",
    });
  });

  it("round-trip: save then load produces identical Score", async () => {
    const original: Score = {
      title: "Round Trip Test",
      tempo: 96,
      renderingMode: "circles",
      timeSignature: { beats: 3, beatValue: 4 },
      clef: "bass",
      parts: [
        {
          name: "Part 1",
          notes: [
            {
              type: "note",
              pitch: "H",
              octave: "lower",
              duration: "whole",
              lyric: "do",
              accented: true,
            },
            { type: "rest", duration: "eighth" },
            {
              type: "note",
              pitch: "G",
              octave: "upper",
              duration: "sixteenth",
            },
          ],
        },
        {
          notes: [
            { type: "note", pitch: "A", octave: "middle", duration: "half" },
          ],
        },
      ],
    };

    // Simulate the round-trip by serializing and creating a File
    const json = JSON.stringify(original, null, 2);
    const file = makeFile(json);

    const loaded = await loadScore(file);
    expect(loaded).toEqual(original);
  });

  it('rejects invalid JSON (throws "Invalid JSON file")', async () => {
    const file = makeFile("this is not { valid json");

    await expect(loadScore(file)).rejects.toThrow("Invalid JSON file");
  });

  it("rejects missing title (throws descriptive error)", async () => {
    const obj = {
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow('"title"');
  });

  it("rejects invalid renderingMode", async () => {
    const obj = {
      title: "Test",
      renderingMode: "dots",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("renderingMode");
  });

  it("rejects invalid clef", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "alto",
      parts: [],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("clef");
  });

  it("rejects missing timeSignature", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      clef: "treble",
      parts: [],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("timeSignature");
  });

  it("rejects invalid timeSignature (non-numeric beats)", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: "four", beatValue: 4 },
      clef: "treble",
      parts: [],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("timeSignature");
  });

  it("rejects missing parts array", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow('"parts"');
  });

  it("rejects invalid pitch in a note", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            { type: "note", pitch: "X", octave: "middle", duration: "quarter" },
          ],
        },
      ],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("pitch");
  });

  it("rejects invalid octave in a note", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            { type: "note", pitch: "C", octave: "high", duration: "quarter" },
          ],
        },
      ],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("octave");
  });

  it("rejects invalid duration in a note", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            {
              type: "note",
              pitch: "C",
              octave: "middle",
              duration: "triplet",
            },
          ],
        },
      ],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("duration");
  });

  it("rejects invalid duration in a rest", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [{ notes: [{ type: "rest", duration: "breve" }] }],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("duration");
  });

  it("rejects invalid note type", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [{ type: "chord", pitch: "C", octave: "middle", duration: "quarter" }],
        },
      ],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("type");
  });

  it("rejects non-object input (array)", async () => {
    const file = makeFile(JSON.stringify([1, 2, 3]));

    await expect(loadScore(file)).rejects.toThrow("object");
  });

  it("rejects null input", async () => {
    const file = makeFile("null");

    await expect(loadScore(file)).rejects.toThrow("object");
  });

  it("rejects primitive input", async () => {
    const file = makeFile('"just a string"');

    await expect(loadScore(file)).rejects.toThrow("object");
  });

  it("preserves lyrics and optional fields", async () => {
    const score = makeValidScore({
      tempo: 80,
      parts: [
        {
          name: "Voice",
          notes: [
            {
              type: "note",
              pitch: "D",
              octave: "upper",
              duration: "eighth",
              lyric: "Hel-",
              accented: true,
            },
            {
              type: "note",
              pitch: "E",
              octave: "upper",
              duration: "eighth",
              lyric: "lo",
            },
            { type: "rest", duration: "quarter" },
          ],
        },
      ],
    });

    const file = makeScoreFile(score);
    const loaded = await loadScore(file);

    expect(loaded.tempo).toBe(80);
    expect(loaded.parts[0].name).toBe("Voice");

    const note0 = loaded.parts[0].notes[0];
    expect(note0.type).toBe("note");
    if (note0.type === "note") {
      expect(note0.lyric).toBe("Hel-");
      expect(note0.accented).toBe(true);
    }

    const note1 = loaded.parts[0].notes[1];
    expect(note1.type).toBe("note");
    if (note1.type === "note") {
      expect(note1.lyric).toBe("lo");
      expect(note1.accented).toBeUndefined();
    }
  });

  it("rejects a part without notes array", async () => {
    const obj = {
      title: "Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [{ name: "Solo" }],
    };
    const file = makeFile(JSON.stringify(obj));

    await expect(loadScore(file)).rejects.toThrow("notes");
  });

  it("accepts empty parts array", async () => {
    const score = makeValidScore({ parts: [] });
    const file = makeScoreFile(score);

    const loaded = await loadScore(file);
    expect(loaded.parts).toEqual([]);
  });

  it("accepts a part with empty notes array", async () => {
    const score = makeValidScore({ parts: [{ notes: [] }] });
    const file = makeScoreFile(score);

    const loaded = await loadScore(file);
    expect(loaded.parts).toHaveLength(1);
    expect(loaded.parts[0].notes).toEqual([]);
  });

  it("validates all seven valid pitches", async () => {
    const pitches = ["C", "D", "E", "F", "G", "A", "H"] as const;

    for (const pitch of pitches) {
      const score = makeValidScore({
        parts: [
          {
            notes: [
              { type: "note", pitch, octave: "middle", duration: "quarter" },
            ],
          },
        ],
      });
      const file = makeScoreFile(score);
      const loaded = await loadScore(file);
      expect(loaded.parts[0].notes[0]).toMatchObject({ pitch });
    }
  });

  it("validates all three valid octaves", async () => {
    const octaves = ["lower", "middle", "upper"] as const;

    for (const octave of octaves) {
      const score = makeValidScore({
        parts: [
          {
            notes: [
              { type: "note", pitch: "C", octave, duration: "quarter" },
            ],
          },
        ],
      });
      const file = makeScoreFile(score);
      const loaded = await loadScore(file);
      expect(loaded.parts[0].notes[0]).toMatchObject({ octave });
    }
  });

  it("validates all five valid durations", async () => {
    const durations = [
      "whole",
      "half",
      "quarter",
      "eighth",
      "sixteenth",
    ] as const;

    for (const duration of durations) {
      const score = makeValidScore({
        parts: [
          {
            notes: [
              { type: "note", pitch: "C", octave: "middle", duration },
            ],
          },
        ],
      });
      const file = makeScoreFile(score);
      const loaded = await loadScore(file);
      expect(loaded.parts[0].notes[0]).toMatchObject({ duration });
    }
  });
});
