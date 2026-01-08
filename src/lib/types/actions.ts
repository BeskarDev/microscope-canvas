/**
 * Action types for the undo/redo system
 * These types define the structure of undoable operations
 */

import type {
	Game,
	Focus,
	Legacy,
	Period,
	Event as GameEvent,
	Scene,
	Player,
	Anchor,
	AnchorPlacement
} from './game';

/**
 * Base action interface
 */
interface BaseAction {
	type: string;
	timestamp: string;
}

/**
 * Create Period action
 */
export interface CreatePeriodAction extends BaseAction {
	type: 'CREATE_PERIOD';
	periodId: string;
	index: number;
	period: Period;
}

/**
 * Delete Period action (stores deleted period and all children)
 */
export interface DeletePeriodAction extends BaseAction {
	type: 'DELETE_PERIOD';
	periodId: string;
	index: number;
	period: Period;
}

/**
 * Edit Period action
 */
export interface EditPeriodAction extends BaseAction {
	type: 'EDIT_PERIOD';
	periodId: string;
	previousValues: Partial<Period>;
	newValues: Partial<Period>;
}

/**
 * Create Event action
 */
export interface CreateEventAction extends BaseAction {
	type: 'CREATE_EVENT';
	periodId: string;
	eventId: string;
	index: number;
	event: GameEvent;
}

/**
 * Delete Event action (stores deleted event and all children)
 */
export interface DeleteEventAction extends BaseAction {
	type: 'DELETE_EVENT';
	periodId: string;
	eventId: string;
	index: number;
	event: GameEvent;
}

/**
 * Edit Event action
 */
export interface EditEventAction extends BaseAction {
	type: 'EDIT_EVENT';
	periodId: string;
	eventId: string;
	previousValues: Partial<GameEvent>;
	newValues: Partial<GameEvent>;
}

/**
 * Create Scene action
 */
export interface CreateSceneAction extends BaseAction {
	type: 'CREATE_SCENE';
	periodId: string;
	eventId: string;
	sceneId: string;
	index: number;
	scene: Scene;
}

/**
 * Delete Scene action
 */
export interface DeleteSceneAction extends BaseAction {
	type: 'DELETE_SCENE';
	periodId: string;
	eventId: string;
	sceneId: string;
	index: number;
	scene: Scene;
}

/**
 * Edit Scene action
 */
export interface EditSceneAction extends BaseAction {
	type: 'EDIT_SCENE';
	periodId: string;
	eventId: string;
	sceneId: string;
	previousValues: Partial<Scene>;
	newValues: Partial<Scene>;
}

/**
 * Edit Game Metadata action (name, focus, legacies, players, etc.)
 */
export interface EditGameMetadataAction extends BaseAction {
	type: 'EDIT_GAME_METADATA';
	previousValues: {
		name?: string;
		focus?: Focus;
		focuses?: Focus[];
		currentFocusIndex?: number;
		players?: Player[];
		activePlayerIndex?: number;
		bigPicture?: Game['bigPicture'];
		palette?: Game['palette'];
		legacies?: Legacy[];
	};
	newValues: {
		name?: string;
		focus?: Focus;
		focuses?: Focus[];
		currentFocusIndex?: number;
		players?: Player[];
		activePlayerIndex?: number;
		bigPicture?: Game['bigPicture'];
		palette?: Game['palette'];
		legacies?: Legacy[];
	};
}

/**
 * Add Legacy action
 */
export interface AddLegacyAction extends BaseAction {
	type: 'ADD_LEGACY';
	legacy: Legacy;
	index: number;
}

/**
 * Remove Legacy action
 */
export interface RemoveLegacyAction extends BaseAction {
	type: 'REMOVE_LEGACY';
	legacy: Legacy;
	index: number;
}

/**
 * Edit Legacy action
 */
export interface EditLegacyAction extends BaseAction {
	type: 'EDIT_LEGACY';
	legacyId: string;
	previousValues: Partial<Legacy>;
	newValues: Partial<Legacy>;
}

