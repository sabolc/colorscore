/**
 * ULWILA Color Score Editor - Selection Reducer
 *
 * This module defines the state management logic for note selection.
 * Supports single-note and range (multi-note) selection via anchor/focus model.
 */

export interface SelectionState {
  partIndex: number;
  anchorIndex: number;
  focusIndex: number;
}

export type SelectionAction =
  | { type: "SELECT_NOTE"; payload: { partIndex: number; noteIndex: number } }
  | { type: "EXTEND_SELECTION"; payload: { noteIndex: number } }
  | { type: "CLEAR_SELECTION" };

export const initialSelectionState: SelectionState | null = null;

/**
 * Get the effective start/end range from a selection.
 */
export function getSelectionRange(sel: SelectionState): { start: number; end: number } {
  return {
    start: Math.min(sel.anchorIndex, sel.focusIndex),
    end: Math.max(sel.anchorIndex, sel.focusIndex),
  };
}

/**
 * Check if a specific note is within the current selection range.
 */
export function isNoteSelected(
  sel: SelectionState | null,
  partIndex: number,
  noteIndex: number,
): boolean {
  if (!sel || sel.partIndex !== partIndex) return false;
  const { start, end } = getSelectionRange(sel);
  return noteIndex >= start && noteIndex <= end;
}

/**
 * Get the number of selected notes.
 */
export function getSelectedCount(sel: SelectionState): number {
  const { start, end } = getSelectionRange(sel);
  return end - start + 1;
}

export function selectionReducer(
  state: SelectionState | null,
  action: SelectionAction
): SelectionState | null {
  switch (action.type) {
    case "SELECT_NOTE":
      return {
        partIndex: action.payload.partIndex,
        anchorIndex: action.payload.noteIndex,
        focusIndex: action.payload.noteIndex,
      };

    case "EXTEND_SELECTION":
      if (!state) return state;
      return {
        ...state,
        focusIndex: action.payload.noteIndex,
      };

    case "CLEAR_SELECTION":
      return null;

    default:
      return state;
  }
}
