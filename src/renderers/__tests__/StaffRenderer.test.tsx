/**
 * ULWILA Color Score Editor - Staff Renderer Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StaffRenderer from "../StaffRenderer";
import { ULWILA_COLORS } from "../../constants/colors";
import type { Score } from "../../models/types";

describe("StaffRenderer", () => {
  it("renders 5 staff lines for empty score", () => {
    const score: Score = {
      title: "Empty Score",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    const staffLines = container.querySelectorAll(".staff-line");
    expect(staffLines).toHaveLength(5);
  });

  it("renders colored noteheads for notes", () => {
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
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    // Check for ellipses (noteheads)
    const noteheads = container.querySelectorAll("ellipse");
    expect(noteheads.length).toBeGreaterThanOrEqual(3);

    // Check that filled noteheads have correct colors
    const firstNotehead = noteheads[0];
    expect(firstNotehead.getAttribute("fill")).toBe(ULWILA_COLORS.C);

    const secondNotehead = noteheads[1];
    expect(secondNotehead.getAttribute("fill")).toBe(ULWILA_COLORS.D);

    const thirdNotehead = noteheads[2];
    expect(thirdNotehead.getAttribute("fill")).toBe(ULWILA_COLORS.E);
  });

  it("each notehead fill matches ULWILA_COLORS for its pitch", () => {
    const score: Score = {
      title: "Test Score",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
            { type: "note", pitch: "G", octave: "middle", duration: "quarter" },
            { type: "note", pitch: "H", octave: "middle", duration: "quarter" },
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    const noteheads = container.querySelectorAll("ellipse");

    // C note
    expect(noteheads[0].getAttribute("fill")).toBe(ULWILA_COLORS.C);
    expect(noteheads[0].getAttribute("stroke")).toBe(ULWILA_COLORS.C);

    // G note
    expect(noteheads[1].getAttribute("fill")).toBe(ULWILA_COLORS.G);
    expect(noteheads[1].getAttribute("stroke")).toBe(ULWILA_COLORS.G);

    // H note
    expect(noteheads[2].getAttribute("fill")).toBe(ULWILA_COLORS.H);
    expect(noteheads[2].getAttribute("stroke")).toBe(ULWILA_COLORS.H);
  });

  it("renders unfilled noteheads for half and whole notes", () => {
    const score: Score = {
      title: "Test Score",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            { type: "note", pitch: "C", octave: "middle", duration: "whole" },
            { type: "note", pitch: "D", octave: "middle", duration: "half" },
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    const noteheads = container.querySelectorAll("ellipse");

    // Whole note should be unfilled (white fill)
    expect(noteheads[0].getAttribute("fill")).toBe("white");
    expect(noteheads[0].getAttribute("stroke")).toBe(ULWILA_COLORS.C);

    // Half note should be unfilled (white fill)
    expect(noteheads[1].getAttribute("fill")).toBe("white");
    expect(noteheads[1].getAttribute("stroke")).toBe(ULWILA_COLORS.D);
  });

  it("renders selection highlight when note is selected", () => {
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
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer
        score={score}
        selection={{ partIndex: 0, noteIndex: 0 }}
      />
    );

    // Check for selection highlight (blue rectangle)
    const rects = container.querySelectorAll("rect");
    const selectionRect = Array.from(rects).find(
      (rect) => rect.getAttribute("stroke") === "blue"
    );

    expect(selectionRect).toBeDefined();
    expect(selectionRect?.getAttribute("fill")).toBe("none");
    expect(selectionRect?.getAttribute("stroke-width")).toBe("2");
  });

  it("renders rest symbols", () => {
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

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    // SVG should contain the staff renderer
    const svg = screen.getByTestId("staff-renderer");
    expect(svg).toBeDefined();

    // Should have 2 noteheads (not 3, because one is a rest)
    const noteheads = container.querySelectorAll("ellipse");
    expect(noteheads).toHaveLength(2);
  });

  it("renders lyrics text below notes that have lyric property", () => {
    const score: Score = {
      title: "Song with Lyrics",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            { type: "note", pitch: "C", octave: "middle", duration: "quarter", lyric: "Do" },
            { type: "note", pitch: "D", octave: "middle", duration: "quarter", lyric: "Re" },
            { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    // Check for lyric text elements
    const lyricTexts = container.querySelectorAll(".lyric-text");
    expect(lyricTexts).toHaveLength(2);
    expect(lyricTexts[0].textContent).toBe("Do");
    expect(lyricTexts[1].textContent).toBe("Re");
  });

  it("does not render lyrics for notes without lyric property", () => {
    const score: Score = {
      title: "No Lyrics",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
            { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    const lyricTexts = container.querySelectorAll(".lyric-text");
    expect(lyricTexts).toHaveLength(0);
  });

  it("renders bass clef symbol when score uses bass clef", () => {
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
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    // Should render bass clef, not treble clef
    const bassClef = container.querySelector(".bass-clef");
    expect(bassClef).not.toBeNull();

    const trebleClef = container.querySelector(".treble-clef");
    expect(trebleClef).toBeNull();
  });

  it("renders treble clef symbol when score uses treble clef", () => {
    const score: Score = {
      title: "Treble Score",
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
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    const trebleClef = container.querySelector(".treble-clef");
    expect(trebleClef).not.toBeNull();

    const bassClef = container.querySelector(".bass-clef");
    expect(bassClef).toBeNull();
  });

  it("renders stems up for lower octave notes and down for middle/upper octave notes", () => {
    const score: Score = {
      title: "Stem Direction Test",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [
        {
          notes: [
            { type: "note", pitch: "C", octave: "lower", duration: "quarter" },
            { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
            { type: "note", pitch: "C", octave: "upper", duration: "quarter" },
          ],
        },
      ],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} />
    );

    // Get all stem lines: vertical lines with stroke-width 1.5 (not staff lines or ledger lines)
    const allLines = container.querySelectorAll("line");
    const stemLines = Array.from(allLines).filter((line) => {
      const x1 = parseFloat(line.getAttribute("x1") || "0");
      const x2 = parseFloat(line.getAttribute("x2") || "0");
      const sw = line.getAttribute("stroke-width");
      return x1 === x2 && sw === "1.5" && !line.classList.contains("staff-line");
    });

    // 3 quarter notes = 3 stems
    expect(stemLines.length).toBe(3);

    // In SVG, y increases downward. So:
    //   stemDirection = -1 → y2 = pixelY - 30 → y2 < y1 → stem points UP visually
    //   stemDirection = +1 → y2 = pixelY + 30 → y2 > y1 → stem points DOWN visually

    // Lower octave: stem should point UP (y2 < y1)
    const lowerY1 = parseFloat(stemLines[0].getAttribute("y1") || "0");
    const lowerY2 = parseFloat(stemLines[0].getAttribute("y2") || "0");
    expect(lowerY2).toBeLessThan(lowerY1);

    // Middle octave: stem should point DOWN (y2 > y1)
    const middleY1 = parseFloat(stemLines[1].getAttribute("y1") || "0");
    const middleY2 = parseFloat(stemLines[1].getAttribute("y2") || "0");
    expect(middleY2).toBeGreaterThan(middleY1);

    // Upper octave: stem should also point DOWN (y2 > y1)
    const upperY1 = parseFloat(stemLines[2].getAttribute("y1") || "0");
    const upperY2 = parseFloat(stemLines[2].getAttribute("y2") || "0");
    expect(upperY2).toBeGreaterThan(upperY1);
  });

  it("renders clef on all systems in multi-system layout", () => {
    // Create a score with enough notes to wrap to multiple systems
    const manyNotes = Array.from({ length: 30 }, () => ({
      type: "note" as const,
      pitch: "C" as const,
      octave: "middle" as const,
      duration: "quarter" as const,
    }));

    const score: Score = {
      title: "Long Score",
      renderingMode: "staff",
      timeSignature: { beats: 4, beatValue: 4 },
      clef: "treble",
      parts: [{ notes: manyNotes }],
    };

    const { container } = render(
      <StaffRenderer score={score} selection={null} width={400} />
    );

    // With narrow width, notes should wrap to multiple systems
    const systems = container.querySelectorAll(".staff-system");
    expect(systems.length).toBeGreaterThan(1);

    // Each system should have a clef
    const clefs = container.querySelectorAll(".treble-clef");
    expect(clefs.length).toBe(systems.length);
  });
});
