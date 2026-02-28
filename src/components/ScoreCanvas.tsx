import React, { useRef } from 'react';
import { useScore } from '../store/ScoreContext';
import { useSelection, useSelectionDispatch } from '../store/SelectionContext';
import StaffRenderer from '../renderers/StaffRenderer';
import CirclesRenderer from '../renderers/CirclesRenderer';
import styles from './ScoreCanvas.module.css';

interface ScoreCanvasProps {
  onNoteClick?: (partIndex: number, noteIndex: number) => void;
}

export const ScoreCanvas = React.forwardRef<HTMLDivElement, ScoreCanvasProps>(
  ({ onNoteClick }, ref) => {
    const score = useScore();
    const selection = useSelection();
    const selectionDispatch = useSelectionDispatch();
    const internalRef = useRef<HTMLDivElement>(null);

    // Use provided ref or internal ref
    const containerRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // If clicking on the canvas background (not a note), clear selection
      if (e.target === e.currentTarget) {
        selectionDispatch({ type: 'CLEAR_SELECTION' });
      }
    };

    const handleNoteClick = (partIndex: number, noteIndex: number) => {
      selectionDispatch({
        type: 'SELECT_NOTE',
        payload: { partIndex, noteIndex }
      });
      if (onNoteClick) {
        onNoteClick(partIndex, noteIndex);
      }
    };

    const renderContent = () => {
      if (score.renderingMode === 'staff') {
        return (
          <StaffRenderer
            score={score}
            selection={selection}
            onNoteClick={handleNoteClick}
            width={800}
          />
        );
      } else if (score.renderingMode === 'circles') {
        return (
          <CirclesRenderer
            score={score}
            selection={selection}
            onNoteClick={handleNoteClick}
            width={800}
          />
        );
      }
      return null;
    };

    return (
      <div
        ref={containerRef}
        className={styles.scoreCanvas}
        data-testid="score-canvas"
        onClick={handleCanvasClick}
      >
        {renderContent()}
      </div>
    );
  }
);

ScoreCanvas.displayName = 'ScoreCanvas';
