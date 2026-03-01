/**
 * ULWILA Color Score Editor - Keyboard Shortcuts Hook
 *
 * Provides keyboard navigation and editing shortcuts for the score editor.
 * Suppresses shortcuts when text inputs, selects, or textareas are focused.
 *
 * Shortcuts:
 *   ArrowRight      — Select next note
 *   ArrowLeft       — Select previous note
 *   Shift+ArrowR/L  — Extend selection (range)
 *   Home            — Select first note
 *   End             — Select last note
 *   Escape          — Clear selection
 *   Delete/Backspace — Delete selected note(s)
 *   Enter           — Toggle line break after selected note
 */

import { useEffect, useCallback } from "react";
import type { SelectionAction } from "../store/selectionReducer";
import { getSelectionRange, getSelectedCount } from "../store/selectionReducer";
import type { ScoreAction } from "../store/scoreReducer";
import type { Score } from "../models/types";

interface SelectionStateCompat {
  partIndex: number;
  anchorIndex: number;
  focusIndex: number;
}

interface UseKeyboardShortcutsOptions {
  score: Score;
  selection: SelectionStateCompat | null;
  selectionDispatch: React.Dispatch<SelectionAction>;
  scoreDispatch: React.Dispatch<ScoreAction>;
}

/**
 * Check if the currently focused element is a text input, select, or textarea.
 * When these are focused, keyboard shortcuts should be suppressed.
 */
function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function useKeyboardShortcuts({
  score,
  selection,
  selectionDispatch,
  scoreDispatch,
}: UseKeyboardShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const partIndex = selection?.partIndex ?? 0;
      const noteCount = score.parts[partIndex]?.notes.length ?? 0;

      switch (e.key) {
        case "ArrowRight": {
          e.preventDefault();
          if (e.shiftKey && selection) {
            // Extend selection forward
            const newFocus = Math.min(selection.focusIndex + 1, noteCount - 1);
            selectionDispatch({
              type: "EXTEND_SELECTION",
              payload: { noteIndex: newFocus },
            });
          } else if (selection) {
            // Collapse multi-selection or move forward
            const count = getSelectedCount(selection);
            const { end } = getSelectionRange(selection);
            const newIndex = count > 1
              ? end
              : Math.min(selection.focusIndex + 1, noteCount - 1);
            selectionDispatch({
              type: "SELECT_NOTE",
              payload: { partIndex, noteIndex: newIndex },
            });
          } else if (noteCount > 0) {
            selectionDispatch({
              type: "SELECT_NOTE",
              payload: { partIndex: 0, noteIndex: 0 },
            });
          }
          break;
        }

        case "ArrowLeft": {
          e.preventDefault();
          if (e.shiftKey && selection) {
            // Extend selection backward
            const newFocus = Math.max(selection.focusIndex - 1, 0);
            selectionDispatch({
              type: "EXTEND_SELECTION",
              payload: { noteIndex: newFocus },
            });
          } else if (selection) {
            // Collapse multi-selection or move backward
            const count = getSelectedCount(selection);
            const { start } = getSelectionRange(selection);
            const newIndex = count > 1
              ? start
              : Math.max(selection.focusIndex - 1, 0);
            selectionDispatch({
              type: "SELECT_NOTE",
              payload: { partIndex, noteIndex: newIndex },
            });
          }
          break;
        }

        case "Home": {
          e.preventDefault();
          if (noteCount > 0) {
            selectionDispatch({
              type: "SELECT_NOTE",
              payload: { partIndex: 0, noteIndex: 0 },
            });
          }
          break;
        }

        case "End": {
          e.preventDefault();
          if (noteCount > 0) {
            selectionDispatch({
              type: "SELECT_NOTE",
              payload: { partIndex: 0, noteIndex: noteCount - 1 },
            });
          }
          break;
        }

        case "Escape": {
          e.preventDefault();
          selectionDispatch({ type: "CLEAR_SELECTION" });
          break;
        }

        case "Delete":
        case "Backspace": {
          if (selection) {
            e.preventDefault();
            const count = getSelectedCount(selection);
            const { start, end } = getSelectionRange(selection);

            if (count > 1) {
              scoreDispatch({
                type: "DELETE_NOTES",
                payload: { partIndex, startIndex: start, endIndex: end },
              });
            } else {
              scoreDispatch({
                type: "DELETE_NOTE",
                payload: { partIndex, noteIndex: start },
              });
            }

            // After deletion, select adjacent note
            const newNoteCount = noteCount - count;
            if (newNoteCount === 0) {
              selectionDispatch({ type: "CLEAR_SELECTION" });
            } else {
              const newIndex = Math.min(start, newNoteCount - 1);
              selectionDispatch({
                type: "SELECT_NOTE",
                payload: { partIndex, noteIndex: newIndex },
              });
            }
          }
          break;
        }

        case "Enter": {
          if (selection && getSelectedCount(selection) === 1) {
            e.preventDefault();
            scoreDispatch({
              type: "TOGGLE_LINE_BREAK",
              payload: { partIndex, noteIndex: selection.focusIndex },
            });
          }
          break;
        }
      }
    },
    [score, selection, selectionDispatch, scoreDispatch],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
