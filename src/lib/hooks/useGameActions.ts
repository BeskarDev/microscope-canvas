/**
 * Game Actions Hook
 * 
 * Extracts all game modification handlers from the game page.
 * Handles creating, editing, deleting, and reordering game items
 * with undo/redo support via the history state.
 */

import {
	createNewPeriod,
	createNewEvent,
	createNewScene,
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
	type ReorderScenesAction
} from '$lib/types';
import { deepClone } from '$lib/utils/deep-clone';

export interface GameActionHandlers {
	// Add items
	addPeriod: (index: number) => void;
	addEvent: (periodId: string) => void;
	addScene: (periodId: string, eventId: string) => void;
	
	// Reorder items
	reorderPeriods: (fromIndex: number, toIndex: number) => void;
	reorderEvents: (periodId: string, fromIndex: number, toIndex: number) => void;
	reorderScenes: (periodId: string, eventId: string, fromIndex: number, toIndex: number) => void;
	
	// Save items
	saveItem: (
		itemType: 'period' | 'event' | 'scene',
		itemId: string,
		updates: Partial<Period | GameEvent | Scene>,
		context: { periodId?: string; eventId?: string }
	) => void;
	
	// Delete items
	deleteItem: (
		itemType: 'period' | 'event' | 'scene',
		itemId: string,
		context: { periodId?: string; eventId?: string }
	) => void;
	
	// Game settings
	saveGameSettings: (updates: Partial<Game>) => void;
}

export interface UseGameActionsOptions {
	game: Game | null;
	onGameChange: (game: Game) => void;
	onRecordAction: (action: GameAction) => void;
}

/**
 * Creates game action handlers
 */
