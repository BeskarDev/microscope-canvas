/**
 * Game actions service
 * Handles all CRUD operations for game entities (periods, events, scenes)
 * Provides a clean interface for components to modify game state
 */

import type {
	Game,
	Period,
	Event as GameEvent,
	Scene,
	GameAction,
	CreatePeriodAction,
	DeletePeriodAction,
	EditPeriodAction,
	CreateEventAction,
	DeleteEventAction,
	EditEventAction,
	CreateSceneAction,
	DeleteSceneAction,
	EditSceneAction,
	EditGameMetadataAction,
	ReorderPeriodsAction,
	ReorderEventsAction,
	ReorderScenesAction,
	CreateAnchorAction,
	DeleteAnchorAction,
	EditAnchorAction,
	SetCurrentAnchorAction,
	ClearCurrentAnchorAction,
	Player,
	Focus,
	Legacy,
	Palette
} from '$lib/types';
import {
	createNewPeriod,
	createNewEvent,
	createNewScene,
	createNewAnchor,
	createAnchorPlacement
} from '$lib/types';
import { deepClone } from '$lib/utils/deep-clone';

/**
 * Result of a game action, containing the action for undo/redo
 */
export interface GameActionResult {
	action: GameAction;
}

/**
 * Creates a new period and returns the action for history tracking
 */
export function addPeriod(game: Game, index: number): GameActionResult {
	const period = createNewPeriod('New Period');

	const action: CreatePeriodAction = {
		type: 'CREATE_PERIOD',
		timestamp: new Date().toISOString(),
		periodId: period.id,
		index,
		period: deepClone(period)
	};

	game.periods.splice(index, 0, period);

	return { action };
}

/**
 * Adds a new event to a period
 */
export function addEvent(game: Game, periodId: string): GameActionResult | null {
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

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

	return { action };
}

/**
 * Adds a new scene to an event
 */
export function addScene(
	game: Game,
	periodId: string,
	eventId: string
): GameActionResult | null {
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

	const event = period.events.find((e) => e.id === eventId);
	if (!event) return null;

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

	return { action };
}

/**
 * Deletes a period from the game
 */
export function deletePeriod(game: Game, periodId: string): GameActionResult | null {
	const periodIndex = game.periods.findIndex((p) => p.id === periodId);
	if (periodIndex < 0) return null;

	const period = game.periods[periodIndex];

	const action: DeletePeriodAction = {
		type: 'DELETE_PERIOD',
		timestamp: new Date().toISOString(),
		periodId,
		index: periodIndex,
		period: deepClone(period)
	};

	game.periods = game.periods.filter((p) => p.id !== periodId);

	return { action };
}

/**
 * Deletes an event from a period
 */
export function deleteEvent(
	game: Game,
	periodId: string,
	eventId: string
): GameActionResult | null {
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

	const eventIndex = period.events.findIndex((e) => e.id === eventId);
	if (eventIndex < 0) return null;

	const event = period.events[eventIndex];

	const action: DeleteEventAction = {
		type: 'DELETE_EVENT',
		timestamp: new Date().toISOString(),
		periodId,
		eventId,
		index: eventIndex,
		event: deepClone(event)
	};

	period.events = period.events.filter((e) => e.id !== eventId);

	return { action };
}

/**
 * Deletes a scene from an event
 */
export function deleteScene(
	game: Game,
	periodId: string,
	eventId: string,
	sceneId: string
): GameActionResult | null {
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

	const event = period.events.find((e) => e.id === eventId);
	if (!event) return null;

	const sceneIndex = event.scenes.findIndex((s) => s.id === sceneId);
	if (sceneIndex < 0) return null;

	const scene = event.scenes[sceneIndex];

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

	return { action };
}

/**
 * Edits a period's properties
 */
export function editPeriod(
	game: Game,
	periodId: string,
	updates: Partial<Period>
): GameActionResult | null {
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

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

	return { action };
}

/**
 * Edits an event's properties
 */
export function editEvent(
	game: Game,
	periodId: string,
	eventId: string,
	updates: Partial<GameEvent>
): GameActionResult | null {
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

	const event = period.events.find((e) => e.id === eventId);
	if (!event) return null;

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

	return { action };
}

/**
 * Edits a scene's properties
 */
export function editScene(
	game: Game,
	periodId: string,
	eventId: string,
	sceneId: string,
	updates: Partial<Scene>
): GameActionResult | null {
	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

	const event = period.events.find((e) => e.id === eventId);
	if (!event) return null;

	const scene = event.scenes.find((s) => s.id === sceneId);
	if (!scene) return null;

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

	return { action };
}

