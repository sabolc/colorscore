/**
 * ULWILA Color Score Editor - Staff Layout Tests
 */

import { describe, it, expect } from "vitest";
import { pitchToStaffPosition, computeLayout } from "../staffLayout";
import type { Score } from "../../models/types";

describe("staffLayout", () => {
  describe("pitchToStaffPosition", () => {
    it("returns correct positions for lower octave in treble clef", () => {
      expect(pitchToStaffPosition("C", "lower", "treble")).toBe(-2);
      expect(pitchToStaffPosition("D", "lower", "treble")).toBe(-1);
      expect(pitchToStaffPosition("E", "lower", "treble")).toBe(0);
      expect(pitchToStaffPosition("F", "lower", "treble")).toBe(1);
      expect(pitchToStaffPosition("G", "lower", "treble")).toBe(2);
      expect(pitchToStaffPosition("A", "lower", "treble")).toBe(3);
      expect(pitchToStaffPosition("H", "lower", "treble")).toBe(4);
    });

    it("returns correct positions for middle octave in treble clef", () => {
      expect(pitchToStaffPosition("C", "middle", "treble")).toBe(5);
      expect(pitchToStaffPosition("D", "middle", "treble")).toBe(6);
      expect(pitchToStaffPosition("E", "middle", "treble")).toBe(7);
      expect(pitchToStaffPosition("F", "middle", "treble")).toBe(8);
      expect(pitchToStaffPosition("G", "middle", "treble")).toBe(9);
      expect(pitchToStaffPosition("A", "middle", "treble")).toBe(10);
      expect(pitchToStaffPosition("H", "middle", "treble")).toBe(11);
    });

    it("returns correct positions for upper octave in treble clef", () => {
      expect(pitchToStaffPosition("C", "upper", "treble")).toBe(12);
      expect(pitchToStaffPosition("D", "upper", "treble")).toBe(13);
      expect(pitchToStaffPosition("E", "upper", "treble")).toBe(14);
      expect(pitchToStaffPosition("F", "upper", "treble")).toBe(15);
      expect(pitchToStaffPosition("G", "upper", "treble")).toBe(16);
      expect(pitchToStaffPosition("A", "upper", "treble")).toBe(17);
      expect(pitchToStaffPosition("H", "upper", "treble")).toBe(18);
    });

    it("returns correct positions for lower octave in bass clef", () => {
      expect(pitchToStaffPosition("C", "lower", "bass")).toBe(-4);
      expect(pitchToStaffPosition("D", "lower", "bass")).toBe(-3);
      expect(pitchToStaffPosition("E", "lower", "bass")).toBe(-2);
      expect(pitchToStaffPosition("F", "lower", "bass")).toBe(-1);
      expect(pitchToStaffPosition("G", "lower", "bass")).toBe(0);
      expect(pitchToStaffPosition("A", "lower", "bass")).toBe(1);
      expect(pitchToStaffPosition("H", "lower", "bass")).toBe(2);
    });

    it("returns correct positions for middle octave in bass clef", () => {
      expect(pitchToStaffPosition("C", "middle", "bass")).toBe(3);
      expect(pitchToStaffPosition("D", "middle", "bass")).toBe(4);
      expect(pitchToStaffPosition("E", "middle", "bass")).toBe(5);
      expect(pitchToStaffPosition("F", "middle", "bass")).toBe(6);
      expect(pitchToStaffPosition("G", "middle", "bass")).toBe(7);
      expect(pitchToStaffPosition("A", "middle", "bass")).toBe(8);
      expect(pitchToStaffPosition("H", "middle", "bass")).toBe(9);
    });

    it("returns correct positions for upper octave in bass clef", () => {
      expect(pitchToStaffPosition("C", "upper", "bass")).toBe(10);
      expect(pitchToStaffPosition("D", "upper", "bass")).toBe(11);
      expect(pitchToStaffPosition("E", "upper", "bass")).toBe(12);
      expect(pitchToStaffPosition("F", "upper", "bass")).toBe(13);
      expect(pitchToStaffPosition("G", "upper", "bass")).toBe(14);
      expect(pitchToStaffPosition("A", "upper", "bass")).toBe(15);
      expect(pitchToStaffPosition("H", "upper", "bass")).toBe(16);
    });

    it("places bass clef lower G on bottom line (position 0)", () => {
      expect(pitchToStaffPosition("G", "lower", "bass")).toBe(0);
    });

    it("places bass clef middle A on top line (position 8)", () => {
      expect(pitchToStaffPosition("A", "middle", "bass")).toBe(8);
    });

    it("places bass clef upper C on first ledger above staff (position 10)", () => {
      expect(pitchToStaffPosition("C", "upper", "bass")).toBe(10);
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

      expect(layout.systems[0].notes[0].y).toBe(5); // C middle
      expect(layout.systems[0].notes[1].y).toBe(7); // E middle
      expect(layout.systems[0].notes[2].y).toBe(9); // G middle
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

      expect(layout.systems[0].notes[0].y).toBe(0);  // G lower = bottom line
      expect(layout.systems[0].notes[1].y).toBe(3);  // C middle = space
      expect(layout.systems[0].notes[2].y).toBe(8);  // A middle = top line
    });
  });
});
