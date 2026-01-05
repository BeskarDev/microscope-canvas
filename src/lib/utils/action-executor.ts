/**
 * Action executor/reverser utility
 * Applies and reverses actions on game state for undo/redo functionality
 */

import type { Game } from '$lib/types/game';
import type {
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
	AddLegacyAction,
	RemoveLegacyAction,
	EditLegacyAction,
	ReorderPeriodsAction,
	ReorderEventsAction,
	ReorderScenesAction
} from '$lib/types/actions';

/**
 * Deep clones a game object to avoid mutation
 */
function cloneGame(game: Game): Game {
	return JSON.parse(JSON.stringify(game));
}

/**
 * Applies an action to the game state (for redo)
 * Returns a new game state with the action applied
 */
export function applyAction(game: Game, action: GameAction): Game {
	const newGame = cloneGame(game);

	switch (action.type) {
		case 'CREATE_PERIOD':
			return applyCreatePeriod(newGame, action);
		case 'DELETE_PERIOD':
			return applyDeletePeriod(newGame, action);
		case 'EDIT_PERIOD':
			return applyEditPeriod(newGame, action, false);
		case 'CREATE_EVENT':
			return applyCreateEvent(newGame, action);
		case 'DELETE_EVENT':
			return applyDeleteEvent(newGame, action);
		case 'EDIT_EVENT':
			return applyEditEvent(newGame, action, false);
		case 'CREATE_SCENE':
			return applyCreateScene(newGame, action);
		case 'DELETE_SCENE':
			return applyDeleteScene(newGame, action);
		case 'EDIT_SCENE':
			return applyEditScene(newGame, action, false);
		case 'EDIT_GAME_METADATA':
			return applyEditGameMetadata(newGame, action, false);
		case 'ADD_LEGACY':
			return applyAddLegacy(newGame, action);
		case 'REMOVE_LEGACY':
			return applyRemoveLegacy(newGame, action);
		case 'EDIT_LEGACY':
			return applyEditLegacy(newGame, action, false);
		case 'REORDER_PERIODS':
			return applyReorderPeriods(newGame, action, false);
		case 'REORDER_EVENTS':
			return applyReorderEvents(newGame, action, false);
		case 'REORDER_SCENES':
			return applyReorderScenes(newGame, action, false);
		default:
			console.warn(
				`applyAction: Unknown action type "${(action as GameAction).type}". ` +
					`Expected one of: CREATE_PERIOD, DELETE_PERIOD, EDIT_PERIOD, ` +
					`CREATE_EVENT, DELETE_EVENT, EDIT_EVENT, CREATE_SCENE, DELETE_SCENE, EDIT_SCENE, ` +
					`EDIT_GAME_METADATA, ADD_LEGACY, REMOVE_LEGACY, EDIT_LEGACY, ` +
					`REORDER_PERIODS, REORDER_EVENTS, REORDER_SCENES`
			);
			return newGame;
	}
}

/**
 * Reverses an action on the game state (for undo)
 * Returns a new game state with the action reversed
 */
export function reverseAction(game: Game, action: GameAction): Game {
	const newGame = cloneGame(game);

	switch (action.type) {
		case 'CREATE_PERIOD':
			// Reverse of create is delete
			return reverseCreatePeriod(newGame, action);
		case 'DELETE_PERIOD':
			// Reverse of delete is create (restore)
			return reverseDeletePeriod(newGame, action);
		case 'EDIT_PERIOD':
			// Reverse by applying previous values
			return applyEditPeriod(newGame, action, true);
		case 'CREATE_EVENT':
			return reverseCreateEvent(newGame, action);
		case 'DELETE_EVENT':
			return reverseDeleteEvent(newGame, action);
		case 'EDIT_EVENT':
			return applyEditEvent(newGame, action, true);
		case 'CREATE_SCENE':
			return reverseCreateScene(newGame, action);
		case 'DELETE_SCENE':
			return reverseDeleteScene(newGame, action);
		case 'EDIT_SCENE':
			return applyEditScene(newGame, action, true);
		case 'EDIT_GAME_METADATA':
			return applyEditGameMetadata(newGame, action, true);
		case 'ADD_LEGACY':
			// Reverse of add is remove
			return reverseAddLegacy(newGame, action);
		case 'REMOVE_LEGACY':
			// Reverse of remove is add
			return reverseRemoveLegacy(newGame, action);
		case 'EDIT_LEGACY':
			return applyEditLegacy(newGame, action, true);
		case 'REORDER_PERIODS':
			return applyReorderPeriods(newGame, action, true);
		case 'REORDER_EVENTS':
			return applyReorderEvents(newGame, action, true);
		case 'REORDER_SCENES':
			return applyReorderScenes(newGame, action, true);
		default:
			console.warn(
				`reverseAction: Unknown action type "${(action as GameAction).type}". ` +
					`Expected one of: CREATE_PERIOD, DELETE_PERIOD, EDIT_PERIOD, ` +
					`CREATE_EVENT, DELETE_EVENT, EDIT_EVENT, CREATE_SCENE, DELETE_SCENE, EDIT_SCENE, ` +
					`EDIT_GAME_METADATA, ADD_LEGACY, REMOVE_LEGACY, EDIT_LEGACY, ` +
					`REORDER_PERIODS, REORDER_EVENTS, REORDER_SCENES`
			);
			return newGame;
	}
}

