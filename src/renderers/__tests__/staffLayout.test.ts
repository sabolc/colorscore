/**
 * ULWILA Color Score Editor - Staff Layout Tests
 */

import { describe, it, expect } from "vitest";
import { pitchToStaffPosition, computeLayout } from "../staffLayout";
import type { Score } from "../../models/types";

describe("staffLayout", () => {
  describe("pitchToStaffPosition", () => {
    // 0 = bottom staff line; one unit per diatonic step.
    // Treble bottom line is E4, bass bottom line is G2.

    it("puts middle C on the first ledger line below the treble staff", () => {
      expect(pitchToStaffPosition("C", "middle", "treble")).toBe(-2);
    });

    it("puts middle C on the first ledger line above the bass staff", () => {
      expect(pitchToStaffPosition("C", "middle", "bass")).toBe(10);
    });

    it("puts each clef's own note on the line that clef names", () => {
      // The treble clef curls around G4, the second line up
      expect(pitchToStaffPosition("G", "middle", "treble")).toBe(2);
      // The bass clef's dots straddle F3, the fourth line up
      expect(pitchToStaffPosition("F", "lower", "bass")).toBe(6);
    });

    it("keeps a note's sounding pitch when the clef changes", () => {
      // Treble bottom line E4 and bass bottom line G2 are 12 diatonic steps
      // apart, so every note must differ by exactly that between the clefs.
      for (const pitch of ["C", "D", "E", "F", "G", "A", "H"] as const) {
        for (const octave of ["lower", "middle", "upper"] as const) {
          expect(
            pitchToStaffPosition(pitch, octave, "bass") -
              pitchToStaffPosition(pitch, octave, "treble"),
          ).toBe(12);
        }
      }
    });

    it("returns correct positions for the middle octave in treble clef", () => {
      expect(pitchToStaffPosition("C", "middle", "treble")).toBe(-2);
      expect(pitchToStaffPosition("D", "middle", "treble")).toBe(-1);
      expect(pitchToStaffPosition("E", "middle", "treble")).toBe(0);
      expect(pitchToStaffPosition("F", "middle", "treble")).toBe(1);
      expect(pitchToStaffPosition("G", "middle", "treble")).toBe(2);
      expect(pitchToStaffPosition("A", "middle", "treble")).toBe(3);
      expect(pitchToStaffPosition("H", "middle", "treble")).toBe(4);
    });

    it("returns correct positions for the lower and upper octaves in treble clef", () => {
      expect(pitchToStaffPosition("C", "lower", "treble")).toBe(-9);
      expect(pitchToStaffPosition("H", "lower", "treble")).toBe(-3);
      expect(pitchToStaffPosition("C", "upper", "treble")).toBe(5);
      expect(pitchToStaffPosition("H", "upper", "treble")).toBe(11);
    });

    it("returns correct positions for the middle octave in bass clef", () => {
      expect(pitchToStaffPosition("C", "middle", "bass")).toBe(10);
      expect(pitchToStaffPosition("D", "middle", "bass")).toBe(11);
      expect(pitchToStaffPosition("E", "middle", "bass")).toBe(12);
      expect(pitchToStaffPosition("F", "middle", "bass")).toBe(13);
      expect(pitchToStaffPosition("G", "middle", "bass")).toBe(14);
      expect(pitchToStaffPosition("A", "middle", "bass")).toBe(15);
      expect(pitchToStaffPosition("H", "middle", "bass")).toBe(16);
    });

    it("returns correct positions for the lower and upper octaves in bass clef", () => {
      expect(pitchToStaffPosition("C", "lower", "bass")).toBe(3);
      expect(pitchToStaffPosition("H", "lower", "bass")).toBe(9);
      expect(pitchToStaffPosition("C", "upper", "bass")).toBe(17);
      expect(pitchToStaffPosition("H", "upper", "bass")).toBe(23);
    });

    it("keeps the octaves one seventh apart within a clef", () => {
      for (const pitch of ["C", "D", "E", "F", "G", "A", "H"] as const) {
        const lower = pitchToStaffPosition(pitch, "lower", "treble");
        const middle = pitchToStaffPosition(pitch, "middle", "treble");
        const upper = pitchToStaffPosition(pitch, "upper", "treble");
        expect(middle - lower).toBe(7);
        expect(upper - middle).toBe(7);
      }
    });
  });

  describe("computeLayout", () => {
    it("returns layout with empty notes for empty score", () => {
      const score: Score = {
        title: "Test Score",
        renderingMode: "staff",
        timeSignature: { beats: 4, beatValue: 4 },
        clef: "treble",
        parts: [],
      };

      const layout = computeLayout(score);

      expect(layout.systems).toHaveLength(1);
      expect(layout.systems[0].notes).toHaveLength(0);
      expect(layout.systems[0].barLines).toHaveLength(0);
    });

    it("computes layout for score with 4 quarter notes in 4/4", () => {
      const score: Score = {
        title: "Test Score",
        renderingMode: "staff",
        timeSignature: { beats: 4, beatValue: 4 },
        clef: "treble",
        parts: [
          {
            notes: [
              { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "F", octave: "middle", duration: "quarter" },
            ],
          },
        ],
      };

      const layout = computeLayout(score);

      expect(layout.systems).toHaveLength(1);
      expect(layout.systems[0].notes).toHaveLength(4);
      expect(layout.systems[0].barLines).toHaveLength(1); // One bar line after 4 beats
    });

    it("correctly computes y positions based on pitch", () => {
      const score: Score = {
        title: "Test Score",
        renderingMode: "staff",
        timeSignature: { beats: 4, beatValue: 4 },
        clef: "treble",
        parts: [
          {
            notes: [
              { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "G", octave: "middle", duration: "quarter" },
            ],
          },
        ],
      };

      const layout = computeLayout(score);

      expect(layout.systems[0].notes[0].y).toBe(-2); // middle C, first ledger below
      expect(layout.systems[0].notes[1].y).toBe(0); // E4, bottom line
      expect(layout.systems[0].notes[2].y).toBe(2); // G4, second line
    });

    it("correctly handles rests", () => {
      const score: Score = {
        title: "Test Score",
        renderingMode: "staff",
        timeSignature: { beats: 4, beatValue: 4 },
        clef: "treble",
        parts: [
          {
            notes: [
              { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
              { type: "rest", duration: "quarter" },
              { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
            ],
          },
        ],
      };

      const layout = computeLayout(score);

      expect(layout.systems[0].notes).toHaveLength(3);
      expect(layout.systems[0].notes[1].isRest).toBe(true);
      expect(layout.systems[0].notes[1].y).toBe(4); // Center of staff
    });

    it("inserts bar lines correctly for 3/4 time signature", () => {
      const score: Score = {
        title: "Waltz",
        renderingMode: "staff",
        timeSignature: { beats: 3, beatValue: 4 },
        clef: "treble",
        parts: [
          {
            notes: [
              { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "F", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "G", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "A", octave: "middle", duration: "quarter" },
            ],
          },
        ],
      };

      const layout = computeLayout(score);

      // 6 quarter notes in 3/4 = 2 complete measures = 2 bar lines
      expect(layout.systems[0].barLines).toHaveLength(2);
    });

    it("inserts bar lines correctly for 6/8 time signature", () => {
      const score: Score = {
        title: "Compound",
        renderingMode: "staff",
        timeSignature: { beats: 6, beatValue: 8 },
        clef: "treble",
        parts: [
          {
            notes: [
              { type: "note", pitch: "C", octave: "middle", duration: "eighth" },
              { type: "note", pitch: "D", octave: "middle", duration: "eighth" },
              { type: "note", pitch: "E", octave: "middle", duration: "eighth" },
              { type: "note", pitch: "F", octave: "middle", duration: "eighth" },
              { type: "note", pitch: "G", octave: "middle", duration: "eighth" },
              { type: "note", pitch: "A", octave: "middle", duration: "eighth" },
              { type: "note", pitch: "H", octave: "middle", duration: "eighth" },
              { type: "note", pitch: "C", octave: "upper", duration: "eighth" },
              { type: "note", pitch: "D", octave: "upper", duration: "eighth" },
              { type: "note", pitch: "E", octave: "upper", duration: "eighth" },
              { type: "note", pitch: "F", octave: "upper", duration: "eighth" },
              { type: "note", pitch: "G", octave: "upper", duration: "eighth" },
            ],
          },
        ],
      };

      const layout = computeLayout(score);

      // 6/8 normalized: beatsPerMeasure = 6 * (4/8) = 3 quarter-note beats
      // Each eighth = 0.5 quarter-note beats, so 6 eighths = 3 beats = 1 measure
      // 12 eighth notes = 2 complete measures = 2 bar lines
      expect(layout.systems[0].barLines).toHaveLength(2);
    });

    it("computes layout for bass clef score with correct y positions", () => {
      const score: Score = {
        title: "Bass Score",
        renderingMode: "staff",
        timeSignature: { beats: 4, beatValue: 4 },
        clef: "bass",
        parts: [
          {
            notes: [
              { type: "note", pitch: "G", octave: "lower", duration: "quarter" },
              { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
              { type: "note", pitch: "A", octave: "middle", duration: "quarter" },
            ],
          },
        ],
      };

      const layout = computeLayout(score);

      expect(layout.systems[0].notes[0].y).toBe(7);  // G3, fourth space
      expect(layout.systems[0].notes[1].y).toBe(10); // middle C, first ledger above
      expect(layout.systems[0].notes[2].y).toBe(15); // A4, well above the staff
    });
  });

  describe("vertical extent", () => {
    const scoreOf = (
      notes: Score["parts"][0]["notes"],
      clef: "treble" | "bass",
    ): Score => ({
      title: "T",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef,
      parts: [{ notes }],
    });

    const noteAt = (
      pitch: "C" | "D" | "H",
      octave: "lower" | "middle" | "upper",
    ) => ({ type: "note", pitch, octave, duration: "quarter" }) as const;

    /** Screen y of a staff position, mirroring the renderer's mapping. */
    const yOf = (position: number, startY: number, spacing: number) =>
      startY + 4 * spacing - position * (spacing / 2);

    it("keeps notes high above a bass staff inside the canvas", () => {
      const layout = computeLayout(scoreOf([noteAt("H", "middle")], "bass"));
      const system = layout.systems[0];
      const note = system.notes[0];
      const y = yOf(note.y, system.startY, layout.config.staffLineSpacing);

      expect(note.y).toBe(16); // H4 sits well above the bass staff
      expect(y).toBeGreaterThan(0); // not clipped by the top edge
      expect(y).toBeLessThan(layout.totalHeight);
    });

    it("keeps notes far below a treble staff inside the canvas", () => {
      const layout = computeLayout(scoreOf([noteAt("C", "lower")], "treble"));
      const system = layout.systems[0];
      const note = system.notes[0];
      const y = yOf(note.y, system.startY, layout.config.staffLineSpacing);

      expect(note.y).toBe(-9); // C3 sits well below the treble staff
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(layout.totalHeight);
    });

    it("does not add room a score that stays inside the staff does not need", () => {
      // D3 is the fourth position up in bass clef, comfortably within the staff
      const plain = computeLayout(scoreOf([noteAt("D", "lower")], "bass"));

      expect(plain.systems[0].notes[0].y).toBe(4);
      expect(plain.systems[0].startY).toBe(plain.config.marginTop);
    });
  });
});
