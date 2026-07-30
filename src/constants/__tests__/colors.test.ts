/**
 * ULWILA Color Score Editor - Color Constants Tests
 *
 * Unit tests for the ULWILA color mapping system.
 */

import { describe, it, expect } from "vitest";
import {
  ULWILA_COLORS,
  PITCH_NAMES,
  NOTE_LABELS,
  contrastRatio,
  getOctaveDotStyle,
} from "../colors";

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

describe("contrastRatio", () => {
  it("is 21 for black against white and 1 for a color against itself", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#DC143C", "#DC143C")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#1A1A1A", "#FFD700")).toBeCloseTo(
      contrastRatio("#FFD700", "#1A1A1A"),
      5
    );
  });
});

describe("getOctaveDotStyle", () => {
  it("returns no dot for the middle octave", () => {
    for (const pitch of PITCH_NAMES) {
      expect(getOctaveDotStyle(pitch, "middle")).toBeNull();
    }
  });

  it("gives the low C a white halo so the black dot stays visible", () => {
    const style = getOctaveDotStyle("C", "lower");
    expect(style).toEqual({ fill: "#000000", halo: "#FFFFFF" });
  });

  it("gives the low E a white halo (dark blue hides a black dot)", () => {
    expect(getOctaveDotStyle("E", "lower")?.halo).toBe("#FFFFFF");
  });

  it("needs no halo for the lower octave on lighter colors", () => {
    for (const pitch of ["D", "F", "G", "A", "H"] as const) {
      const style = getOctaveDotStyle(pitch, "lower");
      expect(style?.fill).toBe("#000000");
      expect(style?.halo).toBeNull();
    }
  });

  it("gives the high H a dark halo so the white dot stays visible", () => {
    const style = getOctaveDotStyle("H", "upper");
    expect(style).toEqual({ fill: "#FFFFFF", halo: "#333333" });
  });

  it("never halos a dot with its own color", () => {
    for (const pitch of PITCH_NAMES) {
      for (const octave of ["lower", "upper"] as const) {
        const style = getOctaveDotStyle(pitch, octave);
        expect(style!.halo).not.toBe(style!.fill);
      }
    }
  });

  it("gives the high A a dark halo (white dot on orange is low contrast)", () => {
    expect(getOctaveDotStyle("A", "upper")).toEqual({
      fill: "#FFFFFF",
      halo: "#333333",
    });
  });

  it("needs no halo for the upper octave on dark colors", () => {
    for (const pitch of ["C", "D", "E", "F", "G"] as const) {
      const style = getOctaveDotStyle(pitch, "upper");
      expect(style?.fill).toBe("#FFFFFF");
      expect(style?.halo).toBeNull();
    }
  });
});
