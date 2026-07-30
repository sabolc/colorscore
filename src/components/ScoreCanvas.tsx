import React, { useEffect, useRef, useState } from 'react';
import { useScore } from '../store/ScoreContext';
import { useSelection, useSelectionDispatch } from '../store/SelectionContext';
import StaffRenderer from '../renderers/StaffRenderer';
import CirclesRenderer from '../renderers/CirclesRenderer';
import styles from './ScoreCanvas.module.css';

interface ScoreCanvasProps {
  onNoteClick?: (partIndex: number, noteIndex: number) => void;
}

/** Fallback render width before the container has been measured. */
const DEFAULT_RENDER_WIDTH = 800;
/** Never render narrower than this, however cramped the container. */
const MIN_RENDER_WIDTH = 320;
/** Breathing room so the score is not flush against the container edge. */
const CANVAS_PADDING = 24;

/**
 * Track the container's width so the score fills the space actually available
 * instead of a fixed 800px, which would scroll horizontally once the editor
 * takes a column of its own.
 */
function useContainerWidth(ref: React.RefObject<HTMLElement>): number {
  const [width, setWidth] = useState(DEFAULT_RENDER_WIDTH);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const available = element.clientWidth - CANVAS_PADDING;
      setWidth(Math.max(MIN_RENDER_WIDTH, Math.round(available)));
    };

    measure();

    // Window resize covers the common case and works everywhere. The observer
    // adds the cases the window event misses — a sidebar opening, a font
    // loading, anything that resizes the container without resizing the window.
    window.addEventListener('resize', measure);

    // jsdom has no ResizeObserver; the listener above is enough there.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);

    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [ref]);

  return width;
}

export const ScoreCanvas = React.forwardRef<HTMLDivElement, ScoreCanvasProps>(
  ({ onNoteClick }, ref) => {
    const score = useScore();
    const selection = useSelection();
    const selectionDispatch = useSelectionDispatch();
    const internalRef = useRef<HTMLDivElement>(null);

    // Use provided ref or internal ref
    const containerRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
    const renderWidth = useContainerWidth(containerRef);

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // If clicking on the canvas background (not a note), clear selection
      if (e.target === e.currentTarget) {
        selectionDispatch({ type: 'CLEAR_SELECTION' });
      }
    };

    const handleNoteClick = (partIndex: number, noteIndex: number, event?: React.MouseEvent) => {
      if (event?.shiftKey && selection) {
        selectionDispatch({
          type: 'EXTEND_SELECTION',
          payload: { noteIndex },
        });
      } else {
        selectionDispatch({
          type: 'SELECT_NOTE',
          payload: { partIndex, noteIndex },
        });
      }
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
            width={renderWidth}
          />
        );
      } else if (score.renderingMode === 'circles') {
        return (
          <CirclesRenderer
            score={score}
            selection={selection}
            onNoteClick={handleNoteClick}
            width={renderWidth}
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
