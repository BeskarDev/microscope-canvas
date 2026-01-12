/**
 * UI State
 * 
 * Manages UI-related state like modals, sheets, zoom, and canvas controls
 * using Svelte 5 runes. This reactive state can be imported directly.
 */

import type { Period, Event as GameEvent, Scene } from '$lib/types';

// Zoom constants
export const ZOOM_LEVELS = [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25];
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;

// Zoom and canvas state
export const canvasState = $state({
	zoom: 1,
	cardReorderEnabled: false,
	cardReorderToggledBySpace: false
});

// Modal/sheet open states
export const modalState = $state({
	editModalOpen: false,
	settingsModalOpen: false,
	deleteModalOpen: false,
	historyModalOpen: false,
	paletteSheetOpen: false,
	playersSheetOpen: false,
	focusesSheetOpen: false,
	legaciesSheetOpen: false,
	anchorsSheetOpen: false
});

// Edit modal context
export const editState = $state({
	itemType: 'period' as 'period' | 'event' | 'scene',
	item: null as Period | GameEvent | Scene | null,
	context: {} as { periodId?: string; eventId?: string }
});

// Delete confirmation context
export const deleteState = $state({
	itemType: 'period' as 'period' | 'event' | 'scene',
	itemName: '',
	hasChildren: false
});

// Anchors sheet context
export const anchorsState = $state({
	selectedAnchorId: null as string | null
});

// Zoom mutations
export function setZoom(zoom: number) {
	// Clamp zoom to valid bounds
	canvasState.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function zoomIn() {
	const currentIndex = ZOOM_LEVELS.indexOf(canvasState.zoom);
	if (currentIndex > 0) {
		canvasState.zoom = ZOOM_LEVELS[currentIndex - 1];
	} else if (currentIndex === -1) {
		// If current zoom isn't in levels, find nearest level that's higher
		const higherLevel = ZOOM_LEVELS.find(level => level > canvasState.zoom);
		if (higherLevel !== undefined) {
			canvasState.zoom = higherLevel;
		}
	}
}

export function zoomOut() {
	const currentIndex = ZOOM_LEVELS.indexOf(canvasState.zoom);
	if (currentIndex >= 0 && currentIndex < ZOOM_LEVELS.length - 1) {
		canvasState.zoom = ZOOM_LEVELS[currentIndex + 1];
	} else if (currentIndex === -1) {
		// If current zoom isn't in levels, find nearest level that's lower
		const lowerLevel = [...ZOOM_LEVELS].reverse().find(level => level < canvasState.zoom);
		if (lowerLevel !== undefined) {
			canvasState.zoom = lowerLevel;
		}
	}
}

export function resetZoom() {
	canvasState.zoom = 1;
}

// Card reorder mutations
export function toggleCardReorder() {
	canvasState.cardReorderEnabled = !canvasState.cardReorderEnabled;
}

export function setCardReorderEnabled(enabled: boolean) {
	canvasState.cardReorderEnabled = enabled;
}

export function setCardReorderToggledBySpace(toggled: boolean) {
	canvasState.cardReorderToggledBySpace = toggled;
}

// Modal mutations
export function openEditModal(
	itemType: 'period' | 'event' | 'scene',
	item: Period | GameEvent | Scene,
	context: { periodId?: string; eventId?: string } = {}
) {
	editState.itemType = itemType;
	editState.item = item;
	editState.context = context;
	modalState.editModalOpen = true;
}

export function closeEditModal() {
	modalState.editModalOpen = false;
}

export function setEditModalOpen(open: boolean) {
	modalState.editModalOpen = open;
}

export function setSettingsModalOpen(open: boolean) {
	modalState.settingsModalOpen = open;
}

export function openDeleteModal(
	itemType: 'period' | 'event' | 'scene',
	itemName: string,
	hasChildren: boolean
) {
	deleteState.itemType = itemType;
	deleteState.itemName = itemName;
	deleteState.hasChildren = hasChildren;
	modalState.deleteModalOpen = true;
}

export function closeDeleteModal() {
	modalState.deleteModalOpen = false;
}

export function setDeleteModalOpen(open: boolean) {
	modalState.deleteModalOpen = open;
}

export function setHistoryModalOpen(open: boolean) {
	modalState.historyModalOpen = open;
}

// Sheet mutations
export function setPaletteSheetOpen(open: boolean) {
	modalState.paletteSheetOpen = open;
}

export function setPlayersSheetOpen(open: boolean) {
	modalState.playersSheetOpen = open;
}

export function setFocusesSheetOpen(open: boolean) {
	modalState.focusesSheetOpen = open;
}

export function setLegaciesSheetOpen(open: boolean) {
	modalState.legaciesSheetOpen = open;
}

export function setAnchorsSheetOpen(open: boolean) {
	modalState.anchorsSheetOpen = open;
	if (!open) {
		anchorsState.selectedAnchorId = null;
	}
}

export function openAnchorsSheet(selectedAnchorId: string | null = null) {
	anchorsState.selectedAnchorId = selectedAnchorId;
	modalState.anchorsSheetOpen = true;
}

// Reset UI state
export function resetUIState() {
	canvasState.zoom = 1;
	canvasState.cardReorderEnabled = false;
	canvasState.cardReorderToggledBySpace = false;
	
	modalState.editModalOpen = false;
	modalState.settingsModalOpen = false;
	modalState.deleteModalOpen = false;
	modalState.historyModalOpen = false;
	modalState.paletteSheetOpen = false;
	modalState.playersSheetOpen = false;
	modalState.focusesSheetOpen = false;
	modalState.legaciesSheetOpen = false;
	modalState.anchorsSheetOpen = false;
	
	editState.itemType = 'period';
	editState.item = null;
	editState.context = {};
	
	deleteState.itemType = 'period';
	deleteState.itemName = '';
	deleteState.hasChildren = false;
	
	anchorsState.selectedAnchorId = null;
}
