/**
 * Tests for import/export functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	exportGameToJSON,
	exportGameToMarkdown,
	parseGameJSON,
	parseGameExportJSON,
	createGameFromImport,
	createGameAndHistoryFromImport,
	ImportError,
	isJSONFile,
	readFileAsText
} from './import-export';
import { createNewGame, createNewPeriod, createNewEvent, createNewScene, SCHEMA_VERSION } from '$lib/types';
import type { Game, GameSnapshot } from '$lib/types';

// Helper to create a populated game
function createPopulatedGame(): Game {
	const game = createNewGame('Test History');
	game.bigPicture = { premise: 'A test premise' };
	game.palette = { yes: ['Magic'], no: ['Guns'] };
	game.legacies = [{ id: 'legacy-1', name: 'The Order' }];
	game.focuses = [{ id: 'focus-1', name: 'Power' }];
	game.currentFocusIndex = 0;
	game.players = [{ id: 'player-1', name: 'Alice' }];
	game.activePlayerIndex = 0;
	game.anchors = [{ id: 'anchor-1', name: 'The Hero', createdAt: '', updatedAt: '' }];

	const period = createNewPeriod('The Beginning', 'light');
	period.description = 'A time of peace';

	const event = createNewEvent('First Contact', 'dark');
	event.description = 'They arrived';

	const scene = createNewScene('The Meeting', 'light');
	scene.question = 'What did they want?';
	scene.answer = 'Peace';

	event.scenes.push(scene);
	period.events.push(event);
	game.periods.push(period);

	return game;
}

// Helper to create a snapshot
function createTestSnapshot(game: Game): GameSnapshot {
	return {
		id: 'snapshot-1',
		gameId: game.id,
		timestamp: new Date().toISOString(),
		data: game,
		versionName: 'Version 1',
		changeSummary: 'Initial version'
	};
}

describe('Import/Export', () => {
	describe('exportGameToJSON', () => {
		it('should export game to valid JSON', () => {
			const game = createPopulatedGame();

			const json = exportGameToJSON(game);

			expect(() => JSON.parse(json)).not.toThrow();
		});

		it('should include schema version', () => {
			const game = createPopulatedGame();

			const json = exportGameToJSON(game);
			const parsed = JSON.parse(json);

			expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
		});

		it('should include exportedAt timestamp', () => {
			const game = createPopulatedGame();

			const json = exportGameToJSON(game);
			const parsed = JSON.parse(json);

			expect(parsed.exportedAt).toBeDefined();
			expect(() => new Date(parsed.exportedAt)).not.toThrow();
		});

		it('should include all game data', () => {
			const game = createPopulatedGame();

			const json = exportGameToJSON(game);
			const parsed = JSON.parse(json);

			expect(parsed.name).toBe('Test History');
			expect(parsed.bigPicture.premise).toBe('A test premise');
			expect(parsed.periods).toHaveLength(1);
			expect(parsed.periods[0].events).toHaveLength(1);
		});

		it('should include history when provided', () => {
			const game = createPopulatedGame();
			const snapshot = createTestSnapshot(game);

			const json = exportGameToJSON(game, [snapshot]);
			const parsed = JSON.parse(json);

			expect(parsed.history).toHaveLength(1);
			expect(parsed.history[0].versionName).toBe('Version 1');
		});

		it('should not include history when not provided', () => {
			const game = createPopulatedGame();

			const json = exportGameToJSON(game);
			const parsed = JSON.parse(json);

			expect(parsed.history).toBeUndefined();
		});
	});

	describe('exportGameToMarkdown', () => {
		it('should export game to valid markdown', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('# Test History');
		});

		it('should include big picture', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('## Big Picture');
			expect(markdown).toContain('A test premise');
		});

		it('should include palette', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('## Palette');
			expect(markdown).toContain('Magic');
			expect(markdown).toContain('Guns');
		});

		it('should include legacies', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('## Legacies');
			expect(markdown).toContain('The Order');
		});

		it('should include periods with tone indicators', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('### ○ The Beginning'); // ○ for light
		});

		it('should include events and scenes', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('First Contact');
			expect(markdown).toContain('The Meeting');
		});

		it('should include scene questions and answers', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('What did they want?');
			expect(markdown).toContain('Peace');
		});

		it('should include players', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('## Players');
			expect(markdown).toContain('Alice');
		});

		it('should include focuses', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('## Focuses');
			expect(markdown).toContain('Power');
		});

		it('should include anchors', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('## Anchors');
			expect(markdown).toContain('The Hero');
		});

		it('should include export footer', () => {
			const game = createPopulatedGame();

			const markdown = exportGameToMarkdown(game);

			expect(markdown).toContain('Exported from Microscope Canvas');
		});
	});

	describe('parseGameJSON', () => {
		it('should parse valid game JSON', () => {
			const game = createPopulatedGame();
			const json = exportGameToJSON(game);

			const parsed = parseGameJSON(json);

			expect(parsed.name).toBe('Test History');
		});

		it('should throw ImportError for invalid JSON', () => {
			expect(() => parseGameJSON('not valid json')).toThrow(ImportError);
			expect(() => parseGameJSON('not valid json')).toThrow('invalid JSON');
		});

		it('should throw ImportError for missing required fields', () => {
			const invalidData = JSON.stringify({ name: 'Test' });

			expect(() => parseGameJSON(invalidData)).toThrow(ImportError);
			expect(() => parseGameJSON(invalidData)).toThrow('missing required');
		});

		it('should throw ImportError for newer schema version', () => {
			const game = createPopulatedGame();
			const json = exportGameToJSON(game);
			const parsed = JSON.parse(json);
			parsed.schemaVersion = SCHEMA_VERSION + 100;
			const modifiedJson = JSON.stringify(parsed);

			expect(() => parseGameJSON(modifiedJson)).toThrow(ImportError);
			expect(() => parseGameJSON(modifiedJson)).toThrow('newer version');
		});

		it('should handle legacy data without schema version', () => {
			const legacyData = {
				id: 'legacy-id',
				name: 'Legacy Game',
				periods: [],
				legacies: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			const parsed = parseGameJSON(JSON.stringify(legacyData));

			expect(parsed.name).toBe('Legacy Game');
			// Should have migrated anchor fields
			expect(parsed.anchors).toBeDefined();
		});
	});

	describe('parseGameExportJSON', () => {
		it('should parse game and extract history', () => {
			const game = createPopulatedGame();
			const snapshot = createTestSnapshot(game);
			const json = exportGameToJSON(game, [snapshot]);

			const result = parseGameExportJSON(json);

			expect(result.game.name).toBe('Test History');
			expect(result.history).toHaveLength(1);
		});

		it('should return empty history array when no history', () => {
			const game = createPopulatedGame();
			const json = exportGameToJSON(game);

			const result = parseGameExportJSON(json);

			expect(result.history).toEqual([]);
		});
	});

	describe('createGameFromImport', () => {
		it('should create new game with fresh ID', () => {
			const originalGame = createPopulatedGame();
			const originalId = originalGame.id;

			const imported = createGameFromImport(originalGame);

			expect(imported.id).not.toBe(originalId);
			expect(imported.name).toBe(originalGame.name);
		});

		it('should update timestamps', () => {
			const originalGame = createPopulatedGame();
			originalGame.createdAt = '2020-01-01T00:00:00.000Z';

			const imported = createGameFromImport(originalGame);

			expect(new Date(imported.createdAt).getTime()).toBeGreaterThan(
				new Date('2020-01-01T00:00:00.000Z').getTime()
			);
		});

		it('should set current schema version', () => {
			const originalGame = createPopulatedGame();
			(originalGame as Game & { schemaVersion: number }).schemaVersion = 1;

			const imported = createGameFromImport(originalGame);

			expect(imported.schemaVersion).toBe(SCHEMA_VERSION);
		});
	});

	describe('createGameAndHistoryFromImport', () => {
		it('should remap game and history IDs', () => {
			const originalGame = createPopulatedGame();
			const originalId = originalGame.id;
			const snapshot = createTestSnapshot(originalGame);

			const result = createGameAndHistoryFromImport(originalGame, [snapshot]);

			expect(result.game.id).not.toBe(originalId);
			expect(result.history[0].gameId).toBe(result.game.id);
			expect(result.history[0].id).not.toBe(snapshot.id);
		});

		it('should update snapshot data game IDs', () => {
			const originalGame = createPopulatedGame();
			const snapshot = createTestSnapshot(originalGame);

			const result = createGameAndHistoryFromImport(originalGame, [snapshot]);

			expect(result.history[0].data.id).toBe(result.game.id);
		});
	});

	describe('isJSONFile', () => {
		it('should return true for .json extension', () => {
			const file = new File(['{}'], 'test.json', { type: 'application/json' });
			expect(isJSONFile(file)).toBe(true);
		});

		it('should return true for JSON mime type', () => {
			const file = new File(['{}'], 'test', { type: 'application/json' });
			expect(isJSONFile(file)).toBe(true);
		});

		it('should return false for non-JSON files', () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' });
			expect(isJSONFile(file)).toBe(false);
		});
	});

	describe('readFileAsText', () => {
		it('should read file content as text', async () => {
			const content = '{"test": "value"}';
			const file = new File([content], 'test.json');

			const result = await readFileAsText(file);

			expect(result).toBe(content);
		});
	});

	describe('ImportError', () => {
		it('should have correct error code', () => {
			const error = new ImportError('Test message', 'INVALID_JSON');

			expect(error.code).toBe('INVALID_JSON');
			expect(error.name).toBe('ImportError');
		});
	});
});
