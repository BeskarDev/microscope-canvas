/**
 * Game Actions
 * 
 * Contains all game state mutation functions (periods, events, scenes, anchors)
 * with undo/redo support. Uses Svelte 5 runes for reactive state management.
 */

/* eslint-disable svelte/prefer-svelte-reactivity */

import {
	createNewPeriod,
	createNewEvent,
	createNewScene,
	createNewAnchor,
	createAnchorPlacement,
	type Game,
	type Period,
	type Event as GameEvent,
	type Scene,
	type GameAction,
	type CreatePeriodAction,
	type DeletePeriodAction,
	type EditPeriodAction,
	type CreateEventAction,
	type DeleteEventAction,
	type EditEventAction,
	type CreateSceneAction,
	type DeleteSceneAction,
	type EditSceneAction,
	type EditGameMetadataAction,
	type ReorderPeriodsAction,
	type ReorderEventsAction,
	type ReorderScenesAction,
	type CreateAnchorAction,
	type DeleteAnchorAction,
	type EditAnchorAction,
	type SetCurrentAnchorAction,
	type ClearCurrentAnchorAction
} from '$lib/types';
import { deepClone } from '$lib/utils/deep-clone';
import { gameState } from './game-state.svelte';

// History state for undo/redo
export const historyState = $state({
	undoStack: [] as GameAction[],
	redoStack: [] as GameAction[]
});

// Functions to check undo/redo availability (cannot export $derived from module)
export function canUndo(): boolean {
	return historyState.undoStack.length > 0;
}

export function canRedo(): boolean {
	return historyState.redoStack.length > 0;
}

/**
 * Records an action to the history stack
 */
export function recordAction(action: GameAction) {
	historyState.undoStack = [...historyState.undoStack, action];
	historyState.redoStack = []; // Clear redo stack on new action
}

/**
 * Clears the history stacks
 */
export function clearHistory() {
	historyState.undoStack = [];
	historyState.redoStack = [];
}

// ============================================
// Period Actions
// ============================================

export function addPeriod(index: number) {
	const game = gameState.game;
	if (!game) return;
	
	const period = createNewPeriod('New Period');

	const action: CreatePeriodAction = {
		type: 'CREATE_PERIOD',
		timestamp: new Date().toISOString(),
		periodId: period.id,
		index,
		period: deepClone(period)
	};

	game.periods.splice(index, 0, period);
	recordAction(action);
}

export function deletePeriod(periodId: string) {
	const game = gameState.game;
	if (!game) return;

	const periodIndex = game.periods.findIndex((p) => p.id === periodId);
	const period = game.periods[periodIndex];
	if (!period || periodIndex < 0) return;

	const action: DeletePeriodAction = {
		type: 'DELETE_PERIOD',
		timestamp: new Date().toISOString(),
		periodId,
		index: periodIndex,
		period: deepClone(period)
	};

	game.periods = game.periods.filter((p) => p.id !== periodId);
	recordAction(action);
}

export function editPeriod(periodId: string, updates: Partial<Period>) {
	const game = gameState.game;
	if (!game) return;

	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return;

	const previousValues: Partial<Period> = {};
	const newValues: Partial<Period> = {};
	
	for (const key of Object.keys(updates) as (keyof Period)[]) {
		if (key in period && key in updates) {
			(previousValues as Record<string, unknown>)[key] = deepClone(period[key]);
			(newValues as Record<string, unknown>)[key] = updates[key];
		}
	}

	const action: EditPeriodAction = {
		type: 'EDIT_PERIOD',
		timestamp: new Date().toISOString(),
		periodId,
		previousValues,
		newValues
	};

	Object.assign(period, updates, { updatedAt: new Date().toISOString() });
	recordAction(action);
}

export function reorderPeriods(fromIndex: number, toIndex: number) {
	const game = gameState.game;
	if (!game || fromIndex === toIndex) return;

	const previousOrder = game.periods.map((p) => p.id);
	const newPeriods = [...game.periods];
	const [movedPeriod] = newPeriods.splice(fromIndex, 1);
	newPeriods.splice(toIndex, 0, movedPeriod);
	const newOrder = newPeriods.map((p) => p.id);

	const action: ReorderPeriodsAction = {
		type: 'REORDER_PERIODS',
		timestamp: new Date().toISOString(),
		previousOrder,
		newOrder
	};

	game.periods = newPeriods;
	recordAction(action);
}

