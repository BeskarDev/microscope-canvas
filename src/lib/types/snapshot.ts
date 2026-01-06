/**
 * Snapshot types for version history
 * These types define the structure of game snapshots for history & versioning
 */

import type { Game } from './game';
import { deepClone } from '$lib/utils/deep-clone';

/**
 * A snapshot of the game state at a specific point in time
 */
export interface GameSnapshot {
	id: string;
	gameId: string;
	timestamp: string; // ISO 8601 timestamp
	data: Game; // Full game state at the time of snapshot
	/** User-provided name for the version (optional) */
	versionName?: string;
	/** Summary of changes since last version */
	changeSummary?: string;
}

/**
 * Metadata for a snapshot (used in history list)
 */
export interface SnapshotMetadata {
	id: string;
	gameId: string;
	timestamp: string;
	gameName: string;
	/** User-provided name for the version (optional) */
	versionName?: string;
	/** Summary of changes since last version */
	changeSummary?: string;
}

/**
 * Default maximum number of snapshots per game
 */
export const DEFAULT_SNAPSHOT_LIMIT = 50;

/**
 * Creates a new snapshot from a game state
 */
export function createSnapshot(
	game: Game,
	versionName?: string,
	changeSummary?: string
): GameSnapshot {
	return {
		id: crypto.randomUUID(),
		gameId: game.id,
		timestamp: new Date().toISOString(),
		data: deepClone(game),
		versionName,
		changeSummary
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
		gameName: snapshot.data.name,
		versionName: snapshot.versionName,
		changeSummary: snapshot.changeSummary
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

/**
 * Generates a summary of changes between two game states
 * Uses Map objects for O(n) lookups instead of O(n²) nested loops
 */
export function generateChangeSummary(oldGame: Game | null, newGame: Game): string {
	if (!oldGame) {
		return 'Initial version';
	}

	const changes: string[] = [];

	// Check name change
	if (oldGame.name !== newGame.name) {
		changes.push(`Renamed game to "${newGame.name}"`);
	}

	// Check focus change
	if (oldGame.focus?.name !== newGame.focus?.name) {
		if (newGame.focus) {
			changes.push(`Focus: ${newGame.focus.name}`);
		} else {
			changes.push('Removed focus');
		}
	}

	// Build Maps for O(1) lookups
	const oldPeriodMap = new Map(oldGame.periods.map((p) => [p.id, p]));
	const newPeriodMap = new Map(newGame.periods.map((p) => [p.id, p]));

	// Check periods
	const addedPeriods = newGame.periods.filter((p) => !oldPeriodMap.has(p.id));
	const removedPeriods = oldGame.periods.filter((p) => !newPeriodMap.has(p.id));

	if (addedPeriods.length > 0) {
		changes.push(
			`Added ${addedPeriods.length} period${addedPeriods.length > 1 ? 's' : ''}: ${addedPeriods.map((p) => p.name).join(', ')}`
		);
	}
	if (removedPeriods.length > 0) {
		changes.push(`Removed ${removedPeriods.length} period${removedPeriods.length > 1 ? 's' : ''}`);
	}

	// Check events and scenes (count total changes)
	let addedEvents = 0;
	let removedEvents = 0;
	let addedScenes = 0;
	let removedScenes = 0;

	for (const newPeriod of newGame.periods) {
		const oldPeriod = oldPeriodMap.get(newPeriod.id);
		if (!oldPeriod) continue;

		// Build event maps for this period
		const oldEventMap = new Map(oldPeriod.events.map((e) => [e.id, e]));
		const newEventMap = new Map(newPeriod.events.map((e) => [e.id, e]));

		addedEvents += newPeriod.events.filter((e) => !oldEventMap.has(e.id)).length;
		removedEvents += oldPeriod.events.filter((e) => !newEventMap.has(e.id)).length;

		for (const newEvent of newPeriod.events) {
			const oldEvent = oldEventMap.get(newEvent.id);
			if (!oldEvent) continue;

			// Build scene sets for this event
			const oldSceneIds = new Set(oldEvent.scenes.map((s) => s.id));
			const newSceneIds = new Set(newEvent.scenes.map((s) => s.id));

			addedScenes += newEvent.scenes.filter((s) => !oldSceneIds.has(s.id)).length;
			removedScenes += oldEvent.scenes.filter((s) => !newSceneIds.has(s.id)).length;
		}
	}

	if (addedEvents > 0) {
		changes.push(`Added ${addedEvents} event${addedEvents > 1 ? 's' : ''}`);
	}
	if (removedEvents > 0) {
		changes.push(`Removed ${removedEvents} event${removedEvents > 1 ? 's' : ''}`);
	}
	if (addedScenes > 0) {
		changes.push(`Added ${addedScenes} scene${addedScenes > 1 ? 's' : ''}`);
	}
	if (removedScenes > 0) {
		changes.push(`Removed ${removedScenes} scene${removedScenes > 1 ? 's' : ''}`);
	}

	// If no specific changes detected, indicate general edits
	if (changes.length === 0) {
		return 'Various edits';
	}

	return changes.slice(0, 3).join('; ') + (changes.length > 3 ? '...' : '');
}
