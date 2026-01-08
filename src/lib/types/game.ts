/**
 * Core game data types for Microscope Canvas
 * These types define the canonical data model for game persistence
 */

/**
 * Current schema version for game data
 * Increment when making breaking changes to the schema
 * v2: Added anchor cards support (Microscope Chronicle)
 */
export const SCHEMA_VERSION = 2;

/**
 * Tone represents the emotional quality of a period, event, or scene
 * Light = positive/hopeful, Dark = negative/tragic
 */
export type Tone = 'light' | 'dark';

/**
 * A Focus is a theme or element the current player wants to explore
 */
export interface Focus {
	id: string;
	name: string;
	description?: string;
}

/**
 * A Player represents a participant in the game
 */
export interface Player {
	id: string;
	name: string;
}

/**
 * A Legacy is a recurring element that persists through history
 * (character, place, organization, etc.)
 */
export interface Legacy {
	id: string;
	name: string;
	description?: string;
}

/**
 * An Anchor is a character used to focus gameplay in Microscope Chronicle
 * Anchors are distinct from Legacies - they represent specific characters
 * that are chosen to focus the current round of play
 */
export interface Anchor {
	id: string;
	name: string;
	description?: string;
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
}

/**
 * An AnchorPlacement tracks when and where an anchor was used
 * Multiple placements can exist on a single Period
 */
export interface AnchorPlacement {
	id: string;
	anchorId: string; // Reference to Anchor
	periodId: string; // Period this anchor is placed on
	roundNumber?: number; // Optional round tracking
	notes?: string;
	createdAt: string; // ISO 8601 timestamp
}

/**
 * A Scene is a specific moment within an Event
 * Scenes explore details, conversations, and turning points
 */
export interface Scene {
	id: string;
	name: string;
	tone: Tone;
	description?: string;
	question?: string; // The question the scene aims to answer
	answer?: string; // The answer discovered through the scene
	notes?: string;
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
}

/**
 * An Event is a significant occurrence within a Period
 * Events shape the narrative and can be Light or Dark
 */
export interface Event {
	id: string;
	name: string;
	tone: Tone;
	description?: string;
	notes?: string;
	scenes: Scene[];
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
}

/**
 * A Period represents a large span of time (era, age)
 * Periods define major phases of history
 */
export interface Period {
	id: string;
	name: string;
	tone: Tone;
	description?: string;
	notes?: string;
	events: Event[];
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
}

/**
 * The Big Picture defines the overarching theme/premise of the history
 */
export interface BigPicture {
	premise: string;
	bookendStart?: string; // Description of the starting period
	bookendEnd?: string; // Description of the ending period
}

/**
 * The Palette defines what is and isn't allowed in the history
 */
export interface Palette {
	yes: string[]; // Things explicitly allowed
	no: string[]; // Things explicitly banned
}

/**
 * The root Game object containing all game data
 */
export interface Game {
	id: string;
	schemaVersion: number;
	name: string;
	bigPicture?: BigPicture;
	palette?: Palette;
	/** List of all focuses for the game */
	focuses: Focus[];
	/** Index of the current focus in the focuses array (-1 if none) */
	currentFocusIndex: number;
	/** Current focus (deprecated - use focuses and currentFocusIndex) */
	focus?: Focus;
	/** List of players in the game */
	players: Player[];
	/** Index of the active player in the players array (-1 if none) */
	activePlayerIndex: number;
	legacies: Legacy[];
	periods: Period[];
	/** List of anchor characters for Chronicle play */
	anchors: Anchor[];
	/** ID of the currently active anchor (null if none) */
	currentAnchorId: string | null;
	/** List of anchor placements tracking where anchors have been used */
	anchorPlacements: AnchorPlacement[];
	createdAt: string; // ISO 8601 timestamp
	updatedAt: string; // ISO 8601 timestamp
}

/**
 * Metadata for a game (used in game list)
 */
export interface GameMetadata {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Creates a new empty game with the given name
 * @param name The name for the new game (must not be empty)
 * @throws Error if name is empty or just whitespace
 */
export function createNewGame(name: string): Game {
	const trimmedName = name.trim();
	if (!trimmedName) {
		throw new Error('Game name cannot be empty');
	}

	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		schemaVersion: SCHEMA_VERSION,
		name: trimmedName,
		focuses: [],
		currentFocusIndex: -1,
		players: [],
		activePlayerIndex: -1,
		legacies: [],
		periods: [],
		anchors: [],
		currentAnchorId: null,
		anchorPlacements: [],
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Creates a new period with default values
 */
export function createNewPeriod(name: string, tone: Tone = 'light'): Period {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name,
		tone,
		events: [],
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Creates a new event with default values
 */
export function createNewEvent(name: string, tone: Tone = 'light'): Event {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name,
		tone,
		scenes: [],
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Creates a new scene with default values
 */
export function createNewScene(name: string, tone: Tone = 'light'): Scene {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name,
		tone,
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Creates a new legacy
 */
export function createNewLegacy(name: string): Legacy {
	return {
		id: crypto.randomUUID(),
		name
	};
}

/**
 * Creates a new focus
 */
export function createNewFocus(name: string): Focus {
	return {
		id: crypto.randomUUID(),
		name
	};
}

/**
 * Creates a new player
 */
export function createNewPlayer(name: string): Player {
	return {
		id: crypto.randomUUID(),
		name
	};
}

/**
 * Creates a new anchor character
 */
export function createNewAnchor(name: string, description?: string): Anchor {
	const now = new Date().toISOString();
	return {
		id: crypto.randomUUID(),
		name,
		description,
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Creates a new anchor placement
 */
export function createAnchorPlacement(
	anchorId: string,
	periodId: string,
	options?: { roundNumber?: number; notes?: string }
): AnchorPlacement {
	return {
		id: crypto.randomUUID(),
		anchorId,
		periodId,
		roundNumber: options?.roundNumber,
		notes: options?.notes,
		createdAt: new Date().toISOString()
	};
}

/**
 * Extracts metadata from a game object
 */
export function getGameMetadata(game: Game): GameMetadata {
	return {
		id: game.id,
		name: game.name,
		createdAt: game.createdAt,
		updatedAt: game.updatedAt
	};
}
