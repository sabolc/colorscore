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
        selection={{ partIndex: 0, anchorIndex: 0, focusIndex: 0 }}
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

    expect(handleClick).toHaveBeenCalledWith(0, 1, expect.anything());
  });

  it("renders rests as uncolored outline symbols, not colored circles", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "rest", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const noteCircles = container.querySelectorAll(".note-circle");
    expect(noteCircles).toHaveLength(2);

    // The rest is a hexagon outline with no fill
    const rests = container.querySelectorAll(".rest-symbol");
    expect(rests).toHaveLength(1);
    expect(rests[0].getAttribute("fill")).toBe("none");
    expect(rests[0].getAttribute("data-glyph")).toBe("hexagon");
  });

  it("renders eighth and sixteenth rests with their own glyphs", () => {
    const score = makeScore([
      { type: "rest", duration: "eighth" },
      { type: "rest", duration: "sixteenth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const rests = container.querySelectorAll(".rest-symbol");
    expect(rests).toHaveLength(2);
    expect(rests[0].getAttribute("data-glyph")).toBe("half-hexagon");
    expect(rests[1].getAttribute("data-glyph")).toBe("bar");
  });

  it("renders an eighth note as a single half-circle path", () => {
    const score = makeScore([
      { type: "note", pitch: "F", octave: "middle", duration: "eighth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const noteGlyphs = container.querySelectorAll(".note-circle");
    expect(noteGlyphs).toHaveLength(1);
    expect(noteGlyphs[0].tagName.toLowerCase()).toBe("path");
    expect(noteGlyphs[0].getAttribute("data-glyph")).toBe("half-circle");
    expect(noteGlyphs[0].getAttribute("fill")).toBe(ULWILA_COLORS.F);
  });

  it("renders a sixteenth note as a single bar path", () => {
    const score = makeScore([
      { type: "note", pitch: "A", octave: "middle", duration: "sixteenth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const noteGlyphs = container.querySelectorAll(".note-circle");
    expect(noteGlyphs).toHaveLength(1);
    expect(noteGlyphs[0].getAttribute("data-glyph")).toBe("bar");
    expect(noteGlyphs[0].getAttribute("fill")).toBe(ULWILA_COLORS.A);
  });

  it("renders half notes as two joined colored circles", () => {
    const score = makeScore([
      { type: "note", pitch: "D", octave: "middle", duration: "half" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const noteGlyphs = container.querySelectorAll(".note-circle");
    expect(noteGlyphs).toHaveLength(2);
    expect(noteGlyphs[0].getAttribute("fill")).toBe(ULWILA_COLORS.D);
    expect(noteGlyphs[1].getAttribute("fill")).toBe(ULWILA_COLORS.D);
  });

  it("renders one octave dot per glyph of a multi-circle note", () => {
    const score = makeScore([
      { type: "note", pitch: "F", octave: "lower", duration: "half" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dots = container.querySelectorAll(".octave-dot");
    expect(dots).toHaveLength(2);
    expect(dots[0].getAttribute("fill")).toBe("#000000");
    expect(dots[1].getAttribute("fill")).toBe("#000000");
  });

  it("renders an octave dot on an eighth note half circle", () => {
    const score = makeScore([
      { type: "note", pitch: "F", octave: "upper", duration: "eighth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dots = container.querySelectorAll(".octave-dot");
    expect(dots).toHaveLength(1);
    expect(dots[0].getAttribute("fill")).toBe("#FFFFFF");
  });

  it("gives the low C dot a white halo so it is visible on the black circle", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "lower", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dot = container.querySelector(".octave-dot")!;
    expect(dot.getAttribute("fill")).toBe("#000000");
    expect(dot.getAttribute("stroke")).toBe("#FFFFFF");
    expect(Number(dot.getAttribute("stroke-width"))).toBeGreaterThan(0);
  });

  it("gives the high H dot a dark halo so it is visible on the yellow circle", () => {
    const score = makeScore([
      { type: "note", pitch: "H", octave: "upper", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dot = container.querySelector(".octave-dot")!;
    expect(dot.getAttribute("fill")).toBe("#FFFFFF");
    expect(dot.getAttribute("stroke")).toBe("#333333");
  });

  it("leaves the dot unhaloed when the note color already contrasts", () => {
    const score = makeScore([
      { type: "note", pitch: "A", octave: "lower", duration: "quarter" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const dot = container.querySelector(".octave-dot")!;
    expect(dot.getAttribute("fill")).toBe("#000000");
    expect(dot.getAttribute("stroke")).toBeNull();
  });

  it("keeps the haloed dot inside a narrow sixteenth bar", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "lower", duration: "sixteenth" },
    ]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    const bar = container.querySelector(".note-circle")!;
    const dot = container.querySelector(".octave-dot")!;
    // Bar is circleSize * 0.18 = 7.2 wide; dot + halo must fit within it
    const barHalfWidth = (40 * 0.18) / 2;
    const dotOuter =
      Number(dot.getAttribute("r")) + Number(dot.getAttribute("stroke-width")) / 2;
    expect(bar).toBeTruthy();
    expect(dotOuter).toBeLessThanOrEqual(barHalfWidth);
  });

  it("rests have no octave dots", () => {
    const score = makeScore([{ type: "rest", duration: "quarter" }]);
    const { container } = render(
      <CirclesRenderer score={score} selection={null} />
    );

    expect(container.querySelectorAll(".octave-dot")).toHaveLength(0);
  });

  it("draws nothing for a grouping gap — it is not a rest", () => {
    const gapped = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter", spaceAfter: true },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
    ]);
    const rested = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "rest", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "quarter" },
    ]);

    const gapDom = render(<CirclesRenderer score={gapped} selection={null} />).container;
    const restDom = render(<CirclesRenderer score={rested} selection={null} />).container;

    // The gap adds no drawn element of any kind
    expect(gapDom.querySelectorAll(".rest-symbol")).toHaveLength(0);
    expect(gapDom.querySelectorAll(".note-circle")).toHaveLength(2);

    // A rest, by contrast, draws its hexagon outline
    expect(restDom.querySelectorAll(".rest-symbol")).toHaveLength(1);
  });

  describe("measure accent", () => {
    const inTwoFour = (notes: Score["parts"][0]["notes"]): Score => ({
      title: "Test",
      renderingMode: "circles",
      timeSignature: { beats: 2, beatValue: 4 },
      clef: "treble",
      parts: [{ notes }],
    });

    it("draws the triangle on measure starts only", () => {
      // 2/4: quarter + quarter fills a measure, so accents fall on 1 and 3
      const score = inTwoFour(
        Array.from({ length: 4 }, () => ({
          type: "note" as const,
          pitch: "G" as const,
          octave: "middle" as const,
          duration: "quarter" as const,
        })),
      );
      const { container } = render(<CirclesRenderer score={score} selection={null} />);

      expect(container.querySelectorAll(".measure-accent")).toHaveLength(2);
    });

    it("draws the triangle above the glyph and fills it black", () => {
      const score = inTwoFour([
        { type: "note", pitch: "G", octave: "middle", duration: "quarter" },
      ]);
      const { container } = render(<CirclesRenderer score={score} selection={null} />);

      const accent = container.querySelector(".measure-accent")!;
      expect(accent.getAttribute("fill")).toBe("#000000");

      const circle = container.querySelector(".note-circle")!;
      const glyphTop = Number(circle.getAttribute("cy")) - Number(circle.getAttribute("r"));
      // Every y in the triangle path sits above the glyph
      const ys = [...accent.getAttribute("d")!.matchAll(/-?\d+(?:\.\d+)?/g)]
        .map(Number)
        .filter((_, i) => i % 2 === 1);
      for (const y of ys) expect(y).toBeLessThan(glyphTop);
    });

    it("honours a forced-off override", () => {
      const score = inTwoFour([
        {
          type: "note",
          pitch: "G",
          octave: "middle",
          duration: "quarter",
          measureAccent: "off",
        },
      ]);
      const { container } = render(<CirclesRenderer score={score} selection={null} />);

      expect(container.querySelectorAll(".measure-accent")).toHaveLength(0);
    });

    it("never draws a bar line", () => {
      const score = inTwoFour(
        Array.from({ length: 6 }, () => ({
          type: "note" as const,
          pitch: "G" as const,
          octave: "middle" as const,
          duration: "quarter" as const,
        })),
      );
      const { container } = render(<CirclesRenderer score={score} selection={null} />);

      expect(container.querySelectorAll("line")).toHaveLength(0);
      expect(container.querySelectorAll(".bar-line")).toHaveLength(0);
    });
  });
});