/**
 * Reorder Periods action
 */
export interface ReorderPeriodsAction extends BaseAction {
	type: 'REORDER_PERIODS';
	previousOrder: string[];
	newOrder: string[];
}

/**
 * Reorder Events action
 */
export interface ReorderEventsAction extends BaseAction {
	type: 'REORDER_EVENTS';
	periodId: string;
	previousOrder: string[];
	newOrder: string[];
}

/**
 * Reorder Scenes action
 */
export interface ReorderScenesAction extends BaseAction {
	type: 'REORDER_SCENES';
	periodId: string;
	eventId: string;
	previousOrder: string[];
	newOrder: string[];
}

/**
 * Create Anchor action
 */
export interface CreateAnchorAction extends BaseAction {
	type: 'CREATE_ANCHOR';
	anchor: Anchor;
	index: number;
}

/**
 * Delete Anchor action (stores deleted anchor and associated placements)
 */
export interface DeleteAnchorAction extends BaseAction {
	type: 'DELETE_ANCHOR';
	anchorId: string;
	index: number;
	anchor: Anchor;
	associatedPlacements: AnchorPlacement[];
	wasCurrentAnchor: boolean;
}

/**
 * Edit Anchor action
 */
export interface EditAnchorAction extends BaseAction {
	type: 'EDIT_ANCHOR';
	anchorId: string;
	previousValues: Partial<Anchor>;
	newValues: Partial<Anchor>;
}

/**
 * Set Current Anchor action (place anchor on a period)
 */
export interface SetCurrentAnchorAction extends BaseAction {
	type: 'SET_CURRENT_ANCHOR';
	anchorId: string;
	periodId: string;
	placement: AnchorPlacement;
	previousAnchorId: string | null;
}

/**
 * Clear Current Anchor action
 */
export interface ClearCurrentAnchorAction extends BaseAction {
	type: 'CLEAR_CURRENT_ANCHOR';
	previousAnchorId: string | null;
}

/**
 * Union type of all possible actions
 */
export type GameAction =
	| CreatePeriodAction
	| DeletePeriodAction
	| EditPeriodAction
	| CreateEventAction
	| DeleteEventAction
	| EditEventAction
	| CreateSceneAction
	| DeleteSceneAction
	| EditSceneAction
	| EditGameMetadataAction
	| AddLegacyAction
	| RemoveLegacyAction
	| EditLegacyAction
	| ReorderPeriodsAction
	| ReorderEventsAction
	| ReorderScenesAction
	| CreateAnchorAction
	| DeleteAnchorAction
	| EditAnchorAction
	| SetCurrentAnchorAction
	| ClearCurrentAnchorAction;

/**
 * Action type names for display purposes
 */
export const ACTION_DISPLAY_NAMES: Record<GameAction['type'], string> = {
	CREATE_PERIOD: 'Create Period',
	DELETE_PERIOD: 'Delete Period',
	EDIT_PERIOD: 'Edit Period',
	CREATE_EVENT: 'Create Event',
	DELETE_EVENT: 'Delete Event',
	EDIT_EVENT: 'Edit Event',
	CREATE_SCENE: 'Create Scene',
	DELETE_SCENE: 'Delete Scene',
	EDIT_SCENE: 'Edit Scene',
	EDIT_GAME_METADATA: 'Edit Game Settings',
	ADD_LEGACY: 'Add Legacy',
	REMOVE_LEGACY: 'Remove Legacy',
	EDIT_LEGACY: 'Edit Legacy',
	REORDER_PERIODS: 'Reorder Periods',
	REORDER_EVENTS: 'Reorder Events',
	REORDER_SCENES: 'Reorder Scenes',
	CREATE_ANCHOR: 'Create Anchor',
	DELETE_ANCHOR: 'Delete Anchor',
	EDIT_ANCHOR: 'Edit Anchor',
	SET_CURRENT_ANCHOR: 'Set Current Anchor',
	CLEAR_CURRENT_ANCHOR: 'Clear Current Anchor'
};
