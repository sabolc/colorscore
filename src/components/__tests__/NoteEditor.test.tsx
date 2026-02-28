/**
 * ULWILA Color Score Editor - Note Editor Tests
 *
 * Tests for the NoteEditor component that edits selected note properties.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteEditor } from "../NoteEditor";
import { ScoreProvider } from "../../store/ScoreContext";
import { SelectionProvider } from "../../store/SelectionContext";
import { LanguageProvider } from "../../i18n";
import { ULWILA_COLORS, PITCH_NAMES } from "../../constants/colors";
import type { Score } from "../../models/types";

/**
 * Helper: render NoteEditor with providers and an optional pre-populated score.
 */
function renderWithProviders(
  ui: React.ReactElement,
  { initialScore }: { initialScore?: Score } = {}
) {
  return render(
    <LanguageProvider>
      <ScoreProvider initialScore={initialScore}>
        <SelectionProvider>{ui}</SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  );
}

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

// ---- NOTE: Because SelectionProvider starts with null selection,
//      we cannot directly set selection state via props.
//      Instead we wrap NoteEditor in a helper that dispatches SELECT_NOTE
//      on mount via a companion component. ----

import React, { useEffect } from "react";
import { useSelectionDispatch } from "../../store/SelectionContext";

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
 * Helper: render NoteEditor with a specific note selected.
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
            <NoteEditor />
          </SelectOnMount>
        </SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  );
}

describe("NoteEditor", () => {
  it("renders nothing meaningful when no selection", () => {
    renderWithProviders(<NoteEditor />);

    const editor = screen.getByTestId("note-editor");
    expect(editor).toBeInTheDocument();
    expect(screen.getByText("No note selected")).toBeInTheDocument();
    // Should not show controls
    expect(screen.queryByLabelText("Duration selector")).not.toBeInTheDocument();
  });

  it("shows controls when note selected", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    expect(screen.getByText("Edit Note")).toBeInTheDocument();
    expect(screen.getByLabelText("Duration selector")).toBeInTheDocument();
    expect(screen.getByLabelText("Octave selector")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete note")).toBeInTheDocument();
  });

  it("shows pitch buttons with ULWILA colors", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    PITCH_NAMES.forEach((pitch) => {
      const button = screen.getByRole("button", {
        name: new RegExp(`Set pitch to ${pitch}`),
      });
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({
        backgroundColor: ULWILA_COLORS[pitch],
      });
    });
  });

  it("changing pitch dispatches EDIT_NOTE", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    // Click the G pitch button
    const gButton = screen.getByRole("button", {
      name: /Set pitch to G/,
    });
    fireEvent.click(gButton);

    // After dispatch, the G button should now be active (aria-pressed=true)
    expect(gButton).toHaveAttribute("aria-pressed", "true");
  });

  it("changing duration dispatches EDIT_NOTE", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    const durationSelect = screen.getByLabelText("Duration selector");
    expect(durationSelect).toHaveValue("quarter");

    fireEvent.change(durationSelect, { target: { value: "half" } });

    // After dispatch the value should update
    expect(durationSelect).toHaveValue("half");
  });

  it("delete button dispatches DELETE_NOTE and CLEAR_SELECTION", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
      { type: "note", pitch: "E", octave: "middle", duration: "half" },
    ]);

    renderWithSelection(score, 0, 0);

    const deleteButton = screen.getByLabelText("Delete note");
    fireEvent.click(deleteButton);

    // After delete + clear selection, should show "No note selected"
    expect(screen.getByText("No note selected")).toBeInTheDocument();
  });

  it("pitch and octave disabled when rest selected", () => {
    const score = makeScore([{ type: "rest", duration: "quarter" }]);

    renderWithSelection(score, 0, 0);

    expect(screen.getByText("Edit Rest")).toBeInTheDocument();

    // All pitch buttons should be disabled
    PITCH_NAMES.forEach((pitch) => {
      const button = screen.getByRole("button", {
        name: new RegExp(`Set pitch to ${pitch}`),
      });
      expect(button).toBeDisabled();
    });

    // Octave selector should be disabled
    const octaveSelect = screen.getByLabelText("Octave selector");
    expect(octaveSelect).toBeDisabled();
  });

  it("has ARIA labels on all controls", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    // Pitch selector group
    expect(screen.getByRole("group", { name: "Pitch selector" })).toBeInTheDocument();

    // Each pitch button has an aria-label
    PITCH_NAMES.forEach((pitch) => {
      expect(
        screen.getByRole("button", {
          name: new RegExp(`Set pitch to ${pitch}`),
        })
      ).toBeInTheDocument();
    });

    // Duration selector
    expect(screen.getByLabelText("Duration selector")).toBeInTheDocument();

    // Octave selector
    expect(screen.getByLabelText("Octave selector")).toBeInTheDocument();

    // Delete button
    expect(screen.getByLabelText("Delete note")).toBeInTheDocument();
  });

  it("changing octave dispatches EDIT_NOTE", () => {
    const score = makeScore([
      { type: "note", pitch: "C", octave: "middle", duration: "quarter" },
    ]);

    renderWithSelection(score, 0, 0);

    const octaveSelect = screen.getByLabelText("Octave selector");
    expect(octaveSelect).toHaveValue("middle");

    fireEvent.change(octaveSelect, { target: { value: "upper" } });

    expect(octaveSelect).toHaveValue("upper");
  });
});