// ============================================
// Event Actions
// ============================================

export function addEvent(periodId: string) {
	const game = gameState.game;
	if (!game) return;
	
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return;

	const event = createNewEvent('New Event');
	const index = period.events.length;

	const action: CreateEventAction = {
		type: 'CREATE_EVENT',
		timestamp: new Date().toISOString(),
		periodId,
		eventId: event.id,
		index,
		event: deepClone(event)
	};

	period.events.push(event);
	recordAction(action);
}

export function deleteEvent(periodId: string, eventId: string) {
	const game = gameState.game;
	if (!game) return;

	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return;

	const eventIndex = period.events.findIndex((e) => e.id === eventId);
	const event = period.events[eventIndex];
	if (!event || eventIndex < 0) return;

	const action: DeleteEventAction = {
		type: 'DELETE_EVENT',
		timestamp: new Date().toISOString(),
		periodId,
		eventId,
		index: eventIndex,
		event: deepClone(event)
	};

	period.events = period.events.filter((e) => e.id !== eventId);
	recordAction(action);
}

export function editEvent(periodId: string, eventId: string, updates: Partial<GameEvent>) {
	const game = gameState.game;
	if (!game) return;

	const period = game.periods.find((p) => p.id === periodId);
	const event = period?.events.find((e) => e.id === eventId);
	if (!event) return;

	const previousValues: Partial<GameEvent> = {};
	const newValues: Partial<GameEvent> = {};
	
	for (const key of Object.keys(updates) as (keyof GameEvent)[]) {
		if (key in event && key in updates) {
			(previousValues as Record<string, unknown>)[key] = deepClone(event[key]);
			(newValues as Record<string, unknown>)[key] = updates[key];
		}
	}

	const action: EditEventAction = {
		type: 'EDIT_EVENT',
		timestamp: new Date().toISOString(),
		periodId,
		eventId,
		previousValues,
		newValues
	};

	Object.assign(event, updates, { updatedAt: new Date().toISOString() });
	recordAction(action);
}

export function reorderEvents(periodId: string, fromIndex: number, toIndex: number) {
	const game = gameState.game;
	if (!game || fromIndex === toIndex) return;

	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return;

	const previousOrder = period.events.map((e) => e.id);
	const newEvents = [...period.events];
	const [movedEvent] = newEvents.splice(fromIndex, 1);
	newEvents.splice(toIndex, 0, movedEvent);
	const newOrder = newEvents.map((e) => e.id);

	const action: ReorderEventsAction = {
		type: 'REORDER_EVENTS',
		timestamp: new Date().toISOString(),
		periodId,
		previousOrder,
		newOrder
	};

	period.events = newEvents;
	recordAction(action);
}

// ============================================
// Scene Actions
// ============================================

export function addScene(periodId: string, eventId: string) {
	const game = gameState.game;
	if (!game) return;
	
	const period = game.periods.find((p) => p.id === periodId);
	const event = period?.events.find((e) => e.id === eventId);
	if (!event) return;

	const scene = createNewScene('New Scene');
	const index = event.scenes.length;

	const action: CreateSceneAction = {
		type: 'CREATE_SCENE',
		timestamp: new Date().toISOString(),
		periodId,
		eventId,
		sceneId: scene.id,
		index,
		scene: deepClone(scene)
	};

	event.scenes.push(scene);
	recordAction(action);
}

export function deleteScene(periodId: string, eventId: string, sceneId: string) {
	const game = gameState.game;
	if (!game) return;

	const period = game.periods.find((p) => p.id === periodId);
	const event = period?.events.find((e) => e.id === eventId);
	if (!event) return;

	const sceneIndex = event.scenes.findIndex((s) => s.id === sceneId);
	const scene = event.scenes[sceneIndex];
	if (!scene || sceneIndex < 0) return;

	const action: DeleteSceneAction = {
		type: 'DELETE_SCENE',
		timestamp: new Date().toISOString(),
		periodId,
		eventId,
		sceneId,
		index: sceneIndex,
		scene: deepClone(scene)
	};

	event.scenes = event.scenes.filter((s) => s.id !== sceneId);
	recordAction(action);
}

