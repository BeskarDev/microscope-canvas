/**
 * Import/Export functionality for Microscope Canvas
 * Handles JSON and Markdown export, and JSON import
 */

import type { Game, Period, Event, Scene } from '$lib/types';
import { SCHEMA_VERSION } from '$lib/types';

/**
 * Sanitizes a filename by removing or replacing invalid characters
 */
function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
		.replace(/\s+/g, '-') // Replace spaces with dashes
		.toLowerCase()
		.slice(0, 50); // Limit length
}

/**
 * Exports a game to JSON format
 */
export function exportGameToJSON(game: Game): string {
	// Create a clean copy with schema version
	const exportData = {
		...JSON.parse(JSON.stringify(game)),
		schemaVersion: SCHEMA_VERSION,
		exportedAt: new Date().toISOString()
	};

	return JSON.stringify(exportData, null, 2);
}

/**
 * Downloads a file using the browser's download functionality
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Exports and downloads a game as JSON
 */
export function downloadGameAsJSON(game: Game): void {
	const json = exportGameToJSON(game);
	const filename = `${sanitizeFilename(game.name)}-export.json`;
	downloadFile(json, filename, 'application/json');
}

/**
 * Formats tone for Markdown display
 */
function formatTone(tone: 'light' | 'dark'): string {
	return tone === 'light' ? '☀ Light' : '🌑 Dark';
}

/**
 * Escapes special Markdown characters in text
 */
