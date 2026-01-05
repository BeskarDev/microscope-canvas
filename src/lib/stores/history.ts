/**
 * History store for undo/redo functionality
 * Manages action history with configurable limits
 */

import type { GameAction } from '$lib/types';

/**
 * Default maximum number of actions to keep in history
 */
export const DEFAULT_HISTORY_LIMIT = 50;

/**
 * History state interface
 */
export interface HistoryState {
	undoStack: GameAction[];
	redoStack: GameAction[];
	limit: number;
}

/**
 * Creates a new history state with empty stacks
 */
export function createHistoryState(limit: number = DEFAULT_HISTORY_LIMIT): HistoryState {
	return {
		undoStack: [],
		redoStack: [],
		limit
	};
}

/**
 * Records a new action to the history
 * Clears the redo stack and trims the undo stack if needed
 */
export function recordAction(state: HistoryState, action: GameAction): HistoryState {
	let newUndoStack = [...state.undoStack, action];

	// Trim oldest actions if over limit (use slice for O(n) instead of loop with shift O(n²))
	if (newUndoStack.length > state.limit) {
		newUndoStack = newUndoStack.slice(newUndoStack.length - state.limit);
	}

	return {
		...state,
		undoStack: newUndoStack,
		redoStack: [] // Clear redo stack when new action is performed
	};
}

/**
 * Pops the last action from the undo stack for undoing
 * Returns the action and the new state, or null if stack is empty
 */
export function popUndo(state: HistoryState): { action: GameAction; newState: HistoryState } | null {
	if (state.undoStack.length === 0) {
		return null;
	}

	const undoStack = [...state.undoStack];
	const action = undoStack.pop()!;

	return {
		action,
		newState: {
			...state,
			undoStack,
			redoStack: [...state.redoStack, action]
		}
	};
}

/**
 * Pops the last action from the redo stack for redoing
 * Returns the action and the new state, or null if stack is empty
 */
export function popRedo(state: HistoryState): { action: GameAction; newState: HistoryState } | null {
	if (state.redoStack.length === 0) {
		return null;
	}

	const redoStack = [...state.redoStack];
	const action = redoStack.pop()!;

	return {
		action,
		newState: {
			...state,
			undoStack: [...state.undoStack, action],
			redoStack
		}
	};
}

/**
 * Checks if undo is available
 */
export function canUndo(state: HistoryState): boolean {
	return state.undoStack.length > 0;
}

/**
 * Checks if redo is available
 */
export function canRedo(state: HistoryState): boolean {
	return state.redoStack.length > 0;
}

/**
 * Clears all history
 */
export function clearHistory(state: HistoryState): HistoryState {
	return {
		...state,
		undoStack: [],
		redoStack: []
	};
}

/**
 * Gets the count of undoable actions
 */
export function getUndoCount(state: HistoryState): number {
	return state.undoStack.length;
}

/**
 * Gets the count of redoable actions
 */
export function getRedoCount(state: HistoryState): number {
	return state.redoStack.length;
}
