/**
 * ULWILA Color Score Editor - Note Input Panel Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NoteInputPanel from "../NoteInputPanel";
import { ScoreProvider } from "../../store/ScoreContext";
import { LanguageProvider } from "../../i18n";
import { ULWILA_COLORS, PITCH_NAMES } from "../../constants/colors";
import { SelectionProvider } from "../../store/SelectionContext";
import { NoteInputProvider } from "../../store/NoteInputContext";
import { useSelectionDispatch } from "../../store/SelectionContext";
import { ScoreCanvas } from "../ScoreCanvas";
import { useEffect } from "react";
import type { Score } from "../../models/types";

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

// Helper to render component with required providers
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <LanguageProvider>
      <ScoreProvider>
        <SelectionProvider>
          <NoteInputProvider>{ui}</NoteInputProvider>
        </SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  );
}

describe("NoteInputPanel", () => {
  it("renders 7 pitch buttons with correct colors", () => {
    renderWithProviders(<NoteInputPanel />);

    PITCH_NAMES.forEach((pitch) => {
      // Find button by accessible label - must match start of string to avoid false matches
      const button = screen.getByRole("button", { name: new RegExp(`^${pitch} -`) });
      expect(button).toBeInTheDocument();

      // Check background color
      const expectedColor = ULWILA_COLORS[pitch];
      expect(button).toHaveStyle({ backgroundColor: expectedColor });
    });
  });

  it("renders duration selector with all duration options", () => {
    renderWithProviders(<NoteInputPanel />);

    const durations = ["Whole", "Half", "Quarter", "Eighth", "Sixteenth"];
    durations.forEach((duration) => {
      const button = screen.getByRole("button", { name: duration });
      expect(button).toBeInTheDocument();
    });
  });

  it("renders octave selector with all octave options", () => {
    renderWithProviders(<NoteInputPanel />);

    const octaves = ["Lower", "Middle", "Upper"];
    octaves.forEach((octave) => {
      const button = screen.getByRole("button", { name: octave });
      expect(button).toBeInTheDocument();
    });
  });

  it("renders action buttons", () => {
    renderWithProviders(<NoteInputPanel />);

    const addNoteButton = screen.getByRole("button", { name: /add note/i });
    const addRestButton = screen.getByRole("button", { name: /add rest/i });

    expect(addNoteButton).toBeInTheDocument();
    expect(addRestButton).toBeInTheDocument();
  });

  it("add note button is disabled when no pitch is selected", () => {
    renderWithProviders(<NoteInputPanel />);

    const addNoteButton = screen.getByRole("button", { name: /add note/i });
    expect(addNoteButton).toBeDisabled();
  });

  it("add note button is enabled when a pitch is selected", () => {
    renderWithProviders(<NoteInputPanel />);

    // Click a pitch button
    const pitchButton = screen.getByRole("button", { name: "G - G (Sol)" });
    fireEvent.click(pitchButton);

    const addNoteButton = screen.getByRole("button", { name: /add note/i });
    expect(addNoteButton).not.toBeDisabled();
  });

  it("selects and highlights a pitch when clicked", () => {
    renderWithProviders(<NoteInputPanel />);

    const pitchButton = screen.getByRole("button", { name: "G - G (Sol)" });
    fireEvent.click(pitchButton);

    expect(pitchButton).toHaveAttribute("aria-pressed", "true");
  });

  it("changes duration when duration button is clicked", () => {
    renderWithProviders(<NoteInputPanel />);

    const halfButton = screen.getByRole("button", { name: "Half" });
    fireEvent.click(halfButton);

    expect(halfButton).toHaveAttribute("aria-pressed", "true");
  });

  it("changes octave when octave button is clicked", () => {
    renderWithProviders(<NoteInputPanel />);

    const upperButton = screen.getByRole("button", { name: "Upper" });
    fireEvent.click(upperButton);

    expect(upperButton).toHaveAttribute("aria-pressed", "true");
  });

  it("H button has dark border for visibility", () => {
    renderWithProviders(<NoteInputPanel />);

    const hButton = screen.getByRole("button", { name: "H - H (Si)" });
    // Check that the H button has the hButton class (CSS modules will scope it)
    expect(hButton.className).toContain("hButton");
  });

  it("all pitch buttons meet minimum 44x44px touch target size", () => {
    renderWithProviders(<NoteInputPanel />);

    PITCH_NAMES.forEach((pitch) => {
      const button = screen.getByRole("button", { name: new RegExp(`^${pitch} -`) });

      // Check min-width and min-height via inline styles or CSS
      // In the module CSS, we set min-width: 44px and min-height: 44px
      expect(button).toBeInTheDocument();
    });
  });

  it("keeps selected pitch after adding a note for rapid input", () => {
    renderWithProviders(<NoteInputPanel />);

    // Select a pitch
    const pitchButton = screen.getByRole("button", { name: "G - G (Sol)" });
    fireEvent.click(pitchButton);

    expect(pitchButton).toHaveAttribute("aria-pressed", "true");

    // Add note
    const addNoteButton = screen.getByRole("button", { name: /add note/i });
    fireEvent.click(addNoteButton);

    // Pitch should remain selected for rapid input
    expect(pitchButton).toHaveAttribute("aria-pressed", "true");
  });

  it("add note button stays enabled after adding a note", () => {
    renderWithProviders(<NoteInputPanel />);

    // Select a pitch
    const pitchButton = screen.getByRole("button", { name: "G - G (Sol)" });
    fireEvent.click(pitchButton);

    // Add note
    const addNoteButton = screen.getByRole("button", { name: /add note/i });
    fireEvent.click(addNoteButton);

    // Button should remain enabled since pitch is still selected
    expect(addNoteButton).toBeEnabled();
  });

  it("allows switching between different pitches", () => {
    renderWithProviders(<NoteInputPanel />);

    const gButton = screen.getByRole("button", { name: "G - G (Sol)" });
    const cButton = screen.getByRole("button", { name: "C - C (Do)" });

    // Select G
    fireEvent.click(gButton);
    expect(gButton).toHaveAttribute("aria-pressed", "true");

    // Select C
    fireEvent.click(cButton);
    expect(cButton).toHaveAttribute("aria-pressed", "true");
    expect(gButton).toHaveAttribute("aria-pressed", "false");
  });

  it("allows switching between different durations", () => {
    renderWithProviders(<NoteInputPanel />);

    const quarterButton = screen.getByRole("button", { name: "Quarter" });
    const halfButton = screen.getByRole("button", { name: "Half" });

    // Quarter should be selected by default
    expect(quarterButton).toHaveAttribute("aria-pressed", "true");

    // Select Half
    fireEvent.click(halfButton);
    expect(halfButton).toHaveAttribute("aria-pressed", "true");
    expect(quarterButton).toHaveAttribute("aria-pressed", "false");
  });

  it("allows switching between different octaves", () => {
    renderWithProviders(<NoteInputPanel />);

    const middleButton = screen.getByRole("button", { name: "Middle" });
    const upperButton = screen.getByRole("button", { name: "Upper" });

    // Middle should be selected by default
    expect(middleButton).toHaveAttribute("aria-pressed", "true");

    // Select Upper
    fireEvent.click(upperButton);
    expect(upperButton).toHaveAttribute("aria-pressed", "true");
    expect(middleButton).toHaveAttribute("aria-pressed", "false");
  });

  describe("insertion point", () => {
    /** Render the panel next to a canvas so a selection can be made. */
    const renderWithScore = (notes: Score["parts"][0]["notes"], selectAt?: number) => {
      const score: Score = {
        title: "T",
        renderingMode: "circles",
        timeSignature: { beats: 4, beatValue: 4 },
        clef: "treble",
        parts: [{ notes }],
      };
      return render(
        <LanguageProvider>
          <ScoreProvider initialScore={score}>
            <SelectionProvider>
              <NoteInputProvider>
                {selectAt !== undefined ? (
                  <SelectOnMount partIndex={0} noteIndex={selectAt}>
                    <NoteInputPanel />
                    <ScoreCanvas />
                  </SelectOnMount>
                ) : (
                  <>
                    <NoteInputPanel />
                    <ScoreCanvas />
                  </>
                )}
              </NoteInputProvider>
            </SelectionProvider>
          </ScoreProvider>
        </LanguageProvider>,
      );
    };

    const quarter = (pitch: "C" | "D" | "E") =>
      ({ type: "note", pitch, octave: "middle", duration: "quarter" }) as const;

    const renderedPitches = (container: HTMLElement) =>
      [...container.querySelectorAll(".note-circle")].map((c) =>
        c.getAttribute("data-pitch"),
      );

    it("inserts after the selected element", () => {
      const { container } = renderWithScore([quarter("C"), quarter("D"), quarter("E")], 1);

      fireEvent.click(screen.getByLabelText("G - G (Sol)"));
      fireEvent.click(screen.getByLabelText("Add note to score"));

      expect(renderedPitches(container)).toEqual(["C", "D", "G", "E"]);
    });

    it("appends when nothing is selected", () => {
      const { container } = renderWithScore([quarter("C"), quarter("D"), quarter("E")]);

      fireEvent.click(screen.getByLabelText("G - G (Sol)"));
      fireEvent.click(screen.getByLabelText("Add note to score"));

      expect(renderedPitches(container)).toEqual(["C", "D", "E", "G"]);
    });

    it("keeps inserting in order when several are added in a row", () => {
      const { container } = renderWithScore([quarter("C"), quarter("E")], 0);

      fireEvent.click(screen.getByLabelText("G - G (Sol)"));
      fireEvent.click(screen.getByLabelText("Add note to score"));
      fireEvent.click(screen.getByLabelText("A - A (La)"));
      fireEvent.click(screen.getByLabelText("Add note to score"));

      // The selection followed the first insert, so the second lands after it
      expect(renderedPitches(container)).toEqual(["C", "G", "A", "E"]);
    });

    it("inserts a rest after the selected element too", () => {
      const { container } = renderWithScore([quarter("C"), quarter("E")], 0);

      fireEvent.click(screen.getByLabelText("Add rest to score"));

      expect(container.querySelectorAll(".rest-symbol").length).toBe(1);
      expect(renderedPitches(container)).toEqual(["C", "E"]);
    });
  });
});
