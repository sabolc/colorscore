/**
 * ULWILA Color Score Editor - Lyrics Editor Tests
 *
 * Tests for the LyricsEditor component that attaches lyrics to notes.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LyricsEditor } from "../LyricsEditor";
import { ScoreProvider } from "../../store/ScoreContext";
import { SelectionProvider } from "../../store/SelectionContext";
import { LanguageProvider } from "../../i18n";
import type { Score } from "../../models/types";

import React, { useEffect } from "react";
import { useSelectionDispatch } from "../../store/SelectionContext";

/**
 * Build a score with one part containing given notes for testing.
 */
function makeScore(
  notes: Score["parts"][0]["notes"] = []
): Score {
  return {
    title: "Test",
    renderingMode: "staff",
    timeSignature: { beats: 4, beatValue: 4 },
    clef: "treble",
    parts: [{ notes }],
  };
}

/**
 * Helper: dispatches SELECT_NOTE on mount so we can test with selection.
 */
function SelectOnMount({
  partIndex,
  noteIndex,
  children,
}: {
  partIndex: number;
  noteIndex: number;
  children: React.ReactNode;
}) {
  const dispatch = useSelectionDispatch();
  useEffect(() => {
    dispatch({ type: "SELECT_NOTE", payload: { partIndex, noteIndex } });
  }, [dispatch, partIndex, noteIndex]);
  return <>{children}</>;
}

/**
 * Helper: render LyricsEditor with providers (no selection).
 */
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <LanguageProvider>
      <ScoreProvider>
        <SelectionProvider>{ui}</SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  );
}

/**
 * Helper: render LyricsEditor with a specific note selected.
 */
function renderWithSelection(
  score: Score,
  partIndex: number,
  noteIndex: number
) {
  return render(
    <LanguageProvider>
      <ScoreProvider initialScore={score}>
        <SelectionProvider>
          <SelectOnMount partIndex={partIndex} noteIndex={noteIndex}>
            <LyricsEditor />
          </SelectOnMount>
        </SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  );
}

describe("LyricsEditor", () => {
  it("renders nothing when no selection", () => {
    renderWithProviders(<LyricsEditor />);

    expect(screen.queryByTestId("lyrics-editor")).not.toBeInTheDocument();
  });

  it("renders lyric input when a note is selected", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    expect(screen.getByTestId("lyrics-editor")).toBeInTheDocument();
    expect(screen.getByLabelText("Lyric input")).toBeInTheDocument();
  });

  it("renders nothing when a rest is selected", () => {
    const score = makeScore([{ type: "rest", duration: "quarter" }]);

    renderWithSelection(score, 0, 0);

    // LyricsEditor should not render for rests
    expect(screen.queryByTestId("lyrics-editor")).not.toBeInTheDocument();
  });

  it("shows existing lyric in the input", () => {
    const score = makeScore([
      {
        type: "note",
        pitch: "C",
        octave: "middle",
        duration: "quarter",
        lyric: "la",
      },
    ]);

    renderWithSelection(score, 0, 0);

    const input = screen.getByLabelText("Lyric input") as HTMLInputElement;
    expect(input.value).toBe("la");
  });

  it("shows empty input when note has no lyric", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    const input = screen.getByLabelText("Lyric input") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("typing lyric dispatches SET_LYRIC and updates input", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    const input = screen.getByLabelText("Lyric input") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "do" } });

    expect(input.value).toBe("do");
  });

  it("clearing lyric text removes the lyric", () => {
    const score = makeScore([
      {
        type: "note",
        pitch: "E",
        octave: "middle",
        duration: "quarter",
        lyric: "mi",
      },
    ]);

    renderWithSelection(score, 0, 0);

    const input = screen.getByLabelText("Lyric input") as HTMLInputElement;
    expect(input.value).toBe("mi");

    fireEvent.change(input, { target: { value: "" } });

    expect(input.value).toBe("");
  });

  it("has accessible label on the input", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    expect(screen.getByLabelText("Lyric input")).toBeInTheDocument();
    expect(screen.getByLabelText("Syllable")).toBeInTheDocument();
  });

  it("has heading text", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    expect(screen.getByText("Lyric")).toBeInTheDocument();
  });
});
