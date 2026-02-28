/**
 * ULWILA Color Score Editor - Selection Context
 *
 * This module provides React context for note selection state management.
 * Separates state and dispatch contexts for performance optimization.
 */

import React, { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  selectionReducer,
  initialSelectionState,
  type SelectionAction,
  type SelectionState,
} from "./selectionReducer";

// Separate contexts for state and dispatch (performance optimization)
const SelectionStateContext = createContext<SelectionState | null | undefined>(undefined);
const SelectionDispatchContext = createContext<React.Dispatch<SelectionAction> | undefined>(
  undefined
);

interface SelectionProviderProps {
  children: ReactNode;
}

/**
 * SelectionProvider component that wraps the application and provides selection state.
 */
export function SelectionProvider({ children }: SelectionProviderProps) {
  const [state, dispatch] = useReducer(selectionReducer, initialSelectionState);

  return (
    <SelectionStateContext.Provider value={state}>
      <SelectionDispatchContext.Provider value={dispatch}>
        {children}
      </SelectionDispatchContext.Provider>
    </SelectionStateContext.Provider>
  );
}

/**
 * Hook to access the current selection state.
 * @throws Error if used outside of SelectionProvider
 */
export function useSelection(): SelectionState | null {
  const context = useContext(SelectionStateContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}

/**
 * Hook to access the selection dispatch function.
 * @throws Error if used outside of SelectionProvider
 */
export function useSelectionDispatch(): React.Dispatch<SelectionAction> {
  const context = useContext(SelectionDispatchContext);
  if (context === undefined) {
    throw new Error("useSelectionDispatch must be used within a SelectionProvider");
  }
  return context;
}
