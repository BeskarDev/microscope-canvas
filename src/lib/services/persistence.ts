/**
 * IndexedDB persistence layer for Microscope Canvas
 * Provides a thin abstraction over IndexedDB for game storage
 */

import type { Game, GameMetadata } from '$lib/types';
import { getGameMetadata } from '$lib/types';

const DB_NAME = 'microscope-canvas';
const DB_VERSION = 1;
const GAMES_STORE = 'games';

/**
 * Error types for persistence operations
 */
export class PersistenceError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'PersistenceError';
	}
}

export class DatabaseUnavailableError extends PersistenceError {
	constructor(cause?: unknown) {
		super(
			'IndexedDB is not available. Your browser may not support local storage or it may be disabled.',
			cause
		);
		this.name = 'DatabaseUnavailableError';
	}
}

export class GameNotFoundError extends PersistenceError {
	constructor(gameId: string) {
		super(`Game with ID "${gameId}" was not found.`);
		this.name = 'GameNotFoundError';
	}
}

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
	try {
		return typeof indexedDB !== 'undefined' && indexedDB !== null;
	} catch {
		return false;
	}
}

/**
 * Opens a connection to the database
 * Creates the database and object stores if they don't exist
 */
function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (!isIndexedDBAvailable()) {
			reject(new DatabaseUnavailableError());
			return;
		}

		try {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				reject(new PersistenceError('Failed to open database', request.error));
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create games object store if it doesn't exist
				if (!db.objectStoreNames.contains(GAMES_STORE)) {
					const store = db.createObjectStore(GAMES_STORE, { keyPath: 'id' });
					// Create indexes for efficient querying
					store.createIndex('name', 'name', { unique: false });
					store.createIndex('updatedAt', 'updatedAt', { unique: false });
				}
			};
		} catch (error) {
			reject(new DatabaseUnavailableError(error));
		}
	});
}

/**
 * Creates a new game and persists it to IndexedDB
 * @param game The game to create
 * @returns The created game
 */
export async function createGame(game: Game): Promise<Game> {
	const db = await openDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([GAMES_STORE], 'readwrite');
			const store = transaction.objectStore(GAMES_STORE);

			const request = store.add(game);

			request.onerror = () => {
				db.close();
				reject(new PersistenceError('Failed to create game', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve(game);
			};
		} catch (error) {
			db.close();
			reject(new PersistenceError('Failed to create game', error));
		}
	});
}

/**
 * Loads a game from IndexedDB by ID
 * @param id The game ID
 * @returns The game or null if not found
 */
export async function loadGame(id: string): Promise<Game | null> {
	const db = await openDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([GAMES_STORE], 'readonly');
			const store = transaction.objectStore(GAMES_STORE);

			const request = store.get(id);

			request.onerror = () => {
				db.close();
				reject(new PersistenceError('Failed to load game', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve(request.result ?? null);
			};
		} catch (error) {
			db.close();
			reject(new PersistenceError('Failed to load game', error));
		}
	});
}

/**
 * Saves a game to IndexedDB (updates existing or creates new)
 * @param game The game to save (should be a plain object with updatedAt already set)
 */
export async function saveGame(game: Game): Promise<void> {
	const db = await openDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([GAMES_STORE], 'readwrite');
			const store = transaction.objectStore(GAMES_STORE);

			const request = store.put(game);

			request.onerror = () => {
				db.close();
				reject(new PersistenceError('Failed to save game', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve();
			};
		} catch (error) {
			db.close();
			reject(new PersistenceError('Failed to save game', error));
		}
	});
}

/**
 * Deletes a game from IndexedDB
 * @param id The game ID to delete
 */
export async function deleteGame(id: string): Promise<void> {
	const db = await openDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([GAMES_STORE], 'readwrite');
			const store = transaction.objectStore(GAMES_STORE);

			const request = store.delete(id);

			request.onerror = () => {
				db.close();
				reject(new PersistenceError('Failed to delete game', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve();
			};
		} catch (error) {
			db.close();
			reject(new PersistenceError('Failed to delete game', error));
		}
	});
}

/**
 * Lists all games from IndexedDB
 * Returns metadata only (id, name, createdAt, updatedAt)
 * Sorted by most recently updated first
 */
export async function listGames(): Promise<GameMetadata[]> {
	const db = await openDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([GAMES_STORE], 'readonly');
			const store = transaction.objectStore(GAMES_STORE);

			const request = store.getAll();

			request.onerror = () => {
				db.close();
				reject(new PersistenceError('Failed to list games', request.error));
			};

			request.onsuccess = () => {
				db.close();
				const games = request.result as Game[];
				// Extract metadata and sort by most recently updated
				const metadata = games.map(getGameMetadata).sort((a, b) => {
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
				});
				resolve(metadata);
			};
		} catch (error) {
			db.close();
			reject(new PersistenceError('Failed to list games', error));
		}
	});
}

/**
 * Checks if a game exists in IndexedDB
 * Uses count query for efficiency (doesn't load full game data)
 * @param id The game ID to check
 * @returns true if the game exists
 */
export async function gameExists(id: string): Promise<boolean> {
	const db = await openDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([GAMES_STORE], 'readonly');
			const store = transaction.objectStore(GAMES_STORE);

			const request = store.count(IDBKeyRange.only(id));

			request.onerror = () => {
				db.close();
				reject(new PersistenceError('Failed to check if game exists', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve(request.result > 0);
			};
		} catch (error) {
			db.close();
			reject(new PersistenceError('Failed to check if game exists', error));
		}
	});
}
