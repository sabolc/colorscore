/**
 * ULWILA Color Score Editor - Selection Reducer
 *
 * This module defines the state management logic for note selection.
 */

export interface SelectionState {
  partIndex: number;
  noteIndex: number;
}

export type SelectionAction =
  | { type: "SELECT_NOTE"; payload: { partIndex: number; noteIndex: number } }
  | { type: "CLEAR_SELECTION" };

export const initialSelectionState: SelectionState | null = null;

export function selectionReducer(
  state: SelectionState | null,
  action: SelectionAction
): SelectionState | null {
  switch (action.type) {
    case "SELECT_NOTE":
      return {
        partIndex: action.payload.partIndex,
        noteIndex: action.payload.noteIndex,
      };

    case "CLEAR_SELECTION":
      return null;

    default:
      return state;
  }
}
