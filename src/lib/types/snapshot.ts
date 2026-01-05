/**
 * Snapshot types for version history
 * These types define the structure of game snapshots for history & versioning
 */

import type { Game } from './game';

/**
 * A snapshot of the game state at a specific point in time
 */
export interface GameSnapshot {
	id: string;
	gameId: string;
	timestamp: string; // ISO 8601 timestamp
	data: Game; // Full game state at the time of snapshot
}

/**
 * Metadata for a snapshot (used in history list)
 */
export interface SnapshotMetadata {
	id: string;
	gameId: string;
	timestamp: string;
	gameName: string;
}

/**
 * Default maximum number of snapshots per game
 */
export const DEFAULT_SNAPSHOT_LIMIT = 50;

/**
 * Creates a new snapshot from a game state
 */
export function createSnapshot(game: Game): GameSnapshot {
	return {
		id: crypto.randomUUID(),
		gameId: game.id,
		timestamp: new Date().toISOString(),
		data: JSON.parse(JSON.stringify(game)) // Deep clone
	};
}

/**
 * Extracts metadata from a snapshot
 */
export function getSnapshotMetadata(snapshot: GameSnapshot): SnapshotMetadata {
	return {
		id: snapshot.id,
		gameId: snapshot.gameId,
		timestamp: snapshot.timestamp,
		gameName: snapshot.data.name
	};
}

/**
 * Checks if two game states are deeply equal (for duplicate detection)
 */
export function areGamesEqual(game1: Game, game2: Game): boolean {
	// Compare JSON strings for deep equality
	// Exclude timestamps from comparison
	const normalize = (game: Game) => ({
		...game,
		createdAt: '',
		updatedAt: ''
	});

	return JSON.stringify(normalize(game1)) === JSON.stringify(normalize(game2));
}
