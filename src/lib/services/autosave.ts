/**
 * Autosave utility for debounced game persistence
 */

import type { Game } from '$lib/types';
import { saveGame, PersistenceError } from '$lib/services/persistence';

/**
 * Default autosave delay in milliseconds
 */
const DEFAULT_AUTOSAVE_DELAY_MS = 500;

/**
 * Type for autosave error callback
 */
export type AutosaveErrorCallback = (error: PersistenceError) => void;

/**
 * Creates a debounced autosave function
 * @param onError Optional callback for save errors
 * @param delayMs Debounce delay in milliseconds (default: 500ms)
 * @returns Object with save and cancel functions
 */
export function createAutosave(
	onError?: AutosaveErrorCallback,
	delayMs: number = DEFAULT_AUTOSAVE_DELAY_MS
) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastGame: Game | null = null;

	/**
	 * Schedules an autosave for the given game
	 * Cancels any pending save and schedules a new one
	 */
	function save(game: Game): void {
		// Cancel any pending save
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		lastGame = game;

		// Schedule new save
		timeoutId = setTimeout(async () => {
			if (lastGame) {
				try {
					await saveGame(lastGame);
				} catch (error) {
					if (error instanceof PersistenceError && onError) {
						onError(error);
					} else {
						console.error('Autosave failed:', error);
					}
				}
			}
			timeoutId = null;
		}, delayMs);
	}

	/**
	 * Cancels any pending autosave
	 */
	function cancel(): void {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		lastGame = null;
	}

	/**
	 * Forces an immediate save, cancelling any pending autosave
	 * Useful when navigating away from the page
	 */
	async function flush(): Promise<void> {
		cancel();
		if (lastGame) {
			try {
				await saveGame(lastGame);
			} catch (error) {
				if (error instanceof PersistenceError && onError) {
					onError(error);
				} else {
					console.error('Autosave flush failed:', error);
				}
			}
		}
	}

	return {
		save,
		cancel,
		flush
	};
}
