/**
 * Tests for autosave utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAutosave } from './autosave';
import type { Game } from '$lib/types';
import * as persistence from './persistence';

// Mock the persistence module
vi.mock('./persistence', () => ({
	saveGame: vi.fn(),
	PersistenceError: class PersistenceError extends Error {
		constructor(
			message: string,
			public readonly cause?: unknown
		) {
			super(message);
			this.name = 'PersistenceError';
		}
	}
}));

function createMockGame(id: string = 'test-id', name: string = 'Test Game'): Game {
	const now = new Date().toISOString();
	return {
		id,
		schemaVersion: 1,
		name,
		legacies: [],
		periods: [],
		createdAt: now,
		updatedAt: now
	};
}

describe('Autosave', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('createAutosave', () => {
		it('should create autosave with save, cancel, and flush functions', () => {
			const autosave = createAutosave();

			expect(autosave.save).toBeDefined();
			expect(autosave.cancel).toBeDefined();
			expect(autosave.flush).toBeDefined();
		});
	});

	describe('save', () => {
		it('should debounce saves with default delay', async () => {
			const autosave = createAutosave();
			const game = createMockGame();

			autosave.save(game);

			// Should not save immediately
			expect(persistence.saveGame).not.toHaveBeenCalled();

			// Fast forward past debounce delay (500ms default)
			await vi.advanceTimersByTimeAsync(500);

			expect(persistence.saveGame).toHaveBeenCalledTimes(1);
			expect(persistence.saveGame).toHaveBeenCalledWith(game);
		});

		it('should use custom delay when provided', async () => {
			const autosave = createAutosave(undefined, 1000);
			const game = createMockGame();

			autosave.save(game);

			// Should not save after default delay
			await vi.advanceTimersByTimeAsync(500);
			expect(persistence.saveGame).not.toHaveBeenCalled();

			// Should save after custom delay
			await vi.advanceTimersByTimeAsync(500);
			expect(persistence.saveGame).toHaveBeenCalledTimes(1);
		});

		it('should cancel pending save when new save is scheduled', async () => {
			const autosave = createAutosave();
			const game1 = createMockGame('game-1', 'Game 1');
			const game2 = createMockGame('game-2', 'Game 2');

			autosave.save(game1);
			await vi.advanceTimersByTimeAsync(250);

			autosave.save(game2);
			await vi.advanceTimersByTimeAsync(500);

			// Should only save the second game
			expect(persistence.saveGame).toHaveBeenCalledTimes(1);
			expect(persistence.saveGame).toHaveBeenCalledWith(game2);
		});

		it('should call error callback on save failure', async () => {
			const errorCallback = vi.fn();
			const autosave = createAutosave(errorCallback);
			const game = createMockGame();
			const testError = new persistence.PersistenceError('Save failed');

			vi.mocked(persistence.saveGame).mockRejectedValueOnce(testError);

			autosave.save(game);
			await vi.advanceTimersByTimeAsync(500);

			expect(errorCallback).toHaveBeenCalledWith(testError);
		});

		it('should log to console for non-PersistenceError errors', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const autosave = createAutosave();
			const game = createMockGame();
			const testError = new Error('Generic error');

			vi.mocked(persistence.saveGame).mockRejectedValueOnce(testError);

			autosave.save(game);
			await vi.advanceTimersByTimeAsync(500);

			expect(consoleSpy).toHaveBeenCalledWith('Autosave failed:', testError);
			consoleSpy.mockRestore();
		});
	});

	describe('cancel', () => {
		it('should cancel pending save', async () => {
			const autosave = createAutosave();
			const game = createMockGame();

			autosave.save(game);
			autosave.cancel();

			await vi.advanceTimersByTimeAsync(500);

			expect(persistence.saveGame).not.toHaveBeenCalled();
		});
	});

	describe('flush', () => {
		it('should save immediately when there is a pending save', async () => {
			const autosave = createAutosave();
			const game = createMockGame();

			autosave.save(game);

			// Flush should save immediately without waiting for debounce
			await autosave.flush();

			expect(persistence.saveGame).toHaveBeenCalledTimes(1);
			expect(persistence.saveGame).toHaveBeenCalledWith(game);
		});

		it('should cancel pending debounced save after flush', async () => {
			const autosave = createAutosave();
			const game = createMockGame();

			autosave.save(game);
			await autosave.flush();

			// Advance time - should not save again
			await vi.advanceTimersByTimeAsync(500);

			// Should only have been called once (by flush)
			expect(persistence.saveGame).toHaveBeenCalledTimes(1);
		});

		it('should not save if there is no pending game', async () => {
			const autosave = createAutosave();

			await autosave.flush();

			expect(persistence.saveGame).not.toHaveBeenCalled();
		});

		it('should call error callback on flush failure', async () => {
			const errorCallback = vi.fn();
			const autosave = createAutosave(errorCallback);
			const game = createMockGame();
			const testError = new persistence.PersistenceError('Flush failed');

			vi.mocked(persistence.saveGame).mockRejectedValueOnce(testError);

			autosave.save(game);
			await autosave.flush();

			expect(errorCallback).toHaveBeenCalledWith(testError);
		});

		it('should log to console for non-PersistenceError errors on flush', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const autosave = createAutosave();
			const game = createMockGame();
			const testError = new Error('Generic flush error');

			vi.mocked(persistence.saveGame).mockRejectedValueOnce(testError);

			autosave.save(game);
			await autosave.flush();

			expect(consoleSpy).toHaveBeenCalledWith('Autosave flush failed:', testError);
			consoleSpy.mockRestore();
		});
	});
});
