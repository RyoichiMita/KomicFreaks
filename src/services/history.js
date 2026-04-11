/**
 * Undo/Redo History System
 * 
 * Stores snapshots of timeline state (tracks) so users can undo/redo
 * timeline operations like adding/removing/moving clips, Auto-Cut, etc.
 * 
 * Only tracks are snapshotted — view state, playback, etc. are excluded.
 */

const MAX_HISTORY = 50;

/**
 * Creates a deep clone of the tracks array for snapshotting.
 * Strips non-serializable properties to keep snapshots lean.
 */
function snapshotTracks(tracks) {
  return tracks.map((track) => ({
    id: track.id,
    label: track.label,
    type: track.type,
    muted: track.muted,
    volume: track.volume,
    clips: track.clips.map((clip) => ({ ...clip })),
  }));
}

/**
 * Create the history middleware/manager.
 * Call pushHistory() before any mutation to save the "before" state.
 */
export function createHistoryManager() {
  let undoStack = [];
  let redoStack = [];

  return {
    /**
     * Push the current tracks state onto the undo stack.
     * Call this BEFORE mutating tracks.
     */
    push(tracks) {
      undoStack.push(snapshotTracks(tracks));
      if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
      }
      // Any new action clears the redo stack
      redoStack = [];
    },

    /**
     * Undo: pops the last state from undo stack,
     * pushes current onto redo, and returns the previous state.
     */
    undo(currentTracks) {
      if (undoStack.length === 0) return null;

      redoStack.push(snapshotTracks(currentTracks));
      return undoStack.pop();
    },

    /**
     * Redo: pops from redo stack,
     * pushes current onto undo, returns the next state.
     */
    redo(currentTracks) {
      if (redoStack.length === 0) return null;

      undoStack.push(snapshotTracks(currentTracks));
      return redoStack.pop();
    },

    canUndo() {
      return undoStack.length > 0;
    },

    canRedo() {
      return redoStack.length > 0;
    },

    getUndoCount() {
      return undoStack.length;
    },

    getRedoCount() {
      return redoStack.length;
    },

    clear() {
      undoStack = [];
      redoStack = [];
    },
  };
}