// Period actions
function applyCreatePeriod(game: Game, action: CreatePeriodAction): Game {
	game.periods.splice(action.index, 0, { ...action.period });
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseCreatePeriod(game: Game, action: CreatePeriodAction): Game {
	game.periods = game.periods.filter((p) => p.id !== action.periodId);
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyDeletePeriod(game: Game, action: DeletePeriodAction): Game {
	game.periods = game.periods.filter((p) => p.id !== action.periodId);
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseDeletePeriod(game: Game, action: DeletePeriodAction): Game {
	game.periods.splice(action.index, 0, { ...action.period });
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyEditPeriod(game: Game, action: EditPeriodAction, reverse: boolean): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	if (period) {
		const values = reverse ? action.previousValues : action.newValues;
		Object.assign(period, values);
		period.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

// Event actions
function applyCreateEvent(game: Game, action: CreateEventAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	if (period) {
		period.events.splice(action.index, 0, { ...action.event });
		period.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseCreateEvent(game: Game, action: CreateEventAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	if (period) {
		period.events = period.events.filter((e) => e.id !== action.eventId);
		period.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyDeleteEvent(game: Game, action: DeleteEventAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	if (period) {
		period.events = period.events.filter((e) => e.id !== action.eventId);
		period.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseDeleteEvent(game: Game, action: DeleteEventAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	if (period) {
		period.events.splice(action.index, 0, { ...action.event });
		period.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyEditEvent(game: Game, action: EditEventAction, reverse: boolean): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	const event = period?.events.find((e) => e.id === action.eventId);
	if (event) {
		const values = reverse ? action.previousValues : action.newValues;
		Object.assign(event, values);
		event.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

// Scene actions
function applyCreateScene(game: Game, action: CreateSceneAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	const event = period?.events.find((e) => e.id === action.eventId);
	if (event) {
		event.scenes.splice(action.index, 0, { ...action.scene });
		event.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseCreateScene(game: Game, action: CreateSceneAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	const event = period?.events.find((e) => e.id === action.eventId);
	if (event) {
		event.scenes = event.scenes.filter((s) => s.id !== action.sceneId);
		event.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyDeleteScene(game: Game, action: DeleteSceneAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	const event = period?.events.find((e) => e.id === action.eventId);
	if (event) {
		event.scenes = event.scenes.filter((s) => s.id !== action.sceneId);
		event.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseDeleteScene(game: Game, action: DeleteSceneAction): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	const event = period?.events.find((e) => e.id === action.eventId);
	if (event) {
		event.scenes.splice(action.index, 0, { ...action.scene });
		event.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyEditScene(game: Game, action: EditSceneAction, reverse: boolean): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	const event = period?.events.find((e) => e.id === action.eventId);
	const scene = event?.scenes.find((s) => s.id === action.sceneId);
	if (scene) {
		const values = reverse ? action.previousValues : action.newValues;
		Object.assign(scene, values);
		scene.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

// Game metadata actions
function applyEditGameMetadata(game: Game, action: EditGameMetadataAction, reverse: boolean): Game {
	const values = reverse ? action.previousValues : action.newValues;
	if (values.name !== undefined) game.name = values.name;
	if (values.focus !== undefined) game.focus = values.focus;
	if (values.bigPicture !== undefined) game.bigPicture = values.bigPicture;
	if (values.palette !== undefined) game.palette = values.palette;
	if (values.legacies !== undefined) game.legacies = [...values.legacies];
	game.updatedAt = new Date().toISOString();
	return game;
}

// Legacy actions
function applyAddLegacy(game: Game, action: AddLegacyAction): Game {
	game.legacies.splice(action.index, 0, { ...action.legacy });
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseAddLegacy(game: Game, action: AddLegacyAction): Game {
	game.legacies = game.legacies.filter((l) => l.id !== action.legacy.id);
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyRemoveLegacy(game: Game, action: RemoveLegacyAction): Game {
	game.legacies = game.legacies.filter((l) => l.id !== action.legacy.id);
	game.updatedAt = new Date().toISOString();
	return game;
}

function reverseRemoveLegacy(game: Game, action: RemoveLegacyAction): Game {
	game.legacies.splice(action.index, 0, { ...action.legacy });
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyEditLegacy(game: Game, action: EditLegacyAction, reverse: boolean): Game {
	const legacy = game.legacies.find((l) => l.id === action.legacyId);
	if (legacy) {
		const values = reverse ? action.previousValues : action.newValues;
		Object.assign(legacy, values);
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

// Reorder actions
function applyReorderPeriods(game: Game, action: ReorderPeriodsAction, reverse: boolean): Game {
	const order = reverse ? action.previousOrder : action.newOrder;
	const periodsMap = new Map(game.periods.map((p) => [p.id, p]));
	game.periods = order.map((id) => periodsMap.get(id)!).filter(Boolean);
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyReorderEvents(game: Game, action: ReorderEventsAction, reverse: boolean): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	if (period) {
		const order = reverse ? action.previousOrder : action.newOrder;
		const eventsMap = new Map(period.events.map((e) => [e.id, e]));
		period.events = order.map((id) => eventsMap.get(id)!).filter(Boolean);
		period.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}

function applyReorderScenes(game: Game, action: ReorderScenesAction, reverse: boolean): Game {
	const period = game.periods.find((p) => p.id === action.periodId);
	const event = period?.events.find((e) => e.id === action.eventId);
	if (event) {
		const order = reverse ? action.previousOrder : action.newOrder;
		const scenesMap = new Map(event.scenes.map((s) => [s.id, s]));
		event.scenes = order.map((id) => scenesMap.get(id)!).filter(Boolean);
		event.updatedAt = new Date().toISOString();
	}
	game.updatedAt = new Date().toISOString();
	return game;
}