export function createGameActionHandlers(options: UseGameActionsOptions): GameActionHandlers {
	const { game, onGameChange, onRecordAction } = options;

	function triggerUpdate() {
		if (game) {
			onGameChange(game);
		}
	}

	function addPeriod(index: number) {
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
		triggerUpdate();
		onRecordAction(action);
	}

	function addEvent(periodId: string) {
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
		triggerUpdate();
		onRecordAction(action);
	}

	function addScene(periodId: string, eventId: string) {
		if (!game) return;
		const period = game.periods.find((p) => p.id === periodId);
		if (!period) return;

		const event = period.events.find((e) => e.id === eventId);
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
		triggerUpdate();
		onRecordAction(action);
	}

	function reorderPeriods(fromIndex: number, toIndex: number) {
		if (!game) return;
		if (fromIndex === toIndex) return;

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
		triggerUpdate();
		onRecordAction(action);
	}

	function reorderEvents(periodId: string, fromIndex: number, toIndex: number) {
		if (!game) return;
		if (fromIndex === toIndex) return;

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
		triggerUpdate();
		onRecordAction(action);
	}

	function reorderScenes(
		periodId: string,
		eventId: string,
		fromIndex: number,
		toIndex: number
	) {
		if (!game) return;
		if (fromIndex === toIndex) return;

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
		triggerUpdate();
		onRecordAction(action);
	}

	function saveItem(
		itemType: 'period' | 'event' | 'scene',
		itemId: string,
		updates: Partial<Period | GameEvent | Scene>,
		context: { periodId?: string; eventId?: string }
	) {
		if (!game) return;

		if (itemType === 'period') {
			const period = game.periods.find((p) => p.id === itemId);
			if (period) {
				const periodUpdates = updates as Partial<Period>;
				const previousValues: Partial<Period> = {};
				const newValues: Partial<Period> = {};
				for (const key of Object.keys(periodUpdates) as (keyof Period)[]) {
					if (key in period && key in periodUpdates) {
						(previousValues as Record<string, unknown>)[key] = deepClone(period[key]);
						(newValues as Record<string, unknown>)[key] = periodUpdates[key];
					}
				}

				const action: EditPeriodAction = {
					type: 'EDIT_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: itemId,
					previousValues,
					newValues
				};

				Object.assign(period, updates, { updatedAt: new Date().toISOString() });
				onRecordAction(action);
			}
		} else if (itemType === 'event') {
			const period = game.periods.find((p) => p.id === context.periodId);
			const event = period?.events.find((e) => e.id === itemId);
			if (event && context.periodId) {
				const eventUpdates = updates as Partial<GameEvent>;
				const previousValues: Partial<GameEvent> = {};
				const newValues: Partial<GameEvent> = {};
				for (const key of Object.keys(eventUpdates) as (keyof GameEvent)[]) {
					if (key in event && key in eventUpdates) {
						(previousValues as Record<string, unknown>)[key] = deepClone(event[key]);
						(newValues as Record<string, unknown>)[key] = eventUpdates[key];
					}
				}

				const action: EditEventAction = {
					type: 'EDIT_EVENT',
					timestamp: new Date().toISOString(),
					periodId: context.periodId,
					eventId: itemId,
					previousValues,
					newValues
				};

				Object.assign(event, updates, { updatedAt: new Date().toISOString() });
				onRecordAction(action);
			}
		} else if (itemType === 'scene') {
			const period = game.periods.find((p) => p.id === context.periodId);
			const event = period?.events.find((e) => e.id === context.eventId);
			const scene = event?.scenes.find((s) => s.id === itemId);
			if (scene && context.periodId && context.eventId) {
				const sceneUpdates = updates as Partial<Scene>;
				const previousValues: Partial<Scene> = {};
				const newValues: Partial<Scene> = {};
				for (const key of Object.keys(sceneUpdates) as (keyof Scene)[]) {
					if (key in scene && key in sceneUpdates) {
						(previousValues as Record<string, unknown>)[key] = deepClone(scene[key]);
						(newValues as Record<string, unknown>)[key] = sceneUpdates[key];
					}
				}

				const action: EditSceneAction = {
					type: 'EDIT_SCENE',
					timestamp: new Date().toISOString(),
					periodId: context.periodId,
					eventId: context.eventId,
					sceneId: itemId,
					previousValues,
					newValues
				};

				Object.assign(scene, updates, { updatedAt: new Date().toISOString() });
				onRecordAction(action);
			}
		}

		triggerUpdate();
	}

	function deleteItem(
		itemType: 'period' | 'event' | 'scene',
		itemId: string,
		context: { periodId?: string; eventId?: string }
	) {
		if (!game) return;

		if (itemType === 'period') {
			const periodIndex = game.periods.findIndex((p) => p.id === itemId);
			const period = game.periods[periodIndex];
			if (period && periodIndex >= 0) {
				const action: DeletePeriodAction = {
					type: 'DELETE_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: itemId,
					index: periodIndex,
					period: deepClone(period)
				};

				game.periods = game.periods.filter((p) => p.id !== itemId);
				onRecordAction(action);
			}
		} else if (itemType === 'event') {
			const period = game.periods.find((p) => p.id === context.periodId);
			if (period && context.periodId) {
				const eventIndex = period.events.findIndex((e) => e.id === itemId);
				const event = period.events[eventIndex];
				if (event && eventIndex >= 0) {
					const action: DeleteEventAction = {
						type: 'DELETE_EVENT',
						timestamp: new Date().toISOString(),
						periodId: context.periodId,
						eventId: itemId,
						index: eventIndex,
						event: deepClone(event)
					};

					period.events = period.events.filter((e) => e.id !== itemId);
					onRecordAction(action);
				}
			}
		} else if (itemType === 'scene') {
			const period = game.periods.find((p) => p.id === context.periodId);
			const event = period?.events.find((e) => e.id === context.eventId);
			if (event && context.periodId && context.eventId) {
				const sceneIndex = event.scenes.findIndex((s) => s.id === itemId);
				const scene = event.scenes[sceneIndex];
				if (scene && sceneIndex >= 0) {
					const action: DeleteSceneAction = {
						type: 'DELETE_SCENE',
						timestamp: new Date().toISOString(),
						periodId: context.periodId,
						eventId: context.eventId,
						sceneId: itemId,
						index: sceneIndex,
						scene: deepClone(scene)
					};

					event.scenes = event.scenes.filter((s) => s.id !== itemId);
					onRecordAction(action);
				}
			}
		}

		triggerUpdate();
	}

	function saveGameSettings(updates: Partial<Game>) {
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
		triggerUpdate();
		onRecordAction(action);
	}

	return {
		addPeriod,
		addEvent,
		addScene,
		reorderPeriods,
		reorderEvents,
		reorderScenes,
		saveItem,
		deleteItem,
		saveGameSettings
	};
}
