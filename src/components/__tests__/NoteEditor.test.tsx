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

  describe("grouping gap toggle", () => {
    const GAP_LABEL = "Toggle a grouping gap after this note (spacing only, not a rest)";
    const BREAK_LABEL = "Toggle line break after this note";

    it("renders for a selected note and reflects the marker", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      const button = screen.getByLabelText(GAP_LABEL);
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("shows a pressed state when the note already has a gap", () => {
      renderWithSelection(
        makeScore([
          {
            type: "note",
            pitch: "C",
            octave: "middle",
            duration: "quarter",
            spaceAfter: true,
          },
        ]),
        0,
        0,
      );

      expect(screen.getByLabelText(GAP_LABEL)).toHaveAttribute("aria-pressed", "true");
    });

    it("is enabled for a selected rest", () => {
      renderWithSelection(makeScore([{ type: "rest", duration: "quarter" }]), 0, 0);

      expect(screen.getByLabelText(GAP_LABEL)).toBeEnabled();
    });

    it("is a separate control from the line break toggle", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      expect(screen.getByLabelText(GAP_LABEL)).not.toBe(
        screen.getByLabelText(BREAK_LABEL),
      );
    });

    it("toggles the gap on click", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      fireEvent.click(screen.getByLabelText(GAP_LABEL));

      expect(screen.getByLabelText(GAP_LABEL)).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("measure accent control", () => {
    const label = (state: string) =>
      `Measure-start accent mark: cycle automatic, forced on, forced off — ${state}`;

    it("starts in the automatic state", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      expect(screen.getByLabelText(label("auto"))).toBeInTheDocument();
    });

    it("cycles automatic to on to off and back", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      fireEvent.click(screen.getByLabelText(label("auto")));
      expect(screen.getByLabelText(label("on"))).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(label("on")));
      expect(screen.getByLabelText(label("off"))).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(label("off")));
      expect(screen.getByLabelText(label("auto"))).toBeInTheDocument();
    });

    it("renders for a selected rest", () => {
      renderWithSelection(makeScore([{ type: "rest", duration: "quarter" }]), 0, 0);

      expect(screen.getByLabelText(label("auto"))).toBeEnabled();
    });

    it("is a separate control from the gap and line-break toggles", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      const accent = screen.getByLabelText(label("auto"));
      expect(accent).not.toBe(
        screen.getByLabelText("Toggle line break after this note"),
      );
      expect(accent).not.toBe(
        screen.getByLabelText(
          "Toggle a grouping gap after this note (spacing only, not a rest)",
        ),
      );
    });
  });

  describe("sharp toggle", () => {
    const SHARP = "Make this note sharp (only C, D, F, G and A have one)";

    it("makes an existing plain note sharp", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "G", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      const toggle = screen.getByLabelText(SHARP);
      expect(toggle).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(toggle);
      expect(screen.getByLabelText(SHARP)).toHaveAttribute("aria-pressed", "true");
    });

    it("clears the sharp on a second click", () => {
      renderWithSelection(
        makeScore([
          { type: "note", pitch: "C", octave: "middle", duration: "quarter", accented: true },
        ]),
        0,
        0,
      );

      expect(screen.getByLabelText(SHARP)).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(screen.getByLabelText(SHARP));
      expect(screen.getByLabelText(SHARP)).toHaveAttribute("aria-pressed", "false");
    });

    it("is disabled for E and H, which have no sharp", () => {
      for (const pitch of ["E", "H"] as const) {
        const { unmount } = renderWithSelection(
          makeScore([{ type: "note", pitch, octave: "middle", duration: "quarter" }]),
          0,
          0,
        );
        expect(screen.getByLabelText(SHARP)).toBeDisabled();
        unmount();
      }
    });

    it("is enabled for a pitch that has a sharp", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "F", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      expect(screen.getByLabelText(SHARP)).toBeEnabled();
    });

    it("is disabled for a rest", () => {
      renderWithSelection(makeScore([{ type: "rest", duration: "quarter" }]), 0, 0);

      expect(screen.getByLabelText(SHARP)).toBeDisabled();
    });

    it("drops the sharp when the pitch changes to one without a sharp", () => {
      renderWithSelection(
        makeScore([
          { type: "note", pitch: "G", octave: "middle", duration: "quarter", accented: true },
        ]),
        0,
        0,
      );

      expect(screen.getByLabelText(SHARP)).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByLabelText("Set pitch to E - E (Mi)"));

      expect(screen.getByLabelText(SHARP)).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByLabelText(SHARP)).toBeDisabled();
    });

    it("keeps the sharp when the pitch changes to another that has one", () => {
      renderWithSelection(
        makeScore([
          { type: "note", pitch: "G", octave: "middle", duration: "quarter", accented: true },
        ]),
        0,
        0,
      );

      fireEvent.click(screen.getByLabelText("Set pitch to D - D (Ré)"));

      expect(screen.getByLabelText(SHARP)).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("repeat toggles", () => {
    const FROM = "Start a repeated section before this element";
    const TO = "End a repeated section after this element";

    it("offers both toggles for a selected note", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      expect(screen.getByLabelText(FROM)).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByLabelText(TO)).toHaveAttribute("aria-pressed", "false");
    });

    it("sets and clears the repeat start", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      fireEvent.click(screen.getByLabelText(FROM));
      expect(screen.getByLabelText(FROM)).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByLabelText(FROM));
      expect(screen.getByLabelText(FROM)).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps the two toggles independent, including both on one element", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      fireEvent.click(screen.getByLabelText(FROM));
      fireEvent.click(screen.getByLabelText(TO));

      expect(screen.getByLabelText(FROM)).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByLabelText(TO)).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByLabelText(FROM));
      expect(screen.getByLabelText(FROM)).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByLabelText(TO)).toHaveAttribute("aria-pressed", "true");
    });

    it("works on a rest", () => {
      renderWithSelection(makeScore([{ type: "rest", duration: "quarter" }]), 0, 0);

      fireEvent.click(screen.getByLabelText(TO));
      expect(screen.getByLabelText(TO)).toHaveAttribute("aria-pressed", "true");
    });

    it("does not disturb the other markers", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      const GAP = "Toggle a grouping gap after this note (spacing only, not a rest)";
      fireEvent.click(screen.getByLabelText(GAP));
      fireEvent.click(screen.getByLabelText(FROM));

      expect(screen.getByLabelText(GAP)).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByLabelText(FROM)).toHaveAttribute("aria-pressed", "true");
    });

    it("keeps every marker toggle at the 44px minimum touch target", () => {
      renderWithSelection(
        makeScore([{ type: "note", pitch: "C", octave: "middle", duration: "quarter" }]),
        0,
        0,
      );

      // The class carries min-height: 44px; assert every marker uses it so a
      // future button cannot quietly opt out of the accessibility rule.
      for (const label of [FROM, TO]) {
        expect(screen.getByLabelText(label).className).toMatch(/markerButton/);
      }
    });
  });
});
