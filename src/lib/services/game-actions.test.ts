/**
 * Tests for game actions service
 */

import { describe, it, expect } from 'vitest';
import {
	addPeriod,
	addEvent,
	addScene,
	deletePeriod,
	deleteEvent,
	deleteScene,
	editPeriod,
	editEvent,
	editScene,
	reorderPeriods,
	reorderEvents,
	reorderScenes,
	editGameMetadata,
	createAnchor,
	editAnchor,
	deleteAnchor,
	setCurrentAnchor,
	clearCurrentAnchor
} from './game-actions';
import { createNewGame, createNewPeriod, createNewEvent, createNewScene } from '$lib/types';
import type { Game } from '$lib/types';

// Helper to create a test game
function createTestGame(): Game {
	return createNewGame('Test Game');
}

// Helper to create a test game with periods, events, and scenes
function createPopulatedGame(): Game {
	const game = createTestGame();

	// Add 3 periods
	for (let i = 0; i < 3; i++) {
		const period = createNewPeriod(`Period ${i + 1}`);

		// Add 2 events to each period
		for (let j = 0; j < 2; j++) {
			const event = createNewEvent(`Event ${i + 1}-${j + 1}`);

			// Add 2 scenes to each event
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

describe('Game Actions Service', () => {
	describe('addPeriod', () => {
		it('should add a period at the specified index', () => {
			const game = createTestGame();
			const result = addPeriod(game, 0);

			expect(game.periods).toHaveLength(1);
			expect(game.periods[0].name).toBe('New Period');
			expect(result.action.type).toBe('CREATE_PERIOD');
		});

		it('should add period at beginning when index is 0', () => {
			const game = createPopulatedGame();
			const originalFirstPeriod = game.periods[0].name;

			addPeriod(game, 0);

			expect(game.periods).toHaveLength(4);
			expect(game.periods[0].name).toBe('New Period');
			expect(game.periods[1].name).toBe(originalFirstPeriod);
		});

		it('should add period at end when index equals length', () => {
			const game = createPopulatedGame();
			const originalLength = game.periods.length;

			addPeriod(game, originalLength);

			expect(game.periods).toHaveLength(originalLength + 1);
			expect(game.periods[originalLength].name).toBe('New Period');
		});

		it('should return action with correct period data', () => {
			const game = createTestGame();
			const result = addPeriod(game, 0);

			expect(result.action.type).toBe('CREATE_PERIOD');
			if (result.action.type === 'CREATE_PERIOD') {
				expect(result.action.index).toBe(0);
				expect(result.action.period.name).toBe('New Period');
				expect(result.action.periodId).toBe(result.action.period.id);
			}
		});
	});

	describe('addEvent', () => {
		it('should add an event to a period', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const originalEventCount = game.periods[0].events.length;

			const result = addEvent(game, periodId);

			expect(game.periods[0].events).toHaveLength(originalEventCount + 1);
			expect(result).not.toBeNull();
			expect(result!.action.type).toBe('CREATE_EVENT');
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = addEvent(game, 'non-existent-id');

			expect(result).toBeNull();
		});

		it('should add event at the end of events array', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;

			addEvent(game, periodId);

			const events = game.periods[0].events;
			expect(events[events.length - 1].name).toBe('New Event');
		});
	});

	describe('addScene', () => {
		it('should add a scene to an event', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const eventId = game.periods[0].events[0].id;
			const originalSceneCount = game.periods[0].events[0].scenes.length;

			const result = addScene(game, periodId, eventId);

			expect(game.periods[0].events[0].scenes).toHaveLength(originalSceneCount + 1);
			expect(result).not.toBeNull();
			expect(result!.action.type).toBe('CREATE_SCENE');
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = addScene(game, 'non-existent', 'any');

			expect(result).toBeNull();
		});

		it('should return null if event not found', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const result = addScene(game, periodId, 'non-existent');

			expect(result).toBeNull();
		});
	});

	describe('deletePeriod', () => {
		it('should delete a period', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const originalLength = game.periods.length;

			const result = deletePeriod(game, periodId);

			expect(game.periods).toHaveLength(originalLength - 1);
			expect(game.periods.find((p) => p.id === periodId)).toBeUndefined();
			expect(result).not.toBeNull();
			expect(result!.action.type).toBe('DELETE_PERIOD');
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = deletePeriod(game, 'non-existent');

			expect(result).toBeNull();
		});

		it('should store deleted period data in action for undo', () => {
			const game = createPopulatedGame();
			const period = game.periods[0];
			const periodId = period.id;

			const result = deletePeriod(game, periodId);

			expect(result!.action.type).toBe('DELETE_PERIOD');
			if (result!.action.type === 'DELETE_PERIOD') {
				expect(result!.action.period.name).toBe(period.name);
				expect(result!.action.index).toBe(0);
			}
		});
	});

	describe('deleteEvent', () => {
		it('should delete an event', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const eventId = game.periods[0].events[0].id;
			const originalLength = game.periods[0].events.length;

			const result = deleteEvent(game, periodId, eventId);

			expect(game.periods[0].events).toHaveLength(originalLength - 1);
			expect(result).not.toBeNull();
			expect(result!.action.type).toBe('DELETE_EVENT');
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = deleteEvent(game, 'non-existent', 'any');

			expect(result).toBeNull();
		});

		it('should return null if event not found', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const result = deleteEvent(game, periodId, 'non-existent');

			expect(result).toBeNull();
		});
	});

	describe('deleteScene', () => {
		it('should delete a scene', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const eventId = game.periods[0].events[0].id;
			const sceneId = game.periods[0].events[0].scenes[0].id;
			const originalLength = game.periods[0].events[0].scenes.length;

			const result = deleteScene(game, periodId, eventId, sceneId);

			expect(game.periods[0].events[0].scenes).toHaveLength(originalLength - 1);
			expect(result).not.toBeNull();
			expect(result!.action.type).toBe('DELETE_SCENE');
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = deleteScene(game, 'non-existent', 'any', 'any');

			expect(result).toBeNull();
		});
	});

	describe('editPeriod', () => {
		it('should edit a period name', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;

			const result = editPeriod(game, periodId, { name: 'Updated Period' });

			expect(game.periods[0].name).toBe('Updated Period');
			expect(result).not.toBeNull();
			expect(result!.action.type).toBe('EDIT_PERIOD');
		});

		it('should store previous values in action', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const originalName = game.periods[0].name;

			const result = editPeriod(game, periodId, { name: 'Updated Period' });

			if (result!.action.type === 'EDIT_PERIOD') {
				expect(result!.action.previousValues.name).toBe(originalName);
				expect(result!.action.newValues.name).toBe('Updated Period');
			}
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = editPeriod(game, 'non-existent', { name: 'Test' });

			expect(result).toBeNull();
		});

		it('should update updatedAt timestamp', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;

			// Set a known old timestamp
			game.periods[0].updatedAt = '2020-01-01T00:00:00.000Z';

			editPeriod(game, periodId, { name: 'Updated' });

			// Should have a newer timestamp
			expect(new Date(game.periods[0].updatedAt).getTime()).toBeGreaterThan(
				new Date('2020-01-01T00:00:00.000Z').getTime()
			);
		});
	});

	describe('editEvent', () => {
		it('should edit an event', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const eventId = game.periods[0].events[0].id;

			const result = editEvent(game, periodId, eventId, { name: 'Updated Event' });

			expect(game.periods[0].events[0].name).toBe('Updated Event');
			expect(result).not.toBeNull();
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = editEvent(game, 'non-existent', 'any', { name: 'Test' });

			expect(result).toBeNull();
		});
	});

	describe('editScene', () => {
		it('should edit a scene', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const eventId = game.periods[0].events[0].id;
			const sceneId = game.periods[0].events[0].scenes[0].id;

			const result = editScene(game, periodId, eventId, sceneId, { name: 'Updated Scene' });

			expect(game.periods[0].events[0].scenes[0].name).toBe('Updated Scene');
			expect(result).not.toBeNull();
		});
	});

	describe('reorderPeriods', () => {
		it('should reorder periods', () => {
			const game = createPopulatedGame();
			const originalOrder = game.periods.map((p) => p.id);

			const result = reorderPeriods(game, 0, 2);

			expect(game.periods[2].id).toBe(originalOrder[0]);
			expect(result).not.toBeNull();
			expect(result!.action.type).toBe('REORDER_PERIODS');
		});

		it('should return null if indices are the same', () => {
			const game = createPopulatedGame();
			const result = reorderPeriods(game, 1, 1);

			expect(result).toBeNull();
		});

		it('should store previous and new order in action', () => {
			const game = createPopulatedGame();
			const originalOrder = game.periods.map((p) => p.id);

			const result = reorderPeriods(game, 0, 2);

			if (result!.action.type === 'REORDER_PERIODS') {
				expect(result!.action.previousOrder).toEqual(originalOrder);
				expect(result!.action.newOrder[2]).toBe(originalOrder[0]);
			}
		});
	});

	describe('reorderEvents', () => {
		it('should reorder events within a period', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const originalOrder = game.periods[0].events.map((e) => e.id);

			const result = reorderEvents(game, periodId, 0, 1);

			expect(game.periods[0].events[1].id).toBe(originalOrder[0]);
			expect(result).not.toBeNull();
		});

		it('should return null if period not found', () => {
			const game = createPopulatedGame();
			const result = reorderEvents(game, 'non-existent', 0, 1);

			expect(result).toBeNull();
		});
	});

	describe('reorderScenes', () => {
		it('should reorder scenes within an event', () => {
			const game = createPopulatedGame();
			const periodId = game.periods[0].id;
			const eventId = game.periods[0].events[0].id;
			const originalOrder = game.periods[0].events[0].scenes.map((s) => s.id);

			const result = reorderScenes(game, periodId, eventId, 0, 1);

			expect(game.periods[0].events[0].scenes[1].id).toBe(originalOrder[0]);
			expect(result).not.toBeNull();
		});
	});

	describe('editGameMetadata', () => {
		it('should update game name', () => {
			const game = createTestGame();

			const result = editGameMetadata(game, { name: 'New Name' });

			expect(game.name).toBe('New Name');
			expect(result.action.type).toBe('EDIT_GAME_METADATA');
		});

		it('should update multiple fields', () => {
			const game = createTestGame();
			game.players = [{ id: '1', name: 'Player 1' }];

			const result = editGameMetadata(game, {
				name: 'New Name',
				activePlayerIndex: 0
			});

			expect(game.name).toBe('New Name');
			expect(game.activePlayerIndex).toBe(0);
			expect(result.action.type).toBe('EDIT_GAME_METADATA');
		});

		it('should store previous values for undo', () => {
			const game = createTestGame();
			const originalName = game.name;

			const result = editGameMetadata(game, { name: 'New Name' });

			if (result.action.type === 'EDIT_GAME_METADATA') {
				expect(result.action.previousValues.name).toBe(originalName);
				expect(result.action.newValues.name).toBe('New Name');
			}
		});
	});

	describe('Anchor Actions', () => {
		describe('createAnchor', () => {
			it('should create an anchor', () => {
				const game = createTestGame();

				const result = createAnchor(game, 'Test Anchor', 'A description');

				expect(game.anchors).toHaveLength(1);
				expect(game.anchors![0].name).toBe('Test Anchor');
				expect(game.anchors![0].description).toBe('A description');
				expect(result.action.type).toBe('CREATE_ANCHOR');
			});

			it('should initialize anchors array if not present', () => {
				const game = createTestGame();
				delete (game as Partial<Game>).anchors;

				createAnchor(game, 'Test Anchor');

				expect(game.anchors).toBeDefined();
				expect(game.anchors).toHaveLength(1);
			});
		});

		describe('editAnchor', () => {
			it('should edit an anchor', () => {
				const game = createTestGame();
				createAnchor(game, 'Original Name');
				const anchorId = game.anchors![0].id;

				const result = editAnchor(game, anchorId, 'Updated Name', 'New description');

				expect(game.anchors![0].name).toBe('Updated Name');
				expect(game.anchors![0].description).toBe('New description');
				expect(result).not.toBeNull();
			});

			it('should return null if anchor not found', () => {
				const game = createTestGame();
				const result = editAnchor(game, 'non-existent', 'Name');

				expect(result).toBeNull();
			});
		});

		describe('deleteAnchor', () => {
			it('should delete an anchor', () => {
				const game = createTestGame();
				createAnchor(game, 'Test Anchor');
				const anchorId = game.anchors![0].id;

				const result = deleteAnchor(game, anchorId);

				expect(game.anchors).toHaveLength(0);
				expect(result).not.toBeNull();
				expect(result!.action.type).toBe('DELETE_ANCHOR');
			});

			it('should clear currentAnchorId if deleted anchor was current', () => {
				const game = createTestGame();
				createAnchor(game, 'Test Anchor');
				const anchorId = game.anchors![0].id;
				game.currentAnchorId = anchorId;

				deleteAnchor(game, anchorId);

				expect(game.currentAnchorId).toBeNull();
			});
		});

		describe('setCurrentAnchor', () => {
			it('should set current anchor and create placement', () => {
				const game = createPopulatedGame();
				createAnchor(game, 'Test Anchor');
				const anchorId = game.anchors![0].id;
				const periodId = game.periods[0].id;

				const result = setCurrentAnchor(game, anchorId, periodId);

				expect(game.currentAnchorId).toBe(anchorId);
				expect(game.anchorPlacements).toHaveLength(1);
				expect(game.anchorPlacements![0].anchorId).toBe(anchorId);
				expect(game.anchorPlacements![0].periodId).toBe(periodId);
				expect(result).not.toBeNull();
				expect(result!.wasAlreadyPlaced).toBe(false);
				expect(result!.action).toBeDefined();
			});

			it('should not duplicate placement if already placed on same period', () => {
				const game = createPopulatedGame();
				createAnchor(game, 'Test Anchor');
				const anchorId = game.anchors![0].id;
				const periodId = game.periods[0].id;

				setCurrentAnchor(game, anchorId, periodId);
				const result = setCurrentAnchor(game, anchorId, periodId);

				expect(game.anchorPlacements).toHaveLength(1);
				expect(result!.wasAlreadyPlaced).toBe(true);
				// No action because anchor is already placed and active
				expect(result!.action).toBeUndefined();
			});
		});

		describe('clearCurrentAnchor', () => {
			it('should clear current anchor', () => {
				const game = createTestGame();
				createAnchor(game, 'Test Anchor');
				game.currentAnchorId = game.anchors![0].id;

				const result = clearCurrentAnchor(game);

				expect(game.currentAnchorId).toBeNull();
				expect(result).not.toBeNull();
				expect(result!.action.type).toBe('CLEAR_CURRENT_ANCHOR');
			});

			it('should return null if no current anchor', () => {
				const game = createTestGame();
				game.currentAnchorId = null;

				const result = clearCurrentAnchor(game);

				expect(result).toBeNull();
			});
		});
	});
});