export function editScene(
	periodId: string,
	eventId: string,
	sceneId: string,
	updates: Partial<Scene>
) {
	const game = gameState.game;
	if (!game) return;

	const period = game.periods.find((p) => p.id === periodId);
	const event = period?.events.find((e) => e.id === eventId);
	const scene = event?.scenes.find((s) => s.id === sceneId);
	if (!scene) return;

	const previousValues: Partial<Scene> = {};
	const newValues: Partial<Scene> = {};
	
	for (const key of Object.keys(updates) as (keyof Scene)[]) {
		if (key in scene && key in updates) {
			(previousValues as Record<string, unknown>)[key] = deepClone(scene[key]);
			(newValues as Record<string, unknown>)[key] = updates[key];
		}
	}

	const action: EditSceneAction = {
		type: 'EDIT_SCENE',
		timestamp: new Date().toISOString(),
		periodId,
		eventId,
		sceneId,
		previousValues,
		newValues
	};

	Object.assign(scene, updates, { updatedAt: new Date().toISOString() });
	recordAction(action);
}

export function reorderScenes(
	periodId: string,
	eventId: string,
	fromIndex: number,
	toIndex: number
) {
	const game = gameState.game;
	if (!game || fromIndex === toIndex) return;

	const period = game.periods.find((p) => p.id === periodId);
	const event = period?.events.find((e) => e.id === eventId);
	if (!event) return;

	const previousOrder = event.scenes.map((s) => s.id);
	const newScenes = [...event.scenes];
	const [movedScene] = newScenes.splice(fromIndex, 1);
	newScenes.splice(toIndex, 0, movedScene);
	const newOrder = newScenes.map((s) => s.id);

	const action: ReorderScenesAction = {
		type: 'REORDER_SCENES',
		timestamp: new Date().toISOString(),
		periodId,
		eventId,
		previousOrder,
		newOrder
	};

	event.scenes = newScenes;
	recordAction(action);
}

// ============================================
// Game Metadata Actions
// ============================================

export function editGameMetadata(updates: Partial<Game>) {
	const game = gameState.game;
	if (!game) return;

	const previousValues: EditGameMetadataAction['previousValues'] = {};
	const newValues: EditGameMetadataAction['newValues'] = {};

	if (updates.name !== undefined) {
		previousValues.name = game.name;
		newValues.name = updates.name;
	}
	if (updates.focus !== undefined) {
		previousValues.focus = game.focus ? deepClone(game.focus) : undefined;
		newValues.focus = updates.focus;
	}
	if (updates.bigPicture !== undefined) {
		previousValues.bigPicture = game.bigPicture ? deepClone(game.bigPicture) : undefined;
		newValues.bigPicture = updates.bigPicture;
	}
	if (updates.palette !== undefined) {
		previousValues.palette = game.palette ? deepClone(game.palette) : undefined;
		newValues.palette = updates.palette;
	}
	if (updates.legacies !== undefined) {
		previousValues.legacies = deepClone(game.legacies);
		newValues.legacies = updates.legacies;
	}
	if (updates.players !== undefined) {
		previousValues.players = deepClone(game.players);
		newValues.players = updates.players;
	}
	if (updates.activePlayerIndex !== undefined) {
		previousValues.activePlayerIndex = game.activePlayerIndex;
		newValues.activePlayerIndex = updates.activePlayerIndex;
	}
	if (updates.focuses !== undefined) {
		previousValues.focuses = deepClone(game.focuses);
		newValues.focuses = updates.focuses;
	}
	if (updates.currentFocusIndex !== undefined) {
		previousValues.currentFocusIndex = game.currentFocusIndex;
		newValues.currentFocusIndex = updates.currentFocusIndex;
	}

	const action: EditGameMetadataAction = {
		type: 'EDIT_GAME_METADATA',
		timestamp: new Date().toISOString(),
		previousValues,
		newValues
	};

	Object.assign(game, updates);
	recordAction(action);
}

// ============================================
// Anchor Actions
// ============================================

function ensureAnchorsInitialized() {
	const game = gameState.game;
	if (!game) return;
	if (!game.anchors) game.anchors = [];
	if (!game.anchorPlacements) game.anchorPlacements = [];
	if (game.currentAnchorId === undefined) game.currentAnchorId = null;
}

export function createAnchor(name: string, description?: string) {
	const game = gameState.game;
	if (!game) return;
	ensureAnchorsInitialized();

	const anchor = createNewAnchor(name, description);
	const index = game.anchors!.length;

	const action: CreateAnchorAction = {
		type: 'CREATE_ANCHOR',
		timestamp: new Date().toISOString(),
		anchor: deepClone(anchor),
		index
	};

	game.anchors!.push(anchor);
	recordAction(action);
}

