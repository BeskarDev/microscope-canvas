/**
 * Snapshot persistence layer for version history
 * Provides IndexedDB storage for game snapshots
 */

import { browser } from '$app/environment';
import type { GameSnapshot, SnapshotMetadata } from '$lib/types';
import { getSnapshotMetadata, DEFAULT_SNAPSHOT_LIMIT } from '$lib/types';

const DB_NAME = 'microscope-canvas-snapshots';
const DB_VERSION = 1;
const SNAPSHOTS_STORE = 'snapshots';

/**
 * Error types for snapshot operations
 */
export class SnapshotPersistenceError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'SnapshotPersistenceError';
	}
}

export class SnapshotDatabaseUnavailableError extends SnapshotPersistenceError {
	constructor(cause?: unknown) {
		super(
			'IndexedDB is not available for snapshots. Your browser may not support local storage or it may be disabled.',
			cause
		);
		this.name = 'SnapshotDatabaseUnavailableError';
	}
}

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
	if (!browser) {
		return false;
	}
	try {
		return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
	} catch {
		return false;
	}
}

/**
 * Opens a connection to the snapshots database
 */
function openSnapshotDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (!isIndexedDBAvailable()) {
			reject(new SnapshotDatabaseUnavailableError());
			return;
		}

		try {
			const request = window.indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				reject(new SnapshotPersistenceError('Failed to open snapshot database', request.error));
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create snapshots object store if it doesn't exist
				if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
					const store = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
					// Create indexes for efficient querying
					store.createIndex('gameId', 'gameId', { unique: false });
					store.createIndex('timestamp', 'timestamp', { unique: false });
					store.createIndex('gameId_timestamp', ['gameId', 'timestamp'], { unique: false });
				}
			};
		} catch (error) {
			reject(new SnapshotDatabaseUnavailableError(error));
		}
	});
}

/**
 * Creates a new snapshot in IndexedDB
 * @param snapshot The snapshot to create
 */
export async function createSnapshotRecord(snapshot: GameSnapshot): Promise<GameSnapshot> {
	const db = await openSnapshotDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([SNAPSHOTS_STORE], 'readwrite');
			const store = transaction.objectStore(SNAPSHOTS_STORE);

			const request = store.add(snapshot);

			request.onerror = () => {
				db.close();
				reject(new SnapshotPersistenceError('Failed to create snapshot', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve(snapshot);
			};
		} catch (error) {
			db.close();
			reject(new SnapshotPersistenceError('Failed to create snapshot', error));
		}
	});
}

/**
 * Loads a snapshot from IndexedDB by ID
 * @param id The snapshot ID
 */
export async function loadSnapshot(id: string): Promise<GameSnapshot | null> {
	const db = await openSnapshotDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([SNAPSHOTS_STORE], 'readonly');
			const store = transaction.objectStore(SNAPSHOTS_STORE);

			const request = store.get(id);

			request.onerror = () => {
				db.close();
				reject(new SnapshotPersistenceError('Failed to load snapshot', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve(request.result ?? null);
			};
		} catch (error) {
			db.close();
			reject(new SnapshotPersistenceError('Failed to load snapshot', error));
		}
	});
}

/**
 * Lists all snapshots for a game, sorted newest-first
 * @param gameId The game ID
 */
export async function listSnapshotsForGame(gameId: string): Promise<SnapshotMetadata[]> {
	const db = await openSnapshotDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([SNAPSHOTS_STORE], 'readonly');
			const store = transaction.objectStore(SNAPSHOTS_STORE);
			const index = store.index('gameId');

			const request = index.getAll(gameId);

			request.onerror = () => {
				db.close();
				reject(new SnapshotPersistenceError('Failed to list snapshots', request.error));
			};

			request.onsuccess = () => {
				db.close();
				const snapshots = request.result as GameSnapshot[];
				// Extract metadata and sort by timestamp (newest first)
				const metadata = snapshots.map(getSnapshotMetadata).sort((a, b) => {
					return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
				});
				resolve(metadata);
			};
		} catch (error) {
			db.close();
			reject(new SnapshotPersistenceError('Failed to list snapshots', error));
		}
	});
}

/**
 * Loads all full snapshots for a game, sorted newest-first
 * @param gameId The game ID
 */
export async function loadAllSnapshotsForGame(gameId: string): Promise<GameSnapshot[]> {
	const db = await openSnapshotDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([SNAPSHOTS_STORE], 'readonly');
			const store = transaction.objectStore(SNAPSHOTS_STORE);
			const index = store.index('gameId');

			const request = index.getAll(gameId);

			request.onerror = () => {
				db.close();
				reject(new SnapshotPersistenceError('Failed to load snapshots', request.error));
			};

			request.onsuccess = () => {
				db.close();
				const snapshots = request.result as GameSnapshot[];
				// Sort by timestamp (newest first)
				snapshots.sort((a, b) => {
					return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
				});
				resolve(snapshots);
			};
		} catch (error) {
			db.close();
			reject(new SnapshotPersistenceError('Failed to load snapshots', error));
		}
	});
}

/**
 * Deletes a snapshot from IndexedDB
 * @param id The snapshot ID to delete
 */
export async function deleteSnapshotRecord(id: string): Promise<void> {
	const db = await openSnapshotDatabase();

	return new Promise((resolve, reject) => {
		try {
			const transaction = db.transaction([SNAPSHOTS_STORE], 'readwrite');
			const store = transaction.objectStore(SNAPSHOTS_STORE);

			const request = store.delete(id);

			request.onerror = () => {
				db.close();
				reject(new SnapshotPersistenceError('Failed to delete snapshot', request.error));
			};

			request.onsuccess = () => {
				db.close();
				resolve();
			};
		} catch (error) {
			db.close();
			reject(new SnapshotPersistenceError('Failed to delete snapshot', error));
		}
	});
}

/**
 * Deletes all snapshots for a game
 * @param gameId The game ID
 */
export async function deleteAllSnapshotsForGame(gameId: string): Promise<void> {
	const snapshots = await listSnapshotsForGame(gameId);
	for (const snapshot of snapshots) {
		await deleteSnapshotRecord(snapshot.id);
	}
}

/**
 * Enforces the snapshot limit for a game by deleting oldest snapshots
 * @param gameId The game ID
 * @param limit Maximum number of snapshots to keep
 */
export async function enforceSnapshotLimit(
	gameId: string,
	limit: number = DEFAULT_SNAPSHOT_LIMIT
): Promise<void> {
	const snapshots = await listSnapshotsForGame(gameId);

	if (snapshots.length > limit) {
		// Delete oldest snapshots (they're sorted newest-first)
		const toDelete = snapshots.slice(limit);
		for (const snapshot of toDelete) {
			await deleteSnapshotRecord(snapshot.id);
		}
	}
}

/**
 * Gets the count of snapshots for a game
 * @param gameId The game ID
 */
export async function getSnapshotCount(gameId: string): Promise<number> {
	const snapshots = await listSnapshotsForGame(gameId);
	return snapshots.length;
}

/**
 * Gets the most recent snapshot for a game
 * @param gameId The game ID
 */
export async function getLatestSnapshot(gameId: string): Promise<GameSnapshot | null> {
	const snapshots = await listSnapshotsForGame(gameId);
	if (snapshots.length === 0) {
		return null;
	}
	return loadSnapshot(snapshots[0].id);
}
