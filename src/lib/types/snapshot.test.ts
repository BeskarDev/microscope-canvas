/**
 * Tests for snapshot types and functions
 */

import { describe, it, expect } from 'vitest';
import {
	createSnapshot,
	getSnapshotMetadata,
	areGamesEqual,
	generateChangeSummary,
	DEFAULT_SNAPSHOT_LIMIT
} from './snapshot';
import { createNewGame, createNewPeriod, createNewEvent, createNewScene } from './game';
import type { Game } from './game';

// Helper to create a populated game
function createPopulatedGame(): Game {
	const game = createNewGame('Test Game');

	for (let i = 0; i < 2; i++) {
		const period = createNewPeriod(`Period ${i + 1}`);
		const event = createNewEvent(`Event ${i + 1}`);
		const scene = createNewScene(`Scene ${i + 1}`);

		event.scenes.push(scene);
		period.events.push(event);
		game.periods.push(period);
	}

	return game;
}

describe('Snapshot Types', () => {
	describe('DEFAULT_SNAPSHOT_LIMIT', () => {
		it('should be a positive integer', () => {
			expect(DEFAULT_SNAPSHOT_LIMIT).toBeGreaterThan(0);
			expect(Number.isInteger(DEFAULT_SNAPSHOT_LIMIT)).toBe(true);
		});
	});

	describe('createSnapshot', () => {
		it('should create a snapshot with unique ID', () => {
			const game = createPopulatedGame();

			const snapshot = createSnapshot(game);

			expect(snapshot.id).toBeDefined();
			expect(snapshot.id).toHaveLength(36); // UUID length
		});

		it('should reference the game ID', () => {
			const game = createPopulatedGame();

			const snapshot = createSnapshot(game);

			expect(snapshot.gameId).toBe(game.id);
		});

		it('should include timestamp', () => {
			const game = createPopulatedGame();

			const snapshot = createSnapshot(game);

			expect(snapshot.timestamp).toBeDefined();
			expect(() => new Date(snapshot.timestamp)).not.toThrow();
		});

		it('should deep clone game data', () => {
			const game = createPopulatedGame();

			const snapshot = createSnapshot(game);
			game.name = 'Modified Name';

			expect(snapshot.data.name).toBe('Test Game');
			expect(snapshot.data.name).not.toBe(game.name);
		});

		it('should include optional version name', () => {
			const game = createPopulatedGame();

			const snapshot = createSnapshot(game, 'Version 1.0');

			expect(snapshot.versionName).toBe('Version 1.0');
		});

		it('should include optional change summary', () => {
			const game = createPopulatedGame();

			const snapshot = createSnapshot(game, 'v1', 'Initial version');

			expect(snapshot.changeSummary).toBe('Initial version');
		});

		it('should create unique IDs for each snapshot', () => {
			const game = createPopulatedGame();

			const snapshot1 = createSnapshot(game);
			const snapshot2 = createSnapshot(game);

			expect(snapshot1.id).not.toBe(snapshot2.id);
		});
	});

	describe('getSnapshotMetadata', () => {
		it('should extract metadata from snapshot', () => {
			const game = createPopulatedGame();
			const snapshot = createSnapshot(game, 'v1', 'Changes');

			const metadata = getSnapshotMetadata(snapshot);

			expect(metadata.id).toBe(snapshot.id);
			expect(metadata.gameId).toBe(snapshot.gameId);
			expect(metadata.timestamp).toBe(snapshot.timestamp);
			expect(metadata.gameName).toBe(game.name);
			expect(metadata.versionName).toBe('v1');
			expect(metadata.changeSummary).toBe('Changes');
		});

		it('should extract game name from snapshot data', () => {
			const game = createPopulatedGame();
			game.name = 'Unique Game Name';
			const snapshot = createSnapshot(game);

			const metadata = getSnapshotMetadata(snapshot);

			expect(metadata.gameName).toBe('Unique Game Name');
		});
	});

	describe('areGamesEqual', () => {
		it('should return true for identical games', () => {
			const game1 = createPopulatedGame();
			const game2 = JSON.parse(JSON.stringify(game1)) as Game;

			expect(areGamesEqual(game1, game2)).toBe(true);
		});

		it('should return false for games with different names', () => {
			const game1 = createPopulatedGame();
			const game2 = JSON.parse(JSON.stringify(game1)) as Game;
			game2.name = 'Different Name';

			expect(areGamesEqual(game1, game2)).toBe(false);
		});

		it('should return false for games with different periods', () => {
			const game1 = createPopulatedGame();
			const game2 = JSON.parse(JSON.stringify(game1)) as Game;
			game2.periods.push(createNewPeriod('New Period'));

			expect(areGamesEqual(game1, game2)).toBe(false);
		});

		it('should ignore timestamp differences', () => {
			const game1 = createPopulatedGame();
			const game2 = JSON.parse(JSON.stringify(game1)) as Game;
			game2.createdAt = '2020-01-01T00:00:00.000Z';
			game2.updatedAt = '2020-01-01T00:00:00.000Z';

			expect(areGamesEqual(game1, game2)).toBe(true);
		});
	});

	describe('generateChangeSummary', () => {
		it('should return "Initial version" for null old game', () => {
			const game = createPopulatedGame();

			const summary = generateChangeSummary(null, game);

			expect(summary).toBe('Initial version');
		});

		it('should detect name change', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			newGame.name = 'New Name';

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Renamed game');
			expect(summary).toContain('New Name');
		});

		it('should detect focus change', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			newGame.focus = { id: 'focus-1', name: 'Technology' };

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Focus: Technology');
		});

		it('should detect added periods', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			const newPeriod = createNewPeriod('New Period');
			newGame.periods.push(newPeriod);

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Added 1 period');
			expect(summary).toContain('New Period');
		});

		it('should detect multiple added periods', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			newGame.periods.push(createNewPeriod('Period A'));
			newGame.periods.push(createNewPeriod('Period B'));

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Added 2 periods');
		});

		it('should detect removed periods', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			newGame.periods = newGame.periods.slice(1);

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Removed 1 period');
		});

		it('should detect added events', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			const newEvent = createNewEvent('New Event');
			newGame.periods[0].events.push(newEvent);

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Added 1 event');
		});

		it('should detect removed events', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			newGame.periods[0].events = [];

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Removed 1 event');
		});

		it('should detect added scenes', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			const newScene = createNewScene('New Scene');
			newGame.periods[0].events[0].scenes.push(newScene);

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Added 1 scene');
		});

		it('should detect removed scenes', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			newGame.periods[0].events[0].scenes = [];

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toContain('Removed 1 scene');
		});

		it('should return "Various edits" when no specific changes detected', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;
			// Just change something minor like a period description
			newGame.periods[0].description = 'New description';

			const summary = generateChangeSummary(oldGame, newGame);

			expect(summary).toBe('Various edits');
		});

		it('should truncate long summaries', () => {
			const oldGame = createPopulatedGame();
			const newGame = JSON.parse(JSON.stringify(oldGame)) as Game;

			// Make many changes
			newGame.name = 'New Name';
			newGame.focus = { id: 'f', name: 'Focus' };
			newGame.periods.push(createNewPeriod('P1'));
			newGame.periods.push(createNewPeriod('P2'));
			newGame.periods[0].events.push(createNewEvent('E1'));
			newGame.periods[0].events.push(createNewEvent('E2'));

			const summary = generateChangeSummary(oldGame, newGame);

			// Should end with ... if truncated
			expect(summary).toContain('...');
		});
	});
});
