/**
 * ULWILA Color Score Editor - Circles Layout Tests
 */

import { describe, it, expect } from "vitest";
import { computeCirclesLayout } from "../circlesLayout";
import type { Score } from "../../models/types";

const makeScore = (notes: Score["parts"][0]["notes"] = []): Score => ({
  title: "Test",
  renderingMode: "circles",
  timeSignature: { beats: 4, beatValue: 4 },
  clef: "treble",
  parts: notes.length > 0 ? [{ notes }] : [],
});

describe("computeCirclesLayout", () => {
  it("returns empty layout for score with no parts", () => {
    const score = makeScore();
    const layout = computeCirclesLayout(score);

    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].circles).toHaveLength(0);
  });

  it("returns empty layout for score with empty parts", () => {
    const score: Score = {
      title: "Empty",
      renderingMode: "circles",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [{ notes: [] }],
    };
    const layout = computeCirclesLayout(score);

    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].circles).toHaveLength(0);
  });

  it("computes standard circle size for quarter notes", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
    ]);
    const layout = computeCirclesLayout(score, { circleSize: 40 });

    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0].circles).toHaveLength(2);

    const [c1, c2] = layout.rows[0].circles;
    // Quarter note radius = 40 / 2 = 20
    expect(c1.radius).toBe(20);
    expect(c2.radius).toBe(20);
    expect(c1.isRest).toBe(false);
    expect(c2.isRest).toBe(false);
  });

  it("computes larger circles for half notes", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "half" },
    ]);
    const layout = computeCirclesLayout(score, { circleSize: 40 });

    const circle = layout.rows[0].circles[0];
    // Half note radius = 20 * 1.4 = 28
    expect(circle.radius).toBe(28);
  });

  it("computes larger circles for whole notes", () => {
    const score = makeScore([
      { type: "note", pitch: "E", octave: "middle", duration: "whole" },
    ]);
    const layout = computeCirclesLayout(score, { circleSize: 40 });

    const circle = layout.rows[0].circles[0];
    // Whole note radius = 20 * 1.8 = 36
    expect(circle.radius).toBeCloseTo(36);
  });

  it("creates sub-circles for eighth notes", () => {
    const score = makeScore([
      { type: "note", pitch: "F", octave: "middle", duration: "eighth" },
    ]);
    const layout = computeCirclesLayout(score);

    const circle = layout.rows[0].circles[0];
    expect(circle.subCircles).toBeDefined();
    expect(circle.subCircles).toHaveLength(2);
  });

  it("creates sub-circles for sixteenth notes in 2x2 grid", () => {
    const score = makeScore([
      { type: "note", pitch: "G", octave: "middle", duration: "sixteenth" },
    ]);
    const layout = computeCirclesLayout(score);

    const circle = layout.rows[0].circles[0];
    expect(circle.subCircles).toBeDefined();
    expect(circle.subCircles).toHaveLength(4);
  });

  it("creates empty gaps for rests", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "rest", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
    ]);
    const layout = computeCirclesLayout(score);

    expect(layout.rows[0].circles).toHaveLength(3);
    expect(layout.rows[0].circles[0].isRest).toBe(false);
    expect(layout.rows[0].circles[1].isRest).toBe(true);
    expect(layout.rows[0].circles[1].radius).toBe(0);
    expect(layout.rows[0].circles[2].isRest).toBe(false);
  });

  it("positions circles sequentially left to right", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
    ]);
    const layout = computeCirclesLayout(score);

    const circles = layout.rows[0].circles;
    expect(circles[0].cx).toBeLessThan(circles[1].cx);
    expect(circles[1].cx).toBeLessThan(circles[2].cx);
  });

  it("wraps to a new row when exceeding canvas width", () => {
    // With canvasWidth=200, marginLeft=20, circleSpacing=50, baseRadius=20
    // Usable width ~= 200 - 20 - 20 = 160
    // Each quarter note takes 50px of spacing
    // After ~3 notes we should wrap
    const notes = Array.from({ length: 8 }, () => ({
      type: "note" as const,
      pitch: "C" as const,
      octave: "middle" as const,
      duration: "quarter" as const,
    }));
    const score = makeScore(notes);
    const layout = computeCirclesLayout(score, { canvasWidth: 200 });

    expect(layout.rows.length).toBeGreaterThan(1);
    // Verify all rows have circles
    for (const row of layout.rows) {
      expect(row.circles.length).toBeGreaterThan(0);
    }
  });

  it("preserves octave information on circle layouts", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "lower", duration: "quarter" },
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "C", octave: "upper", duration: "quarter" },
    ]);
    const layout = computeCirclesLayout(score);

    const circles = layout.rows[0].circles;
    expect(circles[0].octave).toBe("lower");
    expect(circles[1].octave).toBe("middle");
    expect(circles[2].octave).toBe("upper");
  });

  it("includes lyric text in the layout", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter", lyric: "La" },
    ]);
    const layout = computeCirclesLayout(score);

    expect(layout.rows[0].circles[0].lyric).toBe("La");
  });

  it("returns positive totalHeight", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);
    const layout = computeCirclesLayout(score);

    expect(layout.totalHeight).toBeGreaterThan(0);
  });
});