/**
 * Reorders periods in the game
 */
export function reorderPeriods(
	game: Game,
	fromIndex: number,
	toIndex: number
): GameActionResult | null {
	if (fromIndex === toIndex) return null;

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

	return { action };
}

/**
 * Reorders events within a period
 */
export function reorderEvents(
	game: Game,
	periodId: string,
	fromIndex: number,
	toIndex: number
): GameActionResult | null {
	if (fromIndex === toIndex) return null;

	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

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

	return { action };
}

/**
 * Reorders scenes within an event
 */
export function reorderScenes(
	game: Game,
	periodId: string,
	eventId: string,
	fromIndex: number,
	toIndex: number
): GameActionResult | null {
	if (fromIndex === toIndex) return null;

	const period = game.periods.find((p) => p.id === periodId);
	if (!period) return null;

	const event = period.events.find((e) => e.id === eventId);
	if (!event) return null;

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

	return { action };
}

/**
 * Updates for game metadata (name, focus, palette, etc.)
 */
export interface GameMetadataUpdates {
	name?: string;
	focus?: Focus;
	focuses?: Focus[];
	currentFocusIndex?: number;
	players?: Player[];
	activePlayerIndex?: number;
	bigPicture?: Game['bigPicture'];
	palette?: Palette;
	legacies?: Legacy[];
}

/**
 * Edits game metadata (name, focus, palette, etc.)
 */
export function editGameMetadata(
	game: Game,
	updates: GameMetadataUpdates
): GameActionResult {
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

	return { action };
}

// ============================================================================
// Anchor Actions
// ============================================================================

/**
 * Ensures anchor arrays are initialized (migration support)
 */
function ensureAnchorsInitialized(game: Game): void {
	if (!game.anchors) game.anchors = [];
	if (!game.anchorPlacements) game.anchorPlacements = [];
	if (game.currentAnchorId === undefined) game.currentAnchorId = null;
}

/**
 * Creates a new anchor
 */
export function createAnchor(
	game: Game,
	name: string,
	description?: string
): GameActionResult {
	ensureAnchorsInitialized(game);

	const anchor = createNewAnchor(name, description);
	const index = game.anchors!.length;

	const action: CreateAnchorAction = {
		type: 'CREATE_ANCHOR',
		timestamp: new Date().toISOString(),
		anchor: deepClone(anchor),
		index
	};

	game.anchors!.push(anchor);

	return { action };
}

/**
 * Edits an anchor's properties
 */
export function editAnchor(
	game: Game,
	anchorId: string,
	name: string,
	description?: string
): GameActionResult | null {
	ensureAnchorsInitialized(game);
	if (!game.anchors?.length) return null;

	const anchor = game.anchors.find((a) => a.id === anchorId);
	if (!anchor) return null;

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

	return { action };
}

/**
 * Deletes an anchor and its associated placements
 */
export function deleteAnchor(game: Game, anchorId: string): GameActionResult | null {
	ensureAnchorsInitialized(game);
	if (!game.anchors?.length) return null;

	const index = game.anchors.findIndex((a) => a.id === anchorId);
	if (index === -1) return null;

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

	return { action };
}

/**
 * Result of setting the current anchor
 */
export interface SetCurrentAnchorResult extends GameActionResult {
	wasAlreadyPlaced: boolean;
}

/**
 * Sets an anchor as the current anchor and places it on a period
 */
export function setCurrentAnchor(
	game: Game,
	anchorId: string,
	periodId: string
): SetCurrentAnchorResult | null {
	ensureAnchorsInitialized(game);

	// Check if this anchor is already placed on this period (prevent duplicate placements)
	const existingPlacement = game.anchorPlacements!.find(
		(p) => p.anchorId === anchorId && p.periodId === periodId
	);

	if (existingPlacement) {
		// Just set this anchor as active without creating a new placement
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
			return { action, wasAlreadyPlaced: true };
		}
		return { action: null as unknown as GameAction, wasAlreadyPlaced: true };
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

	return { action, wasAlreadyPlaced: false };
}

/**
 * Clears the current anchor
 */
export function clearCurrentAnchor(game: Game): GameActionResult | null {
	const previousAnchorId = game.currentAnchorId;
	if (!previousAnchorId) return null;

	const action: ClearCurrentAnchorAction = {
		type: 'CLEAR_CURRENT_ANCHOR',
		timestamp: new Date().toISOString(),
		previousAnchorId
	};

	game.currentAnchorId = null;

	return { action };
}
