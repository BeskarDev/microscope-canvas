/**
 * Name generators for periods, events, and scenes (100+ combinations each)
 * Uses combinatorial approach for maximum variety
 */

// Period name templates
export const PERIOD_PREFIXES = [
	'The Age of',
	'The Era of',
	'The Time of',
	'The Dawn of',
	'The Fall of',
	'The Rise of',
	'The End of',
	'The Beginning of',
	'The Season of',
	'The Year of',
	'The Reign of',
	'The Rule of',
	'The Dominion of',
	'The Empire of',
	'The Kingdom of',
	'The Republic of',
	'The Days of',
	'The Nights of',
	'The Long',
	'The Great',
	'The Golden',
	'The Dark',
	'The Silent',
	'The Burning',
	'The Frozen'
];

export const PERIOD_CORES = [
	'Light',
	'Shadow',
	'Change',
	'Division',
	'Unity',
	'Dreams',
	'War',
	'Peace',
	'Discovery',
	'Loss',
	'Flame',
	'Ice',
	'Iron',
	'Gold',
	'Blood',
	'Stone',
	'Stars',
	'Storms',
	'Silence',
	'Thunder',
	'Tears',
	'Joy',
	'Sorrow',
	'Hope',
	'Despair',
	'Faith',
	'Doubt',
	'Magic',
	'Reason',
	'Chaos',
	'Order',
	'Growth',
	'Decay',
	'Rebirth',
	'Endings'
];

// Event name templates
export const EVENT_OPENERS = [
	'When',
	'The Moment',
	'The Day',
	'The Night',
	'The Hour',
	'The Time'
];

export const EVENT_ACTIONS = [
	'Everything Changed',
	'Hope Died',
	'Hope Was Born',
	'The Walls Fell',
	'Fire Swept the Land',
	'The Old Ways Ended',
	'Strangers Arrived',
	'The Truth Emerged',
	'Silence Fell',
	'Thunder Spoke',
	'The Dead Rose',
	'The Living Wept',
	'The Sky Darkened',
	'The Light Returned',
	'The Waters Rose',
	'The Earth Shook',
	'The Winds Changed',
	'Time Stopped',
	'Fate Was Sealed',
	'Destiny Called'
];

export const EVENT_PREFIXES = [
	'The First',
	'The Last',
	'The Great',
	'The Hidden',
	'The Forgotten',
	'The Broken',
	'The Sacred',
	'The Final',
	'The Secret',
	'The Terrible',
	'The Glorious',
	'The Shameful',
	'The Legendary',
	'The Mythic',
	'The Historic',
	'The Infamous',
	'The Celebrated',
	'The Mourned',
	'The Silent',
	'The Screaming'
];

export const EVENT_NOUNS = [
	'War',
	'Peace',
	'Alliance',
	'Betrayal',
	'Discovery',
	'Sacrifice',
	'Journey',
	'Council',
	'Uprising',
	'Collapse',
	'Reunion',
	'Exodus',
	'Invasion',
	'Rebellion',
	'Revolution',
	'Coronation',
	'Execution',
	'Trial',
	'Wedding',
	'Funeral',
	'Festival',
	'Plague',
	'Miracle',
	'Catastrophe',
	'Breakthrough',
	'Revelation',
	'Convergence',
	'Sundering',
	'Awakening',
	'Reckoning'
];

// Scene name templates
export const SCENE_CONTEXTS = [
	'In the',
	'At the',
	'Before the',
	'After the',
	'During the',
	'Within the',
	'Beyond the',
	'Beneath the',
	'Above the',
	'Among the'
];

export const SCENE_LOCATIONS = [
	'throne room',
	'battlefield',
	'temple',
	'council chamber',
	'prison',
	'market square',
	'harbor',
	'forest edge',
	'mountain pass',
	'river crossing',
	'city gates',
	'royal court',
	'secret meeting',
	'funeral pyre',
	'wedding feast',
	'execution ground',
	'sacred grove',
	'ancient ruin',
	'hidden chamber',
	'public square',
	'private quarters',
	'war camp',
	'monastery',
	'tavern',
	'crossroads',
	'border',
	'siege',
	'ceremony',
	'trial',
	'celebration'
];

export const SCENE_DESCRIPTORS = [
	'Final',
	'First',
	'Secret',
	'Public',
	'Private',
	'Desperate',
	'Triumphant',
	'Tragic',
	'Fateful',
	'Crucial',
	'Pivotal',
	'Historic',
	'Legendary',
	'Forgotten',
	'Infamous',
	'Celebrated',
	'Mourned',
	'Silent',
	'Violent',
	'Peaceful'
];

export const SCENE_EVENTS = [
	'Confrontation',
	'Revelation',
	'Decision',
	'Betrayal',
	'Sacrifice',
	'Reunion',
	'Farewell',
	'Confession',
	'Accusation',
	'Judgment',
	'Plea',
	'Challenge',
	'Surrender',
	'Defiance',
	'Reconciliation',
	'Oath',
	'Promise',
	'Threat',
	'Bargain',
	'Choice'
];

/**
 * Generate a period name
 */
export function generatePeriodName(): string {
	const patterns = [
		() => {
			const prefix = PERIOD_PREFIXES[Math.floor(Math.random() * PERIOD_PREFIXES.length)];
			const core = PERIOD_CORES[Math.floor(Math.random() * PERIOD_CORES.length)];
			return `${prefix} ${core}`;
		},
		() => {
			const core1 = PERIOD_CORES[Math.floor(Math.random() * PERIOD_CORES.length)];
			const core2 = PERIOD_CORES[Math.floor(Math.random() * PERIOD_CORES.length)];
			return `The ${core1} and the ${core2}`;
		}
	];
	return patterns[Math.floor(Math.random() * patterns.length)]();
}

/**
 * Generate an event name
 */
export function generateEventName(): string {
	const patterns = [
		() => {
			const opener = EVENT_OPENERS[Math.floor(Math.random() * EVENT_OPENERS.length)];
			const action = EVENT_ACTIONS[Math.floor(Math.random() * EVENT_ACTIONS.length)];
			return `${opener} ${action}`;
		},
		() => {
			const prefix = EVENT_PREFIXES[Math.floor(Math.random() * EVENT_PREFIXES.length)];
			const noun = EVENT_NOUNS[Math.floor(Math.random() * EVENT_NOUNS.length)];
			return `${prefix} ${noun}`;
		}
	];
	return patterns[Math.floor(Math.random() * patterns.length)]();
}

/**
 * Generate a scene name
 */
export function generateSceneName(): string {
	const patterns = [
		() => {
			const context = SCENE_CONTEXTS[Math.floor(Math.random() * SCENE_CONTEXTS.length)];
			const location = SCENE_LOCATIONS[Math.floor(Math.random() * SCENE_LOCATIONS.length)];
			return `${context} ${location}`;
		},
		() => {
			const descriptor = SCENE_DESCRIPTORS[Math.floor(Math.random() * SCENE_DESCRIPTORS.length)];
			const event = SCENE_EVENTS[Math.floor(Math.random() * SCENE_EVENTS.length)];
			return `The ${descriptor} ${event}`;
		}
	];
	return patterns[Math.floor(Math.random() * patterns.length)]();
}
