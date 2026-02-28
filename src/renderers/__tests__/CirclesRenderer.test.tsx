/**
 * ULWILA Color Score Editor - Circles Renderer Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CirclesRenderer from "../CirclesRenderer";
import { ULWILA_COLORS } from "../../constants/colors";
import type { Score } from "../../models/types";

const makeScore = (notes: Score["parts"][0]["notes"] = []): Score => ({
  title: "Test",
  renderingMode: "circles",
  timeSignature: { beats: 4, beatValue: 4 },
  clef: "treble",
  parts: notes.length > 0 ? [{ notes }] : [],
});

describe("CirclesRenderer", () => {
  it("renders an SVG with data-testid='circles-renderer'", () => {
    const score = makeScore();
    render(<CirclesRenderer score={score} selection={null} />);

    expect(screen.getByTestId("circles-renderer")).toBeInTheDocument();
  });

  it("renders empty SVG for empty score", () => {
    const score = makeScore();
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const svg = screen.getByTestId("circles-renderer");
    expect(svg).toBeInTheDocument();
    // No note circles
    const circles = container.querySelectorAll(".note-circle");
    expect(circles).toHaveLength(0);
  });

  it("renders circles with correct ULWILA fill colors", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "F", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "G", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "A", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const noteCircles = container.querySelectorAll(".note-circle");
    expect(noteCircles).toHaveLength(6);

    expect(noteCircles[0].getAttribute("fill")).toBe(ULWILA_COLORS.C);
    expect(noteCircles[1].getAttribute("fill")).toBe(ULWILA_COLORS.D);
    expect(noteCircles[2].getAttribute("fill")).toBe(ULWILA_COLORS.E);
    expect(noteCircles[3].getAttribute("fill")).toBe(ULWILA_COLORS.F);
    expect(noteCircles[4].getAttribute("fill")).toBe(ULWILA_COLORS.G);
    expect(noteCircles[5].getAttribute("fill")).toBe(ULWILA_COLORS.A);
  });

  it("lower octave notes have black center dots", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "lower", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dots = container.querySelectorAll(".octave-dot");
    expect(dots).toHaveLength(1);
    expect(dots[0].getAttribute("fill")).toBe("#000000");
    expect(dots[0].getAttribute("data-octave")).toBe("lower");
  });

  it("upper octave notes have white center dots", () => {
    const score = makeScore([
      { type: "note", pitch: "E", octave: "upper", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dots = container.querySelectorAll(".octave-dot");
    expect(dots).toHaveLength(1);
    expect(dots[0].getAttribute("fill")).toBe("#FFFFFF");
    expect(dots[0].getAttribute("data-octave")).toBe("upper");
  });

  it("middle octave notes have no dots", () => {
    const score = makeScore([
      { type: "note", pitch: "G", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dots = container.querySelectorAll(".octave-dot");
    expect(dots).toHaveLength(0);
  });

  it("H (yellow) notes have dark border stroke", () => {
    const score = makeScore([
      { type: "note", pitch: "H", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const noteCircles = container.querySelectorAll(".note-circle");
    expect(noteCircles).toHaveLength(1);
    expect(noteCircles[0].getAttribute("fill")).toBe(ULWILA_COLORS.H);
    expect(noteCircles[0].getAttribute("stroke")).toBe("#333333");
    expect(noteCircles[0].getAttribute("stroke-width")).toBe("2");
  });

  it("non-H notes use their color as stroke (no dark border)", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const noteCircles = container.querySelectorAll(".note-circle");
    expect(noteCircles[0].getAttribute("stroke")).toBe(ULWILA_COLORS.C);
  });

  it("selection shows highlight ring", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer
        score={score}
        selection={{ partIndex: 0, noteIndex: 0 }}
      />
    );

    const rings = container.querySelectorAll(".selection-ring");
    expect(rings).toHaveLength(1);
    expect(rings[0].getAttribute("stroke")).toBe("blue");
    expect(rings[0].getAttribute("fill")).toBe("none");
  });

  it("no selection ring when nothing is selected", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const rings = container.querySelectorAll(".selection-ring");
    expect(rings).toHaveLength(0);
  });

  it("lyrics text appears below circles", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter", lyric: "La" },
      { type: "note", pitch: "D", octave: "middle", duration: "quarter", lyric: "Le" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const lyricTexts = container.querySelectorAll(".lyric-text");
    expect(lyricTexts).toHaveLength(2);
    expect(lyricTexts[0].textContent).toBe("La");
    expect(lyricTexts[1].textContent).toBe("Le");
  });

  it("calls onNoteClick when a note circle is clicked", () => {
    const handleClick = vi.fn();
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "D", octave: "middle", duration: "quarter" },
    ]);
    render(
      <CirclesRenderer
        score={score}
        selection={null}
        onNoteClick={handleClick}
      />
    );

    const noteGroup = screen.getByTestId("note-circle-0-1");
    fireEvent.click(noteGroup);

    expect(handleClick).toHaveBeenCalledWith(0, 1);
  });

  it("renders rests as empty gaps (no visible circles)", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "rest", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    // Only 2 note circles (rest has no visible circle)
    const noteCircles = container.querySelectorAll(".note-circle");
    expect(noteCircles).toHaveLength(2);
  });

  it("renders eighth notes with sub-circles", () => {
    const score = makeScore([
      { type: "note", pitch: "F", octave: "middle", duration: "eighth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    // Eighth note = 2 sub-circles
    const noteCircles = container.querySelectorAll(".note-circle");
    expect(noteCircles).toHaveLength(2);
  });

  it("renders sixteenth notes with 4 sub-circles", () => {
    const score = makeScore([
      { type: "note", pitch: "A", octave: "middle", duration: "sixteenth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    // Sixteenth note = 4 sub-circles in 2x2 grid
    const noteCircles = container.querySelectorAll(".note-circle");
    expect(noteCircles).toHaveLength(4);
  });

  it("renders octave dots on sub-circles for eighth notes", () => {
    const score = makeScore([
      { type: "note", pitch: "F", octave: "lower", duration: "eighth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    // Each sub-circle should have an octave dot
    const dots = container.querySelectorAll(".octave-dot");
    expect(dots).toHaveLength(2);
    expect(dots[0].getAttribute("fill")).toBe("#000000");
    expect(dots[1].getAttribute("fill")).toBe("#000000");
  });
});
