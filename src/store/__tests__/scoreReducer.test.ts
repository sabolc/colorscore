/**
 * ULWILA Color Score Editor - Score Reducer Tests
 *
 * Unit tests for the score reducer state management logic.
 */

import { describe, it, expect } from "vitest";
import { scoreReducer, initialScoreState } from "../scoreReducer";
import type { Score } from "../../models/types";

describe("scoreReducer", () => {
  it("should have correct initial state defaults", () => {
    expect(initialScoreState.title).toBe("");
    expect(initialScoreState.renderingMode).toBe("staff");
    expect(initialScoreState.timeSignature).toEqual({ beats: 4, beatValue: 4 });
    expect(initialScoreState.clef).toBe("treble");
    expect(initialScoreState.parts).toHaveLength(1);
    expect(initialScoreState.parts[0].notes).toHaveLength(0);
  });

  it("should add a note to parts[0].notes", () => {
    const state = scoreReducer(initialScoreState, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });

    expect(state.parts[0].notes).toHaveLength(1);
    expect(state.parts[0].notes[0]).toEqual({
      type: "note",
      pitch: "C",
      octave: "middle",
      duration: "quarter",
    });
  });

  it("should add multiple notes sequentially", () => {
    let state = initialScoreState;

    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });

    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "E", octave: "middle", duration: "half" },
    });

    expect(state.parts[0].notes).toHaveLength(2);
    expect(state.parts[0].notes[0]).toMatchObject({ pitch: "C" });
    expect(state.parts[0].notes[1]).toMatchObject({ pitch: "E" });
  });

  it("should add a rest to parts[0].notes", () => {
    const state = scoreReducer(initialScoreState, {
      type: "ADD_REST",
      payload: { duration: "quarter" },
    });

    expect(state.parts[0].notes).toHaveLength(1);
    expect(state.parts[0].notes[0]).toEqual({
      type: "rest",
      duration: "quarter",
    });
  });

  it("should update the title", () => {
    const state = scoreReducer(initialScoreState, {
      type: "SET_TITLE",
      payload: "My New Score",
    });

    expect(state.title).toBe("My New Score");
  });

  it("should update the rendering mode", () => {
    const state = scoreReducer(initialScoreState, {
      type: "SET_RENDERING_MODE",
      payload: "circles",
    });

    expect(state.renderingMode).toBe("circles");
  });

  it("should update the time signature", () => {
    const state = scoreReducer(initialScoreState, {
      type: "SET_TIME_SIGNATURE",
      payload: { beats: 3, beatValue: 4 },
    });

    expect(state.timeSignature).toEqual({ beats: 3, beatValue: 4 });
  });

  it("should update the clef", () => {
    const state = scoreReducer(initialScoreState, {
      type: "SET_CLEF",
      payload: "bass",
    });

    expect(state.clef).toBe("bass");
  });

  it("should replace entire state with LOAD_SCORE", () => {
    const newScore: Score = {
      title: "Loaded Score",
      tempo: 120,
      renderingMode: "circles",
      timeSignature: { beats: 6, beatValue: 8 },
      clef: "bass",
      parts: [
        {
          name: "Part 1",
          notes: [
            { type: "note", pitch: "G", octave: "upper", duration: "whole" },
          ],
        },
      ],
    };

    const state = scoreReducer(initialScoreState, {
      type: "LOAD_SCORE",
      payload: newScore,
    });

    expect(state).toEqual(newScore);
    expect(state.title).toBe("Loaded Score");
    expect(state.tempo).toBe(120);
    expect(state.renderingMode).toBe("circles");
    expect(state.parts[0].name).toBe("Part 1");
    expect(state.parts[0].notes).toHaveLength(1);
  });

  it("EDIT_NOTE should change pitch of note at index", () => {
    let state = scoreReducer(initialScoreState, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });
    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "E", octave: "middle", duration: "half" },
    });

    const edited = scoreReducer(state, {
      type: "EDIT_NOTE",
      payload: { partIndex: 0, noteIndex: 0, changes: { pitch: "G" } },
    });

    const note = edited.parts[0].notes[0];
    expect(note.type).toBe("note");
    if (note.type === "note") {
      expect(note.pitch).toBe("G");
      expect(note.octave).toBe("middle");
      expect(note.duration).toBe("quarter");
    }
  });

  it("EDIT_NOTE should change duration of note at index", () => {
    let state = scoreReducer(initialScoreState, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });

    const edited = scoreReducer(state, {
      type: "EDIT_NOTE",
      payload: { partIndex: 0, noteIndex: 0, changes: { duration: "whole" } },
    });

    const note = edited.parts[0].notes[0];
    expect(note.type).toBe("note");
    if (note.type === "note") {
      expect(note.duration).toBe("whole");
      expect(note.pitch).toBe("C");
    }
  });

  it("EDIT_NOTE should not modify a rest", () => {
    let state = scoreReducer(initialScoreState, {
      type: "ADD_REST",
      payload: { duration: "quarter" },
    });

    const edited = scoreReducer(state, {
      type: "EDIT_NOTE",
      payload: { partIndex: 0, noteIndex: 0, changes: { pitch: "G" } },
    });

    // Rest should be unchanged since EDIT_NOTE only applies to notes
    expect(edited.parts[0].notes[0]).toEqual({
      type: "rest",
      duration: "quarter",
    });
  });

  it("DELETE_NOTE should remove note at index", () => {
    let state = scoreReducer(initialScoreState, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });
    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "E", octave: "middle", duration: "half" },
    });
    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "G", octave: "upper", duration: "whole" },
    });

    const deleted = scoreReducer(state, {
      type: "DELETE_NOTE",
      payload: { partIndex: 0, noteIndex: 1 },
    });

    expect(deleted.parts[0].notes).toHaveLength(2);
    expect(deleted.parts[0].notes[0]).toMatchObject({ pitch: "C" });
    expect(deleted.parts[0].notes[1]).toMatchObject({ pitch: "G" });
  });

  it("DELETE_NOTE should adjust array length", () => {
    let state = scoreReducer(initialScoreState, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });
    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "E", octave: "middle", duration: "half" },
    });

    expect(state.parts[0].notes).toHaveLength(2);

    const deleted = scoreReducer(state, {
      type: "DELETE_NOTE",
      payload: { partIndex: 0, noteIndex: 0 },
    });

    expect(deleted.parts[0].notes).toHaveLength(1);
  });

  it("REORDER_NOTE should move note from one index to another", () => {
    let state = scoreReducer(initialScoreState, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });
    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "E", octave: "middle", duration: "half" },
    });
    state = scoreReducer(state, {
      type: "ADD_NOTE",
      payload: { pitch: "G", octave: "upper", duration: "whole" },
    });

    const reordered = scoreReducer(state, {
      type: "REORDER_NOTE",
      payload: { partIndex: 0, fromIndex: 0, toIndex: 2 },
    });

    expect(reordered.parts[0].notes[0]).toMatchObject({ pitch: "E" });
    expect(reordered.parts[0].notes[1]).toMatchObject({ pitch: "G" });
    expect(reordered.parts[0].notes[2]).toMatchObject({ pitch: "C" });
  });

  it("should maintain immutability when adding notes", () => {
    const state1 = initialScoreState;
    const state2 = scoreReducer(state1, {
      type: "ADD_NOTE",
      payload: { pitch: "C", octave: "middle", duration: "quarter" },
    });

    // Original state should not be modified
    expect(state1.parts[0].notes).toHaveLength(0);
    expect(state2.parts[0].notes).toHaveLength(1);

    // States should be different objects
    expect(state1).not.toBe(state2);
    expect(state1.parts).not.toBe(state2.parts);
    expect(state1.parts[0]).not.toBe(state2.parts[0]);
  });

  describe("TOGGLE_SPACE", () => {
    const threeNotes = () => {
      let state = initialScoreState;
      for (const pitch of ["C", "D", "E"] as const) {
        state = scoreReducer(state, {
          type: "ADD_NOTE",
          payload: { pitch, octave: "middle", duration: "quarter" },
        });
      }
      return state;
    };

    it("sets the grouping gap on the addressed note", () => {
      const toggled = scoreReducer(threeNotes(), {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 1 },
      });

      expect(toggled.parts[0].notes[1].spaceAfter).toBe(true);
      expect(toggled.parts[0].notes[0].spaceAfter).toBeUndefined();
      expect(toggled.parts[0].notes[2].spaceAfter).toBeUndefined();
    });

    it("does not change duration, element count, or type", () => {
      const before = threeNotes();
      const after = scoreReducer(before, {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 1 },
      });

      expect(after.parts[0].notes).toHaveLength(before.parts[0].notes.length);
      expect(after.parts[0].notes[1].duration).toBe("quarter");
      expect(after.parts[0].notes[1].type).toBe("note");
    });

    it("clears the gap on a second toggle, storing undefined not false", () => {
      const on = scoreReducer(threeNotes(), {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      const off = scoreReducer(on, {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 0 },
      });

      expect(off.parts[0].notes[0].spaceAfter).toBeUndefined();
      // The marker must be absent, not present-and-false, so exports stay clean
      expect("spaceAfter" in off.parts[0].notes[0]).toBe(true);
      expect(JSON.parse(JSON.stringify(off.parts[0].notes[0]))).not.toHaveProperty(
        "spaceAfter",
      );
    });

    it("works on a rest", () => {
      const withRest = scoreReducer(initialScoreState, {
        type: "ADD_REST",
        payload: { duration: "quarter" },
      });
      const toggled = scoreReducer(withRest, {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 0 },
      });

      expect(toggled.parts[0].notes[0].type).toBe("rest");
      expect(toggled.parts[0].notes[0].spaceAfter).toBe(true);
    });

    it("is independent of the line break marker", () => {
      const spaced = scoreReducer(threeNotes(), {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      const both = scoreReducer(spaced, {
        type: "TOGGLE_LINE_BREAK",
        payload: { partIndex: 0, noteIndex: 0 },
      });

      expect(both.parts[0].notes[0].spaceAfter).toBe(true);
      expect(both.parts[0].notes[0].lineBreakAfter).toBe(true);

      const spaceOff = scoreReducer(both, {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      expect(spaceOff.parts[0].notes[0].spaceAfter).toBeUndefined();
      expect(spaceOff.parts[0].notes[0].lineBreakAfter).toBe(true);
    });

    it("ignores an out-of-range index", () => {
      const state = threeNotes();
      expect(
        scoreReducer(state, {
          type: "TOGGLE_SPACE",
          payload: { partIndex: 0, noteIndex: 99 },
        }),
      ).toBe(state);
    });
  });

  describe("CYCLE_MEASURE_ACCENT", () => {
    const oneNote = (extra: Record<string, unknown> = {}) => {
      const state = scoreReducer(initialScoreState, {
        type: "ADD_NOTE",
        payload: { pitch: "G", octave: "middle", duration: "quarter" },
      });
      const notes = [...state.parts[0].notes];
      notes[0] = { ...notes[0], ...extra } as typeof notes[0];
      return { ...state, parts: [{ ...state.parts[0], notes }] };
    };
    const cycle = (state: Score) =>
      scoreReducer(state, {
        type: "CYCLE_MEASURE_ACCENT",
        payload: { partIndex: 0, noteIndex: 0 },
      });

    it("cycles automatic to on to off and back", () => {
      const auto = oneNote();
      expect(auto.parts[0].notes[0].measureAccent).toBeUndefined();

      const on = cycle(auto);
      expect(on.parts[0].notes[0].measureAccent).toBe("on");

      const off = cycle(on);
      expect(off.parts[0].notes[0].measureAccent).toBe("off");

      const back = cycle(off);
      expect(back.parts[0].notes[0].measureAccent).toBeUndefined();
    });

    it("stores undefined for automatic so the field leaves no trace in JSON", () => {
      const back = cycle(cycle(cycle(oneNote())));
      expect(JSON.parse(JSON.stringify(back.parts[0].notes[0]))).not.toHaveProperty(
        "measureAccent",
      );
    });

    it("works on a rest", () => {
      const withRest = scoreReducer(initialScoreState, {
        type: "ADD_REST",
        payload: { duration: "quarter" },
      });
      const cycled = cycle(withRest);

      expect(cycled.parts[0].notes[0].type).toBe("rest");
      expect(cycled.parts[0].notes[0].measureAccent).toBe("on");
    });

    it("leaves the accented (sharp) property untouched", () => {
      const sharp = oneNote({ accented: true });
      const cycled = cycle(sharp);

      expect(cycled.parts[0].notes[0]).toMatchObject({
        accented: true,
        measureAccent: "on",
      });
    });

    it("does not disturb the other layout markers", () => {
      const marked = oneNote({ spaceAfter: true, lineBreakAfter: true });
      const cycled = cycle(marked);

      expect(cycled.parts[0].notes[0].spaceAfter).toBe(true);
      expect(cycled.parts[0].notes[0].lineBreakAfter).toBe(true);
    });

    it("ignores an out-of-range index", () => {
      const state = oneNote();
      expect(
        scoreReducer(state, {
          type: "CYCLE_MEASURE_ACCENT",
          payload: { partIndex: 0, noteIndex: 99 },
        }),
      ).toBe(state);
    });
  });

  describe("repeat markers", () => {
    const twoNotes = () => {
      let state = initialScoreState;
      for (const pitch of ["C", "D"] as const) {
        state = scoreReducer(state, {
          type: "ADD_NOTE",
          payload: { pitch, octave: "middle", duration: "quarter" },
        });
      }
      return state;
    };

    it("sets and clears the repeat start", () => {
      const on = scoreReducer(twoNotes(), {
        type: "TOGGLE_REPEAT_START",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      expect(on.parts[0].notes[0].repeatStart).toBe(true);

      const off = scoreReducer(on, {
        type: "TOGGLE_REPEAT_START",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      expect(off.parts[0].notes[0].repeatStart).toBeUndefined();
      expect(JSON.parse(JSON.stringify(off.parts[0].notes[0]))).not.toHaveProperty(
        "repeatStart",
      );
    });

    it("sets and clears the repeat end", () => {
      const on = scoreReducer(twoNotes(), {
        type: "TOGGLE_REPEAT_END",
        payload: { partIndex: 0, noteIndex: 1 },
      });
      expect(on.parts[0].notes[1].repeatEnd).toBe(true);
      expect(on.parts[0].notes[0].repeatEnd).toBeUndefined();
    });

    it("keeps the two marks independent, including both on one element", () => {
      let state = scoreReducer(twoNotes(), {
        type: "TOGGLE_REPEAT_START",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      state = scoreReducer(state, {
        type: "TOGGLE_REPEAT_END",
        payload: { partIndex: 0, noteIndex: 0 },
      });

      expect(state.parts[0].notes[0]).toMatchObject({
        repeatStart: true,
        repeatEnd: true,
      });

      const startOff = scoreReducer(state, {
        type: "TOGGLE_REPEAT_START",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      expect(startOff.parts[0].notes[0].repeatStart).toBeUndefined();
      expect(startOff.parts[0].notes[0].repeatEnd).toBe(true);
    });

    it("works on a rest", () => {
      const withRest = scoreReducer(initialScoreState, {
        type: "ADD_REST",
        payload: { duration: "quarter" },
      });
      const marked = scoreReducer(withRest, {
        type: "TOGGLE_REPEAT_START",
        payload: { partIndex: 0, noteIndex: 0 },
      });

      expect(marked.parts[0].notes[0].type).toBe("rest");
      expect(marked.parts[0].notes[0].repeatStart).toBe(true);
    });

    it("changes nothing else about the element or the score", () => {
      const before = twoNotes();
      const after = scoreReducer(before, {
        type: "TOGGLE_REPEAT_START",
        payload: { partIndex: 0, noteIndex: 0 },
      });

      expect(after.parts[0].notes).toHaveLength(before.parts[0].notes.length);
      expect(after.parts[0].notes[0]).toMatchObject({
        pitch: "C",
        octave: "middle",
        duration: "quarter",
      });
    });

    it("leaves the other markers alone", () => {
      let state = scoreReducer(twoNotes(), {
        type: "TOGGLE_SPACE",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      state = scoreReducer(state, {
        type: "CYCLE_MEASURE_ACCENT",
        payload: { partIndex: 0, noteIndex: 0 },
      });
      state = scoreReducer(state, {
        type: "TOGGLE_REPEAT_START",
        payload: { partIndex: 0, noteIndex: 0 },
      });

      expect(state.parts[0].notes[0]).toMatchObject({
        spaceAfter: true,
        measureAccent: "on",
        repeatStart: true,
      });
    });

    it("ignores an out-of-range index", () => {
      const state = twoNotes();
      expect(
        scoreReducer(state, {
          type: "TOGGLE_REPEAT_END",
          payload: { partIndex: 0, noteIndex: 99 },
        }),
      ).toBe(state);
    });
  });
});