function escapeMarkdown(text: string | undefined): string {
	if (!text) return '';
	return text.replace(/([*_`#])/g, '\\$1');
}

/**
 * Formats a scene for Markdown output
 */
function formatScene(scene: Scene, indent: string): string[] {
	const lines: string[] = [];
	lines.push(`${indent}- **Scene: ${escapeMarkdown(scene.name)}** [${formatTone(scene.tone)}]`);

	if (scene.question) {
		lines.push(`${indent}  - Question: ${escapeMarkdown(scene.question)}`);
	}
	if (scene.answer) {
		lines.push(`${indent}  - Answer: ${escapeMarkdown(scene.answer)}`);
	}
	if (scene.description) {
		lines.push(`${indent}  - ${escapeMarkdown(scene.description)}`);
	}
	if (scene.notes) {
		lines.push(`${indent}  - *Notes: ${escapeMarkdown(scene.notes)}*`);
	}

	return lines;
}

/**
 * Formats an event for Markdown output
 */
function formatEvent(event: Event, indent: string): string[] {
	const lines: string[] = [];
	lines.push(`${indent}- **Event: ${escapeMarkdown(event.name)}** [${formatTone(event.tone)}]`);

	if (event.description) {
		lines.push(`${indent}  - ${escapeMarkdown(event.description)}`);
	}
	if (event.notes) {
		lines.push(`${indent}  - *Notes: ${escapeMarkdown(event.notes)}*`);
	}

	// Add scenes
	for (const scene of event.scenes) {
		lines.push(...formatScene(scene, `${indent}  `));
	}

	return lines;
}

/**
 * Formats a period for Markdown output
 */
function formatPeriod(period: Period): string[] {
	const lines: string[] = [];
	lines.push(`### ${escapeMarkdown(period.name)} [${formatTone(period.tone)}]`);
	lines.push('');

	if (period.description) {
		lines.push(escapeMarkdown(period.description));
		lines.push('');
	}
	if (period.notes) {
		lines.push(`*Notes: ${escapeMarkdown(period.notes)}*`);
		lines.push('');
	}

	// Add events
	for (const event of period.events) {
		lines.push(...formatEvent(event, ''));
	}

	if (period.events.length > 0) {
		lines.push('');
	}

	return lines;
}

/**
 * Exports a game to Markdown format
 */
export function exportGameToMarkdown(game: Game): string {
	const lines: string[] = [];

	// Title
	lines.push(`# ${escapeMarkdown(game.name)}`);
	lines.push('');

	// Big Picture
	if (game.bigPicture) {
		lines.push('## Big Picture');
		lines.push('');
		if (game.bigPicture.premise) {
			lines.push(`**Premise:** ${escapeMarkdown(game.bigPicture.premise)}`);
		}
		if (game.bigPicture.bookendStart) {
			lines.push(`**Beginning:** ${escapeMarkdown(game.bigPicture.bookendStart)}`);
		}
		if (game.bigPicture.bookendEnd) {
			lines.push(`**End:** ${escapeMarkdown(game.bigPicture.bookendEnd)}`);
		}
		lines.push('');
	}

	// Focus
	if (game.focus) {
		lines.push(`**Current Focus:** ${escapeMarkdown(game.focus.name)}`);
		if (game.focus.description) {
			lines.push(`> ${escapeMarkdown(game.focus.description)}`);
		}
		lines.push('');
	}

	// Legacies
	if (game.legacies.length > 0) {
		lines.push('## Legacies');
		lines.push('');
		for (const legacy of game.legacies) {
			lines.push(`- **${escapeMarkdown(legacy.name)}**`);
			if (legacy.description) {
				lines.push(`  - ${escapeMarkdown(legacy.description)}`);
			}
		}
		lines.push('');
	}

	// Palette
	if (game.palette && (game.palette.yes.length > 0 || game.palette.no.length > 0)) {
		lines.push('## Palette');
		lines.push('');
		if (game.palette.yes.length > 0) {
			lines.push('**Yes (Allowed):**');
			for (const item of game.palette.yes) {
				lines.push(`- ${escapeMarkdown(item)}`);
			}
		}
		if (game.palette.no.length > 0) {
			lines.push('');
			lines.push('**No (Banned):**');
			for (const item of game.palette.no) {
				lines.push(`- ${escapeMarkdown(item)}`);
			}
		}
		lines.push('');
	}

	// Timeline
	if (game.periods.length > 0) {
		lines.push('## Timeline');
		lines.push('');

		for (const period of game.periods) {
			lines.push(...formatPeriod(period));
		}
	}

	// Footer
	lines.push('---');
	lines.push(`*Exported from Microscope Canvas on ${new Date().toLocaleDateString()}*`);

	return lines.join('\n');
}

/**
 * Exports and downloads a game as Markdown
 */
export function downloadGameAsMarkdown(game: Game): void {
	const markdown = exportGameToMarkdown(game);
	const filename = `${sanitizeFilename(game.name)}-export.md`;
	downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Import error types
 */
export class ImportError extends Error {
	constructor(
		message: string,
		public readonly code: 'INVALID_JSON' | 'INVALID_SCHEMA' | 'MISSING_FIELDS' | 'UNKNOWN'
	) {
		super(message);
		this.name = 'ImportError';
	}
}

/**
 * Validates a game object has all required fields
 */
function validateGameStructure(data: unknown): data is Game {
	if (!data || typeof data !== 'object') return false;

	const obj = data as Record<string, unknown>;

	// Check required fields
	const requiredFields = ['id', 'name', 'periods', 'legacies', 'createdAt', 'updatedAt'];
	for (const field of requiredFields) {
		if (!(field in obj)) return false;
	}

	// Check arrays
	if (!Array.isArray(obj.periods)) return false;
	if (!Array.isArray(obj.legacies)) return false;

	return true;
}

/**
 * Parses and validates a JSON string as a game export
 */
export function parseGameJSON(jsonString: string): Game {
	let data: unknown;

	// Parse JSON
	try {
		data = JSON.parse(jsonString);
	} catch {
		throw new ImportError('The file contains invalid JSON. It may be corrupted.', 'INVALID_JSON');
	}

	// Validate structure
	if (!validateGameStructure(data)) {
		throw new ImportError(
			'The file is missing required game data. It may not be a valid Microscope Canvas export.',
			'MISSING_FIELDS'
		);
	}

	// Check schema version - data is now validated as Game type
	const gameData = data as Game;
	if (gameData.schemaVersion !== undefined && typeof gameData.schemaVersion === 'number') {
		if (gameData.schemaVersion > SCHEMA_VERSION) {
			throw new ImportError(
				`This file was created with a newer version of Microscope Canvas (schema v${gameData.schemaVersion}). Please update the app to import this file.`,
				'INVALID_SCHEMA'
			);
		}
		// Future: handle migrations for older schema versions here
	}

	return gameData;
}

/**
 * Creates a new game from imported data with a fresh ID
 */
export function createGameFromImport(importedGame: Game): Game {
	const now = new Date().toISOString();

	// Generate new IDs for everything to avoid conflicts
	const newId = crypto.randomUUID();

	// Deep clone and update IDs
	const newGame: Game = {
		...JSON.parse(JSON.stringify(importedGame)),
		id: newId,
		schemaVersion: SCHEMA_VERSION,
		createdAt: now,
		updatedAt: now
	};

	// Note: We preserve the internal IDs for periods/events/scenes
	// as they're only used within this game and don't conflict

	return newGame;
}

/**
 * Reads a file as text
 */
export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file as text'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
}

/**
 * Validates that a file is a JSON file
 */
export function isJSONFile(file: File): boolean {
	// Check by extension
	if (file.name.toLowerCase().endsWith('.json')) return true;

	// Check by MIME type
	if (file.type === 'application/json') return true;

	return false;
}
