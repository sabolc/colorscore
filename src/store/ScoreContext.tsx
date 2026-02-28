/**
 * ULWILA Color Score Editor - Score Context
 *
 * This module provides React context for score state management.
 * Separates state and dispatch contexts for performance optimization.
 */

import React, { createContext, useContext, useReducer, type ReactNode } from "react";
import { scoreReducer, initialScoreState, type ScoreAction } from "./scoreReducer";
import type { Score } from "../models/types";

// Separate contexts for state and dispatch (performance optimization)
const ScoreStateContext = createContext<Score | undefined>(undefined);
const ScoreDispatchContext = createContext<React.Dispatch<ScoreAction> | undefined>(undefined);

interface ScoreProviderProps {
  children: ReactNode;
  initialScore?: Score;
}

/**
 * ScoreProvider component that wraps the application and provides score state.
 */
export function ScoreProvider({ children, initialScore }: ScoreProviderProps) {
  const [state, dispatch] = useReducer(scoreReducer, initialScore || initialScoreState);

  return (
    <ScoreStateContext.Provider value={state}>
      <ScoreDispatchContext.Provider value={dispatch}>
        {children}
      </ScoreDispatchContext.Provider>
    </ScoreStateContext.Provider>
  );
}

/**
 * Hook to access the current score state.
 * @throws Error if used outside of ScoreProvider
 */
export function useScore(): Score {
  const context = useContext(ScoreStateContext);
  if (context === undefined) {
    throw new Error("useScore must be used within a ScoreProvider");
  }
  return context;
}

/**
 * Hook to access the score dispatch function.
 * @throws Error if used outside of ScoreProvider
 */
export function useScoreDispatch(): React.Dispatch<ScoreAction> {
  const context = useContext(ScoreDispatchContext);
  if (context === undefined) {
    throw new Error("useScoreDispatch must be used within a ScoreProvider");
  }
  return context;
}
