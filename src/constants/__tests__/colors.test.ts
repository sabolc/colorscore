/**
 * ULWILA Color Score Editor - Color Constants Tests
 *
 * Unit tests for the ULWILA color mapping system.
 */

import { describe, it, expect } from "vitest";
import { ULWILA_COLORS, PITCH_NAMES, NOTE_LABELS } from "../colors";

describe("ULWILA_COLORS", () => {
  it("should have exact hex values for all 7 pitches", () => {
    expect(ULWILA_COLORS.C).toBe("#1A1A1A");
    expect(ULWILA_COLORS.D).toBe("#8B4513");
    expect(ULWILA_COLORS.E).toBe("#0000CD");
    expect(ULWILA_COLORS.F).toBe("#228B22");
    expect(ULWILA_COLORS.G).toBe("#DC143C");
    expect(ULWILA_COLORS.A).toBe("#FF8C00");
    expect(ULWILA_COLORS.H).toBe("#FFD700");
  });

  it("should have all 7 color entries", () => {
    const colorKeys = Object.keys(ULWILA_COLORS);
    expect(colorKeys).toHaveLength(7);
  });
});

describe("PITCH_NAMES", () => {
  it("should have exactly 7 entries", () => {
    expect(PITCH_NAMES).toHaveLength(7);
  });

  it("should contain all pitch names in order", () => {
    expect(PITCH_NAMES).toEqual(["C", "D", "E", "F", "G", "A", "H"]);
  });
});

describe("ULWILA_COLORS and PITCH_NAMES consistency", () => {
  it("should have matching keys between ULWILA_COLORS and PITCH_NAMES", () => {
    const colorKeys = Object.keys(ULWILA_COLORS) as Array<keyof typeof ULWILA_COLORS>;
    const pitchNameSet = new Set(PITCH_NAMES);

    // Every color key should be in PITCH_NAMES
    colorKeys.forEach((key) => {
      expect(pitchNameSet.has(key)).toBe(true);
    });

    // Every pitch name should be in color keys
    PITCH_NAMES.forEach((pitch) => {
      expect(colorKeys).toContain(pitch);
    });
  });
});

describe("NOTE_LABELS", () => {
  it("should have labels for all pitches", () => {
    expect(NOTE_LABELS.C).toBe("C (Do)");
    expect(NOTE_LABELS.D).toBe("D (Ré)");
    expect(NOTE_LABELS.E).toBe("E (Mi)");
    expect(NOTE_LABELS.F).toBe("F (Fa)");
    expect(NOTE_LABELS.G).toBe("G (Sol)");
    expect(NOTE_LABELS.A).toBe("A (La)");
    expect(NOTE_LABELS.H).toBe("H (Si)");
  });

  it("should have exactly 7 labels", () => {
    const labelKeys = Object.keys(NOTE_LABELS);
    expect(labelKeys).toHaveLength(7);
  });
});
