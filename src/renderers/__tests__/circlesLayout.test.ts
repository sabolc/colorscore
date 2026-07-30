/**
 * ULWILA Color Score Editor - Circles Layout Tests
 */

import { describe, it, expect } from "vitest";
import {
  computeCirclesLayout,
  ACCENT_GAP,
  ACCENT_HEIGHT,
} from "../circlesLayout";
import { computeLayout as computeStaffLayout } from "../staffLayout";
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
    expect(c1.glyphs).toHaveLength(1);
    expect(c1.glyphs[0].kind).toBe("circle");
  });

  it("builds half notes from two joined circles of base size", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "half" },
    ]);
    const layout = computeCirclesLayout(score, { circleSize: 40 });

    const symbol = layout.rows[0].circles[0];
    expect(symbol.glyphs).toHaveLength(2);
    expect(symbol.glyphs.every((g) => g.kind === "circle")).toBe(true);
    expect(symbol.glyphs.every((g) => g.radius === 20)).toBe(true);
    // The two circles touch: centers are one diameter apart
    expect(symbol.glyphs[1].cx - symbol.glyphs[0].cx).toBeCloseTo(40);
  });

  it("builds whole notes from four joined circles of base size", () => {
    const score = makeScore([
      { type: "note", pitch: "E", octave: "middle", duration: "whole" },
    ]);
    const layout = computeCirclesLayout(score, { circleSize: 40 });

    const symbol = layout.rows[0].circles[0];
    expect(symbol.glyphs).toHaveLength(4);
    expect(symbol.glyphs.every((g) => g.kind === "circle")).toBe(true);
    expect(symbol.glyphs.every((g) => g.radius === 20)).toBe(true);
  });

  it("renders an eighth note as a single half circle", () => {
    const score = makeScore([
      { type: "note", pitch: "F", octave: "middle", duration: "eighth" },
    ]);
    const layout = computeCirclesLayout(score, { circleSize: 40 });

    const symbol = layout.rows[0].circles[0];
    expect(symbol.glyphs).toHaveLength(1);
    expect(symbol.glyphs[0].kind).toBe("half-circle");
    // Half the width of a full circle, full circle height
    expect(symbol.glyphs[0].width).toBeCloseTo(20);
    expect(symbol.glyphs[0].radius).toBe(20);
  });

  it("renders a sixteenth note as a single narrow bar", () => {
    const score = makeScore([
      { type: "note", pitch: "G", octave: "middle", duration: "sixteenth" },
    ]);
    const layout = computeCirclesLayout(score, { circleSize: 40 });

    const symbol = layout.rows[0].circles[0];
    expect(symbol.glyphs).toHaveLength(1);
    expect(symbol.glyphs[0].kind).toBe("bar");
    expect(symbol.glyphs[0].width).toBeLessThan(20);
    expect(symbol.glyphs[0].radius).toBe(20);
  });

  it("gives two eighth notes the horizontal span of one quarter note", () => {
    const eighths = computeCirclesLayout(
      makeScore([
        { type: "note", pitch: "C", octave: "middle", duration: "eighth" },
        { type: "note", pitch: "D", octave: "middle", duration: "eighth" },
        { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
      ])
    );
    const quarters = computeCirclesLayout(
      makeScore([
        { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
        { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
      ])
    );

    // The note after the two eighths starts where the second quarter would
    expect(eighths.rows[0].circles[2].cx).toBeCloseTo(quarters.rows[0].circles[1].cx);
  });

  it("renders rests as uncolored hexagon glyphs", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "rest", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
    ]);
    const layout = computeCirclesLayout(score);

    expect(layout.rows[0].circles).toHaveLength(3);
    expect(layout.rows[0].circles[0].isRest).toBe(false);

    const rest = layout.rows[0].circles[1];
    expect(rest.isRest).toBe(true);
    expect(rest.glyphs).toHaveLength(1);
    expect(rest.glyphs[0].kind).toBe("hexagon");
    expect(rest.radius).toBeGreaterThan(0);

    expect(layout.rows[0].circles[2].isRest).toBe(false);
  });

  it("uses one hexagon per quarter of rest duration", () => {
    const layout = computeCirclesLayout(
      makeScore([
        { type: "rest", duration: "half" },
        { type: "rest", duration: "whole" },
      ])
    );

    expect(layout.rows[0].circles[0].glyphs).toHaveLength(2);
    expect(layout.rows[0].circles[1].glyphs).toHaveLength(4);
  });

  it("renders eighth and sixteenth rests as half hexagon and bar", () => {
    const layout = computeCirclesLayout(
      makeScore([
        { type: "rest", duration: "eighth" },
        { type: "rest", duration: "sixteenth" },
      ])
    );

    expect(layout.rows[0].circles[0].glyphs[0].kind).toBe("half-hexagon");
    expect(layout.rows[0].circles[1].glyphs[0].kind).toBe("bar");
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

  describe("grouping gap", () => {
    const sixQuarters = (spaceAfterIndex?: number) =>
      makeScore(
        Array.from({ length: 6 }, (_, i) => ({
          type: "note" as const,
          pitch: "C" as const,
          octave: "middle" as const,
          duration: "quarter" as const,
          ...(i === spaceAfterIndex ? { spaceAfter: true } : {}),
        })),
      );

    it("widens the distance to the next symbol by half a beat unit", () => {
      const plain = computeCirclesLayout(sixQuarters(), { canvasWidth: 2000 });
      const gapped = computeCirclesLayout(sixQuarters(2), { canvasWidth: 2000 });

      const plainCircles = plain.rows[0].circles;
      const gappedCircles = gapped.rows[0].circles;
      const spacing = plain.config.circleSpacing;

      // Untouched up to and including the marked note
      for (let i = 0; i <= 2; i++) {
        expect(gappedCircles[i].cx).toBeCloseTo(plainCircles[i].cx);
      }
      // Everything after it shifts right by exactly half a beat unit
      for (let i = 3; i < 6; i++) {
        expect(gappedCircles[i].cx - plainCircles[i].cx).toBeCloseTo(spacing / 2);
      }
    });

    it("leaves glyph sizes and the element count untouched", () => {
      const gapped = computeCirclesLayout(sixQuarters(2), { canvasWidth: 2000 });
      const circles = gapped.rows[0].circles;

      expect(circles).toHaveLength(6);
      for (const c of circles) {
        expect(c.glyphs).toHaveLength(1);
        expect(c.glyphs[0].kind).toBe("circle");
        expect(c.radius).toBe(20);
      }
    });

    it("produces no extra layout entry — the gap is not an element", () => {
      const plain = computeCirclesLayout(sixQuarters(), { canvasWidth: 2000 });
      const gapped = computeCirclesLayout(sixQuarters(2), { canvasWidth: 2000 });

      expect(gapped.rows[0].circles).toHaveLength(plain.rows[0].circles.length);
    });

    it("drops the gap at a forced line break, so the next row is not indented", () => {
      const layout = computeCirclesLayout(
        makeScore([
          { type: "note", pitch: "C", octave: "middle", duration: "quarter", spaceAfter: true, lineBreakAfter: true },
          { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
        ]),
        { canvasWidth: 2000 },
      );

      expect(layout.rows).toHaveLength(2);
      expect(layout.rows[1].circles[0].cx).toBeCloseTo(layout.rows[0].circles[0].cx);
    });

    it("drops the gap when the next element wraps on width", () => {
      // Three quarters fit per row at this width; mark the last one on row 1
      const notes = Array.from({ length: 6 }, (_, i) => ({
        type: "note" as const,
        pitch: "C" as const,
        octave: "middle" as const,
        duration: "quarter" as const,
        ...(i === 2 ? { spaceAfter: true } : {}),
      }));
      const layout = computeCirclesLayout(makeScore(notes), { canvasWidth: 200 });

      expect(layout.rows.length).toBeGreaterThan(1);
      const firstOfEachRow = layout.rows.map((r) => r.circles[0].cx);
      for (const cx of firstOfEachRow) {
        expect(cx).toBeCloseTo(firstOfEachRow[0]);
      }
    });

    it("composes with the shorter durations", () => {
      const layout = computeCirclesLayout(
        makeScore([
          { type: "note", pitch: "C", octave: "middle", duration: "eighth", spaceAfter: true },
          { type: "note", pitch: "D", octave: "middle", duration: "sixteenth" },
        ]),
        { canvasWidth: 2000 },
      );

      const [first, second] = layout.rows[0].circles;
      const spacing = layout.config.circleSpacing;
      // eighth span (1/2) + gap (1/2) = one full beat unit between span starts
      expect(second.cx - first.cx).toBeCloseTo(spacing / 4 + spacing / 2 + spacing / 8);
      expect(first.glyphs[0].kind).toBe("half-circle");
      expect(second.glyphs[0].kind).toBe("bar");
    });

    it("applies the gap after a rest too", () => {
      const plain = computeCirclesLayout(
        makeScore([
          { type: "rest", duration: "quarter" },
          { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
        ]),
        { canvasWidth: 2000 },
      );
      const gapped = computeCirclesLayout(
        makeScore([
          { type: "rest", duration: "quarter", spaceAfter: true },
          { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
        ]),
        { canvasWidth: 2000 },
      );

      expect(
        gapped.rows[0].circles[1].cx - plain.rows[0].circles[1].cx,
      ).toBeCloseTo(plain.config.circleSpacing / 2);
    });
  });

  describe("measure accent", () => {
    const inTime = (notes: Score["parts"][0]["notes"], beats: number, beatValue: number): Score => ({
      title: "Test",
      renderingMode: "circles",
      timeSignature: { beats, beatValue },
      clef: "treble",
      parts: [{ notes }],
    });
    const accents = (score: Score) =>
      computeCirclesLayout(score, { canvasWidth: 4000 })
        .rows.flatMap((r) => r.circles)
        .map((c) => c.hasMeasureAccent);

    it("marks each measure start in 2/4 — the Csiga-biga shape", () => {
      // 4 eighths (2 beats = measure 1), then 2 quarters (1 beat each)
      const notes = [
        ...Array.from({ length: 4 }, () => ({
          type: "note" as const, pitch: "G" as const, octave: "middle" as const, duration: "eighth" as const,
        })),
        { type: "note" as const, pitch: "E" as const, octave: "middle" as const, duration: "quarter" as const },
        { type: "note" as const, pitch: "E" as const, octave: "middle" as const, duration: "quarter" as const },
      ];

      expect(accents(inTime(notes, 2, 4))).toEqual([true, false, false, false, true, false]);
    });

    it("marks each measure start in 4/4 with mixed durations", () => {
      const notes = [
        { type: "note" as const, pitch: "C" as const, octave: "middle" as const, duration: "half" as const },
        { type: "note" as const, pitch: "D" as const, octave: "middle" as const, duration: "quarter" as const },
        { type: "rest" as const, duration: "quarter" as const },
        { type: "note" as const, pitch: "E" as const, octave: "middle" as const, duration: "whole" as const },
        { type: "note" as const, pitch: "F" as const, octave: "middle" as const, duration: "quarter" as const },
      ];

      expect(accents(inTime(notes, 4, 4))).toEqual([true, false, false, true, true]);
    });

    it("lets a forced override win in both directions", () => {
      const notes = [
        { type: "note" as const, pitch: "C" as const, octave: "middle" as const, duration: "quarter" as const, measureAccent: "off" as const },
        { type: "note" as const, pitch: "D" as const, octave: "middle" as const, duration: "quarter" as const, measureAccent: "on" as const },
        { type: "note" as const, pitch: "E" as const, octave: "middle" as const, duration: "quarter" as const },
      ];

      // Derived would be [true, false, true] in 2/4; the overrides flip the first two
      expect(accents(inTime(notes, 2, 4))).toEqual([false, true, true]);
    });

    it("agrees with the staff renderer on where measures start", () => {
      const notes = [
        { type: "note" as const, pitch: "C" as const, octave: "middle" as const, duration: "quarter" as const },
        { type: "note" as const, pitch: "D" as const, octave: "middle" as const, duration: "quarter" as const },
        { type: "note" as const, pitch: "E" as const, octave: "middle" as const, duration: "half" as const },
        { type: "note" as const, pitch: "F" as const, octave: "middle" as const, duration: "quarter" as const },
        { type: "note" as const, pitch: "G" as const, octave: "middle" as const, duration: "quarter" as const },
      ];
      const score = inTime(notes, 4, 4);

      // The staff layout closes a measure where the circles layout opens the next
      const staff = computeStaffLayout(score, { canvasWidth: 4000 });
      const barLineCount = staff.systems.reduce((n, s) => n + s.barLines.length, 0);
      const accentCount = accents(score).filter(Boolean).length;

      // 4 beats then 2 beats: one completed measure, two measure starts
      expect(barLineCount).toBe(1);
      expect(accentCount).toBe(2);
    });

    it("does not move or resize any symbol", () => {
      const notes = Array.from({ length: 8 }, () => ({
        type: "note" as const, pitch: "C" as const, octave: "middle" as const, duration: "quarter" as const,
      }));
      const withAccents = computeCirclesLayout(inTime(notes, 2, 4), { canvasWidth: 4000 });
      const noAccents = computeCirclesLayout(
        inTime(notes.map((n) => ({ ...n, measureAccent: "off" as const })), 2, 4),
        { canvasWidth: 4000 },
      );

      const a = withAccents.rows.flatMap((r) => r.circles);
      const b = noAccents.rows.flatMap((r) => r.circles);
      expect(a).toHaveLength(b.length);
      a.forEach((sym, i) => {
        expect(sym.cx).toBeCloseTo(b[i].cx);
        expect(sym.cy).toBeCloseTo(b[i].cy);
        expect(sym.radius).toBe(b[i].radius);
        expect(sym.width).toBeCloseTo(b[i].width);
      });
      expect(withAccents.totalHeight).toBe(noAccents.totalHeight);
    });

    it("keeps the triangle inside the canvas", () => {
      const notes = [{ type: "note" as const, pitch: "C" as const, octave: "middle" as const, duration: "quarter" as const }];
      const layout = computeCirclesLayout(inTime(notes, 2, 4), { canvasWidth: 4000 });
      const symbol = layout.rows[0].circles[0];

      const triangleTop = symbol.cy - symbol.radius - ACCENT_GAP - ACCENT_HEIGHT;
      expect(symbol.hasMeasureAccent).toBe(true);
      expect(triangleTop).toBeGreaterThanOrEqual(0);
    });
  });
});
