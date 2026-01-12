/**
 * Game State
 * 
 * Manages the core game data and loading states using Svelte 5 runes.
 * This reactive state can be imported and used directly in components.
 */

import type { Game, SnapshotMetadata } from '$lib/types';

// Core game state - deeply reactive proxy
export const gameState = $state({
	game: null as Game | null,
	isLoading: true,
	loadError: null as string | null,
	lastPublishedGame: null as Game | null
});

// Snapshot/history view state
export const snapshotState = $state({
	isViewingHistory: false,
	historicalGame: null as Game | null,
	currentSnapshotId: null as string | null,
	snapshots: [] as SnapshotMetadata[],
	snapshotsLoading: false,
	snapshotsError: null as string | null
});

// Publishing state
export const publishState = $state({
	isPublishing: false,
	publishModalOpen: false
});

// Game state mutations
export function setGame(game: Game | null) {
	gameState.game = game;
}

export function setLoading(loading: boolean) {
	gameState.isLoading = loading;
}

export function setLoadError(error: string | null) {
	gameState.loadError = error;
}

export function setLastPublishedGame(game: Game | null) {
	gameState.lastPublishedGame = game;
}

// Snapshot state mutations
export function setViewingHistory(viewing: boolean) {
	snapshotState.isViewingHistory = viewing;
}

export function setHistoricalGame(game: Game | null) {
	snapshotState.historicalGame = game;
}

export function setCurrentSnapshotId(id: string | null) {
	snapshotState.currentSnapshotId = id;
}

export function setSnapshots(snapshots: SnapshotMetadata[]) {
	snapshotState.snapshots = snapshots;
}

export function setSnapshotsLoading(loading: boolean) {
	snapshotState.snapshotsLoading = loading;
}

export function setSnapshotsError(error: string | null) {
	snapshotState.snapshotsError = error;
}

export function exitHistoryView() {
	snapshotState.isViewingHistory = false;
	snapshotState.historicalGame = null;
	snapshotState.currentSnapshotId = null;
}

// Publishing state mutations
export function setPublishing(publishing: boolean) {
	publishState.isPublishing = publishing;
}

export function setPublishModalOpen(open: boolean) {
	publishState.publishModalOpen = open;
}

// Reset all state (useful when navigating away)
export function resetGameState() {
	gameState.game = null;
	gameState.isLoading = true;
	gameState.loadError = null;
	gameState.lastPublishedGame = null;
	
	snapshotState.isViewingHistory = false;
	snapshotState.historicalGame = null;
	snapshotState.currentSnapshotId = null;
	snapshotState.snapshots = [];
	snapshotState.snapshotsLoading = false;
	snapshotState.snapshotsError = null;
	
	publishState.isPublishing = false;
	publishState.publishModalOpen = false;
}
