import { describe, it, expect } from 'vitest';
import {
	SCHEMA_VERSION,
	createNewGame,
	createNewPeriod,
	createNewEvent,
	createNewScene,
	createNewLegacy,
	createNewFocus,
	getGameMetadata
} from './game';
import type { Game } from './game';

describe('Game Types', () => {
	describe('createNewGame', () => {
		it('should create a new game with the given name', () => {
			const game = createNewGame('Test Game');

			expect(game.name).toBe('Test Game');
			expect(game.id).toBeDefined();
			expect(game.id).toHaveLength(36); // UUID length
			expect(game.schemaVersion).toBe(SCHEMA_VERSION);
			expect(game.periods).toEqual([]);
			expect(game.legacies).toEqual([]);
			expect(game.createdAt).toBeDefined();
			expect(game.updatedAt).toBeDefined();
		});

		it('should create unique IDs for each game', () => {
			const game1 = createNewGame('Game 1');
			const game2 = createNewGame('Game 2');

			expect(game1.id).not.toBe(game2.id);
		});

		it('should set timestamps to ISO format', () => {
			const game = createNewGame('Test Game');

			// ISO 8601 format check
			expect(() => new Date(game.createdAt)).not.toThrow();
			expect(() => new Date(game.updatedAt)).not.toThrow();
		});

		it('should trim whitespace from name', () => {
			const game = createNewGame('  Test Game  ');
			expect(game.name).toBe('Test Game');
		});

		it('should throw error for empty name', () => {
			expect(() => createNewGame('')).toThrow('Game name cannot be empty');
		});

		it('should throw error for whitespace-only name', () => {
			expect(() => createNewGame('   ')).toThrow('Game name cannot be empty');
		});
	});

	describe('createNewPeriod', () => {
		it('should create a new period with default light tone', () => {
			const period = createNewPeriod('Test Period');

			expect(period.name).toBe('Test Period');
			expect(period.tone).toBe('light');
			expect(period.events).toEqual([]);
			expect(period.id).toBeDefined();
		});

		it('should accept a specified tone', () => {
			const period = createNewPeriod('Dark Period', 'dark');

			expect(period.tone).toBe('dark');
		});
	});

	describe('createNewEvent', () => {
		it('should create a new event with default light tone', () => {
			const event = createNewEvent('Test Event');

			expect(event.name).toBe('Test Event');
			expect(event.tone).toBe('light');
			expect(event.scenes).toEqual([]);
			expect(event.id).toBeDefined();
		});

		it('should accept a specified tone', () => {
			const event = createNewEvent('Dark Event', 'dark');

			expect(event.tone).toBe('dark');
		});
	});

	describe('createNewScene', () => {
		it('should create a new scene with default light tone', () => {
			const scene = createNewScene('Test Scene');

			expect(scene.name).toBe('Test Scene');
			expect(scene.tone).toBe('light');
			expect(scene.id).toBeDefined();
		});

		it('should accept a specified tone', () => {
			const scene = createNewScene('Dark Scene', 'dark');

			expect(scene.tone).toBe('dark');
		});
	});

	describe('createNewLegacy', () => {
		it('should create a new legacy', () => {
			const legacy = createNewLegacy('Test Legacy');

			expect(legacy.name).toBe('Test Legacy');
			expect(legacy.id).toBeDefined();
		});
	});

	describe('createNewFocus', () => {
		it('should create a new focus', () => {
			const focus = createNewFocus('Test Focus');

			expect(focus.name).toBe('Test Focus');
			expect(focus.id).toBeDefined();
		});
	});

	describe('getGameMetadata', () => {
		it('should extract metadata from a game', () => {
			const game = createNewGame('Test Game');
			const metadata = getGameMetadata(game);

			expect(metadata.id).toBe(game.id);
			expect(metadata.name).toBe(game.name);
			expect(metadata.createdAt).toBe(game.createdAt);
			expect(metadata.updatedAt).toBe(game.updatedAt);
		});

		it('should not include full game data in metadata', () => {
			const game = createNewGame('Test Game');
			const metadata = getGameMetadata(game) as unknown as Game;

			// These properties should not exist on metadata
			expect((metadata as { periods?: unknown }).periods).toBeUndefined();
			expect((metadata as { legacies?: unknown }).legacies).toBeUndefined();
			expect((metadata as { schemaVersion?: unknown }).schemaVersion).toBeUndefined();
		});
	});

	describe('SCHEMA_VERSION', () => {
		it('should be a positive integer', () => {
			expect(SCHEMA_VERSION).toBeGreaterThan(0);
			expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
		});
	});
});
