/**
 * Tests for the history store
 */

import { describe, it, expect } from 'vitest';
import {
	createHistoryState,
	recordAction,
	popUndo,
	popRedo,
	canUndo,
	canRedo,
	clearHistory,
	getUndoCount,
	getRedoCount,
	DEFAULT_HISTORY_LIMIT
} from './history';
import type { CreatePeriodAction } from '$lib/types';

// Helper to create a test action
function createTestAction(): CreatePeriodAction {
	return {
		type: 'CREATE_PERIOD',
		timestamp: new Date().toISOString(),
		periodId: `period-${Date.now()}`,
		index: 0,
		period: {
			id: `period-${Date.now()}`,
			name: 'Test Period',
			tone: 'light',
			events: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}
	};
}

describe('History Store', () => {
	describe('createHistoryState', () => {
		it('should create empty state with default limit', () => {
			const state = createHistoryState();
			expect(state.undoStack).toEqual([]);
			expect(state.redoStack).toEqual([]);
			expect(state.limit).toBe(DEFAULT_HISTORY_LIMIT);
		});

		it('should create state with custom limit', () => {
			const state = createHistoryState(10);
			expect(state.limit).toBe(10);
		});
	});

	describe('recordAction', () => {
		it('should add action to undo stack', () => {
			const state = createHistoryState();
			const action = createTestAction();
			const newState = recordAction(state, action);

			expect(newState.undoStack).toHaveLength(1);
			expect(newState.undoStack[0]).toBe(action);
		});

		it('should clear redo stack when recording new action', () => {
			let state = createHistoryState();
			const action1 = createTestAction();
			const action2 = createTestAction();

			state = recordAction(state, action1);
			state = recordAction(state, action2);

			// Undo to move action2 to redo stack
			const result = popUndo(state);
			expect(result).not.toBeNull();
			state = result!.newState;
			expect(state.redoStack).toHaveLength(1);

			// Record new action - should clear redo stack
			const action3 = createTestAction();
			state = recordAction(state, action3);
			expect(state.redoStack).toHaveLength(0);
		});

		it('should trim oldest actions when over limit', () => {
			const state = createHistoryState(3);
			let currentState = state;

			for (let i = 0; i < 5; i++) {
				currentState = recordAction(currentState, createTestAction());
			}

			expect(currentState.undoStack).toHaveLength(3);
		});
	});

	describe('popUndo', () => {
		it('should return null when undo stack is empty', () => {
			const state = createHistoryState();
			const result = popUndo(state);
			expect(result).toBeNull();
		});

		it('should remove action from undo stack and add to redo stack', () => {
			let state = createHistoryState();
			const action = createTestAction();
			state = recordAction(state, action);

			const result = popUndo(state);
			expect(result).not.toBeNull();
			expect(result!.action).toBe(action);
			expect(result!.newState.undoStack).toHaveLength(0);
			expect(result!.newState.redoStack).toHaveLength(1);
			expect(result!.newState.redoStack[0]).toBe(action);
		});
	});

	describe('popRedo', () => {
		it('should return null when redo stack is empty', () => {
			const state = createHistoryState();
			const result = popRedo(state);
			expect(result).toBeNull();
		});

		it('should remove action from redo stack and add back to undo stack', () => {
			let state = createHistoryState();
			const action = createTestAction();
			state = recordAction(state, action);

			// Undo first
			let result = popUndo(state);
			state = result!.newState;

			// Now redo
			result = popRedo(state);
			expect(result).not.toBeNull();
			expect(result!.action).toBe(action);
			expect(result!.newState.undoStack).toHaveLength(1);
			expect(result!.newState.redoStack).toHaveLength(0);
		});
	});

	describe('canUndo', () => {
		it('should return false when undo stack is empty', () => {
			const state = createHistoryState();
			expect(canUndo(state)).toBe(false);
		});

		it('should return true when undo stack has actions', () => {
			let state = createHistoryState();
			state = recordAction(state, createTestAction());
			expect(canUndo(state)).toBe(true);
		});
	});

	describe('canRedo', () => {
		it('should return false when redo stack is empty', () => {
			const state = createHistoryState();
			expect(canRedo(state)).toBe(false);
		});

		it('should return true when redo stack has actions', () => {
			let state = createHistoryState();
			state = recordAction(state, createTestAction());
			const result = popUndo(state);
			state = result!.newState;
			expect(canRedo(state)).toBe(true);
		});
	});

	describe('clearHistory', () => {
		it('should clear both stacks', () => {
			let state = createHistoryState();
			state = recordAction(state, createTestAction());
			state = recordAction(state, createTestAction());

			const result = popUndo(state);
			state = result!.newState;

			state = clearHistory(state);
			expect(state.undoStack).toHaveLength(0);
			expect(state.redoStack).toHaveLength(0);
		});
	});

	describe('getUndoCount', () => {
		it('should return correct count', () => {
			let state = createHistoryState();
			expect(getUndoCount(state)).toBe(0);

			state = recordAction(state, createTestAction());
			expect(getUndoCount(state)).toBe(1);

			state = recordAction(state, createTestAction());
			expect(getUndoCount(state)).toBe(2);
		});
	});

	describe('getRedoCount', () => {
		it('should return correct count', () => {
			let state = createHistoryState();
			expect(getRedoCount(state)).toBe(0);

			state = recordAction(state, createTestAction());
			let result = popUndo(state);
			state = result!.newState;
			expect(getRedoCount(state)).toBe(1);

			state = recordAction(state, createTestAction());
			result = popUndo(state);
			state = result!.newState;
			expect(getRedoCount(state)).toBe(1);
		});
	});
});