export function editAnchor(anchorId: string, name: string, description?: string) {
	const game = gameState.game;
	if (!game) return;
	ensureAnchorsInitialized();
	if (!game.anchors?.length) return;

	const anchor = game.anchors.find((a) => a.id === anchorId);
	if (!anchor) return;

	const previousValues = { name: anchor.name, description: anchor.description };
	const newValues = { name, description };

	const action: EditAnchorAction = {
		type: 'EDIT_ANCHOR',
		timestamp: new Date().toISOString(),
		anchorId,
		previousValues,
		newValues
	};

	anchor.name = name;
	anchor.description = description;
	anchor.updatedAt = new Date().toISOString();
	recordAction(action);
}

export function deleteAnchor(anchorId: string): boolean {
	const game = gameState.game;
	if (!game) return false;
	ensureAnchorsInitialized();
	if (!game.anchors?.length) return false;

	const index = game.anchors.findIndex((a) => a.id === anchorId);
	if (index === -1) return false;

	const anchor = game.anchors[index];
	const associatedPlacements = game.anchorPlacements!.filter((p) => p.anchorId === anchorId);
	const wasCurrentAnchor = game.currentAnchorId === anchorId;

	const action: DeleteAnchorAction = {
		type: 'DELETE_ANCHOR',
		timestamp: new Date().toISOString(),
		anchorId,
		index,
		anchor: deepClone(anchor),
		associatedPlacements: deepClone(associatedPlacements),
		wasCurrentAnchor
	};

	game.anchors = game.anchors.filter((a) => a.id !== anchorId);
	game.anchorPlacements = game.anchorPlacements!.filter((p) => p.anchorId !== anchorId);
	if (wasCurrentAnchor) {
		game.currentAnchorId = null;
	}
	recordAction(action);
	return true;
}

export function setCurrentAnchor(anchorId: string, periodId: string): { success: boolean; message?: string } {
	const game = gameState.game;
	if (!game) return { success: false };
	ensureAnchorsInitialized();

	// Check if this anchor is already placed on this period
	const existingPlacement = game.anchorPlacements!.find(
		(p) => p.anchorId === anchorId && p.periodId === periodId
	);
	
	if (existingPlacement) {
		if (game.currentAnchorId !== anchorId) {
			const previousAnchorId = game.currentAnchorId;
			const action: SetCurrentAnchorAction = {
				type: 'SET_CURRENT_ANCHOR',
				timestamp: new Date().toISOString(),
				anchorId,
				periodId,
				placement: deepClone(existingPlacement),
				previousAnchorId,
				removedPlacements: []
			};
			game.currentAnchorId = anchorId;
			recordAction(action);
			
			const anchor = game.anchors?.find((a) => a.id === anchorId);
			return { success: true, message: `Set "${anchor?.name}" as active anchor` };
		}
		return { success: false, message: 'This anchor is already placed on this period' };
	}

	// Remove any existing placements for this anchor (1-to-1 relationship)
	const removedPlacements = game.anchorPlacements!.filter((p) => p.anchorId === anchorId);
	game.anchorPlacements = game.anchorPlacements!.filter((p) => p.anchorId !== anchorId);

	const placement = createAnchorPlacement(anchorId, periodId);
	const previousAnchorId = game.currentAnchorId;

	const action: SetCurrentAnchorAction = {
		type: 'SET_CURRENT_ANCHOR',
		timestamp: new Date().toISOString(),
		anchorId,
		periodId,
		placement: deepClone(placement),
		previousAnchorId,
		removedPlacements: deepClone(removedPlacements)
	};

	game.currentAnchorId = anchorId;
	game.anchorPlacements!.push(placement);
	recordAction(action);

	const anchor = game.anchors?.find((a) => a.id === anchorId);
	const period = game.periods.find((p) => p.id === periodId);
	return { 
		success: true, 
		message: `Set "${anchor?.name}" as active anchor on "${period?.name}"` 
	};
}

export function clearCurrentAnchor(): boolean {
	const game = gameState.game;
	if (!game) return false;

	const previousAnchorId = game.currentAnchorId;
	if (!previousAnchorId) return false;

	const action: ClearCurrentAnchorAction = {
		type: 'CLEAR_CURRENT_ANCHOR',
		timestamp: new Date().toISOString(),
		previousAnchorId
	};

	game.currentAnchorId = null;
	recordAction(action);
	return true;
}
