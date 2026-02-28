/**
 * ULWILA Color Score Editor - Toolbar Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar } from "../Toolbar";
import { ScoreProvider } from "../../store/ScoreContext";
import { LanguageProvider } from "../../i18n";

describe("Toolbar", () => {
  it("renders the title input", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const titleInput = screen.getByLabelText("Score title");
    expect(titleInput).toBeInTheDocument();
  });

  it("displays the current score title", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const titleInput = screen.getByLabelText("Score title") as HTMLInputElement;
    // Initial title should be empty string
    expect(titleInput.value).toBe("");
  });

  it("updates title when user types", async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const titleInput = screen.getByLabelText("Score title") as HTMLInputElement;

    await user.type(titleInput, "My Test Score");

    expect(titleInput.value).toBe("My Test Score");
  });

  it("has aria-label on title input", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const titleInput = screen.getByLabelText("Score title");
    expect(titleInput).toHaveAttribute("aria-label", "Score title");
  });

  it("renders action buttons", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    expect(screen.getByLabelText("Export to PDF")).toBeInTheDocument();
    expect(screen.getByLabelText("Export to PNG")).toBeInTheDocument();
    expect(screen.getByLabelText("Export to SVG")).toBeInTheDocument();
    expect(screen.getByLabelText("Save score")).toBeInTheDocument();
    expect(screen.getByLabelText("Load score")).toBeInTheDocument();
  });

  it("action buttons are enabled", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    expect(screen.getByLabelText("Export to PDF")).toBeEnabled();
    expect(screen.getByLabelText("Export to PNG")).toBeEnabled();
    expect(screen.getByLabelText("Export to SVG")).toBeEnabled();
    expect(screen.getByLabelText("Save score")).toBeEnabled();
    expect(screen.getByLabelText("Load score")).toBeEnabled();
  });

  it("has a hidden file input for loading scores", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const fileInput = screen.getByTestId("load-file-input") as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.type).toBe("file");
    expect(fileInput.accept).toBe(".json");
  });

  // Time Signature selector tests

  it("renders time signature selector with default 4/4", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const timeSigSelect = screen.getByLabelText(
      "Time signature"
    ) as HTMLSelectElement;
    expect(timeSigSelect).toBeInTheDocument();
    expect(timeSigSelect.value).toBe("4/4");
  });

  it("time signature selector has ARIA label", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const timeSigSelect = screen.getByLabelText("Time signature");
    expect(timeSigSelect).toHaveAttribute("aria-label", "Time signature");
  });

  it("time signature selector has all required options", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const timeSigSelect = screen.getByLabelText(
      "Time signature"
    ) as HTMLSelectElement;
    const options = Array.from(timeSigSelect.options).map((o) => o.value);
    expect(options).toContain("2/4");
    expect(options).toContain("3/4");
    expect(options).toContain("4/4");
    expect(options).toContain("6/8");
  });

  it("changing time signature dispatches SET_TIME_SIGNATURE", async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const timeSigSelect = screen.getByLabelText(
      "Time signature"
    ) as HTMLSelectElement;

    await user.selectOptions(timeSigSelect, "3/4");
    expect(timeSigSelect.value).toBe("3/4");

    await user.selectOptions(timeSigSelect, "6/8");
    expect(timeSigSelect.value).toBe("6/8");

    await user.selectOptions(timeSigSelect, "2/4");
    expect(timeSigSelect.value).toBe("2/4");
  });

  // Clef selector tests

  it("renders clef selector with default treble", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const clefSelect = screen.getByLabelText("Clef") as HTMLSelectElement;
    expect(clefSelect).toBeInTheDocument();
    expect(clefSelect.value).toBe("treble");
  });

  it("clef selector has ARIA label", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const clefSelect = screen.getByLabelText("Clef");
    expect(clefSelect).toHaveAttribute("aria-label", "Clef");
  });

  it("changing clef dispatches SET_CLEF", async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const clefSelect = screen.getByLabelText("Clef") as HTMLSelectElement;

    await user.selectOptions(clefSelect, "bass");
    expect(clefSelect.value).toBe("bass");

    await user.selectOptions(clefSelect, "treble");
    expect(clefSelect.value).toBe("treble");
  });

  // Mode toggle tests

  it("mode toggle renders Staff and Circles buttons", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    expect(screen.getByLabelText("Staff mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Circles mode")).toBeInTheDocument();
  });

  it("Staff mode is active by default", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const staffButton = screen.getByLabelText("Staff mode");
    const circlesButton = screen.getByLabelText("Circles mode");

    expect(staffButton).toHaveAttribute("aria-pressed", "true");
    expect(circlesButton).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking Circles button switches mode", async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const staffButton = screen.getByLabelText("Staff mode");
    const circlesButton = screen.getByLabelText("Circles mode");

    await user.click(circlesButton);

    expect(circlesButton).toHaveAttribute("aria-pressed", "true");
    expect(staffButton).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking Staff button switches back from Circles", async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const staffButton = screen.getByLabelText("Staff mode");
    const circlesButton = screen.getByLabelText("Circles mode");

    // Switch to circles first
    await user.click(circlesButton);
    expect(circlesButton).toHaveAttribute("aria-pressed", "true");

    // Switch back to staff
    await user.click(staffButton);
    expect(staffButton).toHaveAttribute("aria-pressed", "true");
    expect(circlesButton).toHaveAttribute("aria-pressed", "false");
  });

  it("mode toggle has accessible role and aria-label", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const modeGroup = screen.getByRole("group", { name: "Rendering mode" });
    expect(modeGroup).toBeInTheDocument();
  });

  it("mode toggle buttons have aria-pressed attributes", () => {
    render(
      <LanguageProvider>
        <ScoreProvider>
          <Toolbar />
        </ScoreProvider>
      </LanguageProvider>
    );

    const staffButton = screen.getByLabelText("Staff mode");
    const circlesButton = screen.getByLabelText("Circles mode");

    expect(staffButton).toHaveAttribute("aria-pressed");
    expect(circlesButton).toHaveAttribute("aria-pressed");
  });
});
