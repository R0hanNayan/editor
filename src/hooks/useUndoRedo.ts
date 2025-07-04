import React from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
  lastGroup?: string | null;
}

interface UndoRedoActions {
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface UndoRedoResult<T> extends UndoRedoActions {
  state: T;
  setState: (newState: T | ((prevState: T) => T), skipHistory?: boolean) => void;
}

export function useUndoRedo<T>(
  initialState: T,
  options: {
    limit?: number;
    filter?: (prevState: T, nextState: T) => boolean;
    groupBy?: (prevState: T, nextState: T) => string | null;
  } = {}
): UndoRedoResult<T> {
  const { limit = 50, filter, groupBy } = options;
  
  const [undoRedoState, setUndoRedoState] = React.useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
    lastGroup: null,
  });

  const setState = React.useCallback((
    newState: T | ((prevState: T) => T),
    skipHistory: boolean = false
  ) => {
    setUndoRedoState(prevUndoRedoState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prevState: T) => T)(prevUndoRedoState.present)
        : newState;

      // Skip adding to history if requested or if state hasn't changed
      if (skipHistory || prevUndoRedoState.present === nextState) {
        return {
          ...prevUndoRedoState,
          present: nextState,
        };
      }

      // Apply filter if provided
      if (filter && !filter(prevUndoRedoState.present, nextState)) {
        return {
          ...prevUndoRedoState,
          present: nextState,
        };
      }

      // Check if we should group this action
      const currentGroup = groupBy ? groupBy(prevUndoRedoState.present, nextState) : null;
      
      if (currentGroup && currentGroup === prevUndoRedoState.lastGroup && prevUndoRedoState.past.length > 0) {
        // Group with the last action - replace the last state instead of adding new one
        return {
          ...prevUndoRedoState,
          present: nextState,
          future: [], // Clear future when new action is performed
        };
      }

      const newPast = [...prevUndoRedoState.past, prevUndoRedoState.present];
      
      // Apply limit
      const limitedPast = limit && newPast.length > limit 
        ? newPast.slice(-limit) 
        : newPast;

      return {
        past: limitedPast,
        present: nextState,
        future: [], // Clear future when new action is performed
        lastGroup: currentGroup,
      };
    });
  }, [filter, groupBy, limit]);

  const undo = React.useCallback(() => {
    setUndoRedoState(prevUndoRedoState => {
      if (prevUndoRedoState.past.length === 0) {
        return prevUndoRedoState;
      }

      const previous = prevUndoRedoState.past[prevUndoRedoState.past.length - 1];
      const newPast = prevUndoRedoState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [prevUndoRedoState.present, ...prevUndoRedoState.future],
        lastGroup: null, // Reset group after undo
      };
    });
  }, []);

  const redo = React.useCallback(() => {
    setUndoRedoState(prevUndoRedoState => {
      if (prevUndoRedoState.future.length === 0) {
        return prevUndoRedoState;
      }

      const next = prevUndoRedoState.future[0];
      const newFuture = prevUndoRedoState.future.slice(1);

      return {
        past: [...prevUndoRedoState.past, prevUndoRedoState.present],
        present: next,
        future: newFuture,
        lastGroup: null, // Reset group after redo
      };
    });
  }, []);

  const clearHistory = React.useCallback(() => {
    setUndoRedoState(prevUndoRedoState => ({
      past: [],
      present: prevUndoRedoState.present,
      future: [],
      lastGroup: null,
    }));
  }, []);

  const canUndo = undoRedoState.past.length > 0;
  const canRedo = undoRedoState.future.length > 0;

  return {
    state: undoRedoState.present,
    setState,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  };
}
