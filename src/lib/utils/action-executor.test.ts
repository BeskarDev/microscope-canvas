/**
 * Tests for action executor/reverser utility
 */

import { describe, it, expect, vi } from 'vitest';
import { applyAction, reverseAction } from './action-executor';
import { createNewGame, createNewPeriod, createNewEvent, createNewScene, createNewAnchor, createAnchorPlacement } from '$lib/types';
import type {
	Game,
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
	ClearCurrentAnchorAction
} from '$lib/types';
import { deepClone } from './deep-clone';

// Helper to create a test game
function createTestGame(): Game {
	return createNewGame('Test Game');
}

// Helper to create a populated game
function createPopulatedGame(): Game {
	const game = createTestGame();

	// Add 3 periods with events and scenes
	for (let i = 0; i < 3; i++) {
		const period = createNewPeriod(`Period ${i + 1}`);

		for (let j = 0; j < 2; j++) {
			const event = createNewEvent(`Event ${i + 1}-${j + 1}`);

			for (let k = 0; k < 2; k++) {
				const scene = createNewScene(`Scene ${i + 1}-${j + 1}-${k + 1}`);
				event.scenes.push(scene);
			}

			period.events.push(event);
		}

		game.periods.push(period);
	}

	return game;
}

describe('Action Executor', () => {
	describe('Period Actions', () => {
		describe('CREATE_PERIOD', () => {
			it('should apply create period action', () => {
				const game = createTestGame();
				const period = createNewPeriod('New Period');

				const action: CreatePeriodAction = {
					type: 'CREATE_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: period.id,
					index: 0,
					period: deepClone(period)
				};

				const result = applyAction(game, action);

				expect(result.periods).toHaveLength(1);
				expect(result.periods[0].name).toBe('New Period');
			});

			it('should reverse create period action', () => {
				const game = createTestGame();
				const period = createNewPeriod('New Period');
				game.periods.push(period);

				const action: CreatePeriodAction = {
					type: 'CREATE_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: period.id,
					index: 0,
					period: deepClone(period)
				};

				const result = reverseAction(game, action);

				expect(result.periods).toHaveLength(0);
			});
		});

		describe('DELETE_PERIOD', () => {
			it('should apply delete period action', () => {
				const game = createPopulatedGame();
				const periodToDelete = game.periods[0];

				const action: DeletePeriodAction = {
					type: 'DELETE_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: periodToDelete.id,
					index: 0,
					period: deepClone(periodToDelete)
				};

				const result = applyAction(game, action);

				expect(result.periods).toHaveLength(2);
				expect(result.periods.find((p) => p.id === periodToDelete.id)).toBeUndefined();
			});

			it('should reverse delete period action (restore)', () => {
				const game = createPopulatedGame();
				const deletedPeriod = game.periods[0];
				const deletedPeriodClone = deepClone(deletedPeriod);
				game.periods = game.periods.slice(1);

				const action: DeletePeriodAction = {
					type: 'DELETE_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: deletedPeriod.id,
					index: 0,
					period: deletedPeriodClone
				};

				const result = reverseAction(game, action);

				expect(result.periods).toHaveLength(3);
				expect(result.periods[0].id).toBe(deletedPeriod.id);
			});
		});

		describe('EDIT_PERIOD', () => {
			it('should apply edit period action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;

				const action: EditPeriodAction = {
					type: 'EDIT_PERIOD',
					timestamp: new Date().toISOString(),
					periodId,
					previousValues: { name: 'Period 1' },
					newValues: { name: 'Updated Period' }
				};

				const result = applyAction(game, action);

				expect(result.periods[0].name).toBe('Updated Period');
			});

			it('should reverse edit period action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				game.periods[0].name = 'Updated Period';

				const action: EditPeriodAction = {
					type: 'EDIT_PERIOD',
					timestamp: new Date().toISOString(),
					periodId,
					previousValues: { name: 'Period 1' },
					newValues: { name: 'Updated Period' }
				};

				const result = reverseAction(game, action);

				expect(result.periods[0].name).toBe('Period 1');
			});
		});
	});

	describe('Event Actions', () => {
		describe('CREATE_EVENT', () => {
			it('should apply create event action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const event = createNewEvent('New Event');
				const index = game.periods[0].events.length;

				const action: CreateEventAction = {
					type: 'CREATE_EVENT',
					timestamp: new Date().toISOString(),
					periodId,
					eventId: event.id,
					index,
					event: deepClone(event)
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events).toHaveLength(3);
				expect(result.periods[0].events[index].name).toBe('New Event');
			});

			it('should reverse create event action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const newEvent = createNewEvent('New Event');
				game.periods[0].events.push(newEvent);

				const action: CreateEventAction = {
					type: 'CREATE_EVENT',
					timestamp: new Date().toISOString(),
					periodId,
					eventId: newEvent.id,
					index: 2,
					event: deepClone(newEvent)
				};

				const result = reverseAction(game, action);

				expect(result.periods[0].events).toHaveLength(2);
			});
		});

		describe('DELETE_EVENT', () => {
			it('should apply delete event action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const eventToDelete = game.periods[0].events[0];

				const action: DeleteEventAction = {
					type: 'DELETE_EVENT',
					timestamp: new Date().toISOString(),
					periodId,
					eventId: eventToDelete.id,
					index: 0,
					event: deepClone(eventToDelete)
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events).toHaveLength(1);
			});

			it('should reverse delete event action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const deletedEvent = game.periods[0].events[0];
				const deletedEventClone = deepClone(deletedEvent);
				game.periods[0].events = game.periods[0].events.slice(1);

				const action: DeleteEventAction = {
					type: 'DELETE_EVENT',
					timestamp: new Date().toISOString(),
					periodId,
					eventId: deletedEvent.id,
					index: 0,
					event: deletedEventClone
				};

				const result = reverseAction(game, action);

				expect(result.periods[0].events).toHaveLength(2);
				expect(result.periods[0].events[0].id).toBe(deletedEvent.id);
			});
		});

		describe('EDIT_EVENT', () => {
			it('should apply edit event action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const eventId = game.periods[0].events[0].id;

				const action: EditEventAction = {
					type: 'EDIT_EVENT',
					timestamp: new Date().toISOString(),
					periodId,
					eventId,
					previousValues: { name: 'Event 1-1' },
					newValues: { name: 'Updated Event' }
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events[0].name).toBe('Updated Event');
			});

			it('should reverse edit event action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const eventId = game.periods[0].events[0].id;
				game.periods[0].events[0].name = 'Updated Event';

				const action: EditEventAction = {
					type: 'EDIT_EVENT',
					timestamp: new Date().toISOString(),
					periodId,
					eventId,
					previousValues: { name: 'Event 1-1' },
					newValues: { name: 'Updated Event' }
				};

				const result = reverseAction(game, action);

				expect(result.periods[0].events[0].name).toBe('Event 1-1');
			});
		});
	});

	describe('Scene Actions', () => {
		describe('CREATE_SCENE', () => {
			it('should apply create scene action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const eventId = game.periods[0].events[0].id;
				const scene = createNewScene('New Scene');
				const index = game.periods[0].events[0].scenes.length;

				const action: CreateSceneAction = {
					type: 'CREATE_SCENE',
					timestamp: new Date().toISOString(),
					periodId,
					eventId,
					sceneId: scene.id,
					index,
					scene: deepClone(scene)
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events[0].scenes).toHaveLength(3);
			});
		});

		describe('DELETE_SCENE', () => {
			it('should apply delete scene action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const eventId = game.periods[0].events[0].id;
				const sceneToDelete = game.periods[0].events[0].scenes[0];

				const action: DeleteSceneAction = {
					type: 'DELETE_SCENE',
					timestamp: new Date().toISOString(),
					periodId,
					eventId,
					sceneId: sceneToDelete.id,
					index: 0,
					scene: deepClone(sceneToDelete)
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events[0].scenes).toHaveLength(1);
			});
		});

		describe('EDIT_SCENE', () => {
			it('should apply edit scene action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const eventId = game.periods[0].events[0].id;
				const sceneId = game.periods[0].events[0].scenes[0].id;

				const action: EditSceneAction = {
					type: 'EDIT_SCENE',
					timestamp: new Date().toISOString(),
					periodId,
					eventId,
					sceneId,
					previousValues: { name: 'Scene 1-1-1' },
					newValues: { name: 'Updated Scene' }
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events[0].scenes[0].name).toBe('Updated Scene');
			});
		});
	});

	describe('Game Metadata Actions', () => {
		describe('EDIT_GAME_METADATA', () => {
			it('should apply edit game metadata action', () => {
				const game = createTestGame();

				const action: EditGameMetadataAction = {
					type: 'EDIT_GAME_METADATA',
					timestamp: new Date().toISOString(),
					previousValues: { name: 'Test Game' },
					newValues: { name: 'Updated Game' }
				};

				const result = applyAction(game, action);

				expect(result.name).toBe('Updated Game');
			});

			it('should reverse edit game metadata action', () => {
				const game = createTestGame();
				game.name = 'Updated Game';

				const action: EditGameMetadataAction = {
					type: 'EDIT_GAME_METADATA',
					timestamp: new Date().toISOString(),
					previousValues: { name: 'Test Game' },
					newValues: { name: 'Updated Game' }
				};

				const result = reverseAction(game, action);

				expect(result.name).toBe('Test Game');
			});

			it('should handle multiple metadata fields', () => {
				const game = createTestGame();
				game.activePlayerIndex = -1;

				const action: EditGameMetadataAction = {
					type: 'EDIT_GAME_METADATA',
					timestamp: new Date().toISOString(),
					previousValues: { name: 'Test Game', activePlayerIndex: -1 },
					newValues: { name: 'New Name', activePlayerIndex: 0 }
				};

				const result = applyAction(game, action);

				expect(result.name).toBe('New Name');
				expect(result.activePlayerIndex).toBe(0);
			});
		});
	});

	describe('Reorder Actions', () => {
		describe('REORDER_PERIODS', () => {
			it('should apply reorder periods action', () => {
				const game = createPopulatedGame();
				const originalOrder = game.periods.map((p) => p.id);
				const newOrder = [originalOrder[2], originalOrder[0], originalOrder[1]];

				const action: ReorderPeriodsAction = {
					type: 'REORDER_PERIODS',
					timestamp: new Date().toISOString(),
					previousOrder: originalOrder,
					newOrder
				};

				const result = applyAction(game, action);

				expect(result.periods.map((p) => p.id)).toEqual(newOrder);
			});

			it('should reverse reorder periods action', () => {
				const game = createPopulatedGame();
				const originalOrder = game.periods.map((p) => p.id);
				const newOrder = [originalOrder[2], originalOrder[0], originalOrder[1]];

				// Apply the reorder first
				game.periods = newOrder.map((id) => game.periods.find((p) => p.id === id)!);

				const action: ReorderPeriodsAction = {
					type: 'REORDER_PERIODS',
					timestamp: new Date().toISOString(),
					previousOrder: originalOrder,
					newOrder
				};

				const result = reverseAction(game, action);

				expect(result.periods.map((p) => p.id)).toEqual(originalOrder);
			});
		});

		describe('REORDER_EVENTS', () => {
			it('should apply reorder events action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const originalOrder = game.periods[0].events.map((e) => e.id);
				const newOrder = [originalOrder[1], originalOrder[0]];

				const action: ReorderEventsAction = {
					type: 'REORDER_EVENTS',
					timestamp: new Date().toISOString(),
					periodId,
					previousOrder: originalOrder,
					newOrder
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events.map((e) => e.id)).toEqual(newOrder);
			});
		});

		describe('REORDER_SCENES', () => {
			it('should apply reorder scenes action', () => {
				const game = createPopulatedGame();
				const periodId = game.periods[0].id;
				const eventId = game.periods[0].events[0].id;
				const originalOrder = game.periods[0].events[0].scenes.map((s) => s.id);
				const newOrder = [originalOrder[1], originalOrder[0]];

				const action: ReorderScenesAction = {
					type: 'REORDER_SCENES',
					timestamp: new Date().toISOString(),
					periodId,
					eventId,
					previousOrder: originalOrder,
					newOrder
				};

				const result = applyAction(game, action);

				expect(result.periods[0].events[0].scenes.map((s) => s.id)).toEqual(newOrder);
			});
		});
	});

	describe('Anchor Actions', () => {
		describe('CREATE_ANCHOR', () => {
			it('should apply create anchor action', () => {
				const game = createTestGame();
				game.anchors = [];
				const anchor = createNewAnchor('Test Anchor', 'Description');

				const action: CreateAnchorAction = {
					type: 'CREATE_ANCHOR',
					timestamp: new Date().toISOString(),
					anchor: deepClone(anchor),
					index: 0
				};

				const result = applyAction(game, action);

				expect(result.anchors).toHaveLength(1);
				expect(result.anchors![0].name).toBe('Test Anchor');
			});

			it('should reverse create anchor action', () => {
				const game = createTestGame();
				const anchor = createNewAnchor('Test Anchor');
				game.anchors = [anchor];

				const action: CreateAnchorAction = {
					type: 'CREATE_ANCHOR',
					timestamp: new Date().toISOString(),
					anchor: deepClone(anchor),
					index: 0
				};

				const result = reverseAction(game, action);

				expect(result.anchors).toHaveLength(0);
			});
		});

		describe('DELETE_ANCHOR', () => {
			it('should apply delete anchor action', () => {
				const game = createTestGame();
				const anchor = createNewAnchor('Test Anchor');
				game.anchors = [anchor];
				game.anchorPlacements = [];
				game.currentAnchorId = null;

				const action: DeleteAnchorAction = {
					type: 'DELETE_ANCHOR',
					timestamp: new Date().toISOString(),
					anchorId: anchor.id,
					index: 0,
					anchor: deepClone(anchor),
					associatedPlacements: [],
					wasCurrentAnchor: false
				};

				const result = applyAction(game, action);

				expect(result.anchors).toHaveLength(0);
			});

			it('should reverse delete anchor action', () => {
				const game = createTestGame();
				const anchor = createNewAnchor('Test Anchor');
				game.anchors = [];
				game.anchorPlacements = [];

				const action: DeleteAnchorAction = {
					type: 'DELETE_ANCHOR',
					timestamp: new Date().toISOString(),
					anchorId: anchor.id,
					index: 0,
					anchor: deepClone(anchor),
					associatedPlacements: [],
					wasCurrentAnchor: false
				};

				const result = reverseAction(game, action);

				expect(result.anchors).toHaveLength(1);
				expect(result.anchors![0].id).toBe(anchor.id);
			});
		});

		describe('EDIT_ANCHOR', () => {
			it('should apply edit anchor action', () => {
				const game = createTestGame();
				const anchor = createNewAnchor('Original Name');
				game.anchors = [anchor];

				const action: EditAnchorAction = {
					type: 'EDIT_ANCHOR',
					timestamp: new Date().toISOString(),
					anchorId: anchor.id,
					previousValues: { name: 'Original Name' },
					newValues: { name: 'Updated Name' }
				};

				const result = applyAction(game, action);

				expect(result.anchors![0].name).toBe('Updated Name');
			});
		});

		describe('SET_CURRENT_ANCHOR', () => {
			it('should apply set current anchor action', () => {
				const game = createPopulatedGame();
				const anchor = createNewAnchor('Test Anchor');
				game.anchors = [anchor];
				game.anchorPlacements = [];
				game.currentAnchorId = null;

				const placement = createAnchorPlacement(anchor.id, game.periods[0].id);

				const action: SetCurrentAnchorAction = {
					type: 'SET_CURRENT_ANCHOR',
					timestamp: new Date().toISOString(),
					anchorId: anchor.id,
					periodId: game.periods[0].id,
					placement: deepClone(placement),
					previousAnchorId: null,
					removedPlacements: []
				};

				const result = applyAction(game, action);

				expect(result.currentAnchorId).toBe(anchor.id);
				expect(result.anchorPlacements).toHaveLength(1);
			});

			it('should reverse set current anchor action', () => {
				const game = createPopulatedGame();
				const anchor = createNewAnchor('Test Anchor');
				game.anchors = [anchor];
				const placement = createAnchorPlacement(anchor.id, game.periods[0].id);
				game.anchorPlacements = [placement];
				game.currentAnchorId = anchor.id;

				const action: SetCurrentAnchorAction = {
					type: 'SET_CURRENT_ANCHOR',
					timestamp: new Date().toISOString(),
					anchorId: anchor.id,
					periodId: game.periods[0].id,
					placement: deepClone(placement),
					previousAnchorId: null,
					removedPlacements: []
				};

				const result = reverseAction(game, action);

				expect(result.currentAnchorId).toBeNull();
				expect(result.anchorPlacements).toHaveLength(0);
			});
		});

		describe('CLEAR_CURRENT_ANCHOR', () => {
			it('should apply clear current anchor action', () => {
				const game = createTestGame();
				const anchor = createNewAnchor('Test Anchor');
				game.anchors = [anchor];
				game.currentAnchorId = anchor.id;

				const action: ClearCurrentAnchorAction = {
					type: 'CLEAR_CURRENT_ANCHOR',
					timestamp: new Date().toISOString(),
					previousAnchorId: anchor.id
				};

				const result = applyAction(game, action);

				expect(result.currentAnchorId).toBeNull();
			});

			it('should reverse clear current anchor action', () => {
				const game = createTestGame();
				const anchor = createNewAnchor('Test Anchor');
				game.anchors = [anchor];
				game.currentAnchorId = null;

				const action: ClearCurrentAnchorAction = {
					type: 'CLEAR_CURRENT_ANCHOR',
					timestamp: new Date().toISOString(),
					previousAnchorId: anchor.id
				};

				const result = reverseAction(game, action);

				expect(result.currentAnchorId).toBe(anchor.id);
			});
		});
	});

	describe('Edge Cases', () => {
		it('should not mutate original game object', () => {
			const game = createPopulatedGame();
			const originalGame = deepClone(game);

			const action: EditPeriodAction = {
				type: 'EDIT_PERIOD',
				timestamp: new Date().toISOString(),
				periodId: game.periods[0].id,
				previousValues: { name: 'Period 1' },
				newValues: { name: 'Updated' }
			};

			applyAction(game, action);

			// The function clones internally, so original should be unchanged
			expect(game.periods[0].name).toBe(originalGame.periods[0].name);
		});

		it('should handle unknown action type gracefully', () => {
			const game = createTestGame();
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const unknownAction = {
				type: 'UNKNOWN_ACTION',
				timestamp: new Date().toISOString()
			} as unknown as CreatePeriodAction;

			const result = applyAction(game, unknownAction);

			expect(consoleSpy).toHaveBeenCalled();
			expect(result).toBeDefined();
			consoleSpy.mockRestore();
		});
	});
});
