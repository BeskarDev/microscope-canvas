/**
 * Oracle system for single-player Microscope games
 * Inspired by Microscope Explorer's history seeds and Mythic Game Master Emulator
 * 
 * The oracle provides vague, interpretable prompts to spark creativity
 * when playing solo, helping generate ideas for periods, events, scenes,
 * palette items, and focuses.
 */

// History seed components - evocative word pairs for inspiration
const SUBJECTS = [
	'An ancient power',
	'A forgotten empire',
	'The last survivors',
	'A wandering tribe',
	'An underground cult',
	'A merchant guild',
	'The royal court',
	'A band of outcasts',
	'The scholarly order',
	'A rival faction',
	'The common folk',
	'A secret society',
	'The ruling elite',
	'A prophet',
	'An inventor',
	'A conqueror',
	'A peacemaker',
	'A betrayer',
	'The chosen one',
	'A foreign envoy',
	'The old guard',
	'Young rebels',
	'A mysterious stranger',
	'The fallen hero',
	'A desperate leader',
	'The lost heir',
	'A wise advisor',
	'A vengeful spirit',
	'A legendary beast',
	'The untouchables'
];

const ACTIONS = [
	'discovers',
	'destroys',
	'creates',
	'abandons',
	'transforms',
	'challenges',
	'unites',
	'divides',
	'corrupts',
	'purifies',
	'reveals',
	'conceals',
	'resurrects',
	'buries',
	'awakens',
	'silences',
	'liberates',
	'enslaves',
	'questions',
	'answers',
	'rebuilds',
	'remembers',
	'forgets',
	'sacrifices',
	'preserves',
	'celebrates',
	'mourns',
	'confronts',
	'flees from',
	'embraces'
];

const OBJECTS = [
	'an ancient artifact',
	'a sacred tradition',
	'the forbidden knowledge',
	'a powerful alliance',
	'the old ways',
	'a new belief',
	'the boundary between worlds',
	'a terrible secret',
	'the source of power',
	'an impossible choice',
	'a forgotten promise',
	'the laws of nature',
	'a precious resource',
	'the bonds of family',
	'a dangerous truth',
	'the price of peace',
	'an unexpected connection',
	'the weight of history',
	'a symbol of hope',
	'the edge of extinction',
	'a lasting legacy',
	'the cycle of violence',
	'a bridge to the past',
	'the seeds of change',
	'a fragile treaty',
	'the essence of humanity',
	'a technological marvel',
	'the spirit of rebellion',
	'a divine mandate',
	'the cost of progress'
];

// Contextual modifiers for richer prompts
const CIRCUMSTANCES = [
	'during a time of crisis',
	'at the height of prosperity',
	'in the aftermath of war',
	'on the eve of a great change',
	'while hidden forces stir',
	'as old powers awaken',
	'when all seems lost',
	'during a golden age',
	'in a moment of doubt',
	'while the world watches',
	'in secret',
	'against all odds',
	'for the first time',
	'for the last time',
	'too late',
	'before its time',
	'under a dark omen',
	'by accident',
	'through sacrifice',
	'with unexpected allies'
];

// Thematic focuses for game exploration
const FOCUS_THEMES = [
	'The nature of power',
	'The cost of progress',
	'What we owe the past',
	'The bonds that unite us',
	'The walls that divide us',
	'The search for meaning',
	'The price of survival',
	'What makes us human',
	'The cycle of rise and fall',
	'Dreams and their consequences',
	'The clash of old and new',
	'Hidden truths',
	'The weight of tradition',
	'Innovation and its dangers',
	'The outsider\'s perspective',
	'Sacrifice and reward',
	'Justice and mercy',
	'Faith and doubt',
	'War and peace',
	'Love and loss',
	'Memory and forgetting',
	'Identity and change',
	'Freedom and responsibility',
	'Creation and destruction',
	'The individual vs. the collective'
];

// Tone descriptors for palette-style prompts
const TONE_ELEMENTS = {
	light: [
		'Hope rises from unexpected places',
		'Unity overcomes division',
		'Wisdom guides the way',
		'Love transcends barriers',
		'Courage in the face of fear',
		'Second chances',
		'Unlikely friendships',
		'The triumph of the underdog',
		'Healing old wounds',
		'A new dawn',
		'Redemption',
		'Discovery',
		'Celebration',
		'Reconciliation',
		'Growth through adversity'
	],
	dark: [
		'Betrayal from within',
		'The corruption of ideals',
		'Desperate measures',
		'The price of ambition',
		'Unavoidable tragedy',
		'The slow decay',
		'Loss of innocence',
		'The cycle of revenge',
		'Hubris and downfall',
		'Things best left buried',
		'The monster we become',
		'Sacrifices unmourned',
		'The end of an era',
		'Trust shattered',
		'The point of no return'
	]
};

// Questions for scene exploration
const SCENE_QUESTIONS = [
	'What choice must be made here?',
	'What secret is revealed?',
	'Who pays the price?',
	'What changes everything?',
	'What old wound reopens?',
	'What alliance forms or breaks?',
	'What is sacrificed?',
	'What hope dies or is born?',
	'What truth is finally spoken?',
	'What mask falls away?',
	'What is remembered or forgotten?',
	'What boundary is crossed?',
	'What power shifts?',
	'What cycle begins or ends?',
	'What do they discover about themselves?',
	'What unexpected consequence emerges?',
	'What unlikely hero or villain emerges?',
	'What tradition is kept or broken?',
	'What promise is made or broken?',
	'What impossible thing becomes possible?'
];

// Legacy suggestions
const LEGACY_TYPES = [
	'A bloodline that carries',
	'An organization that guards',
	'A place that holds',
	'An artifact that contains',
	'A tradition that preserves',
	'A prophecy that speaks of',
	'A curse that binds',
	'A mystery surrounding',
	'A symbol representing',
	'A document recording',
	'A weapon used for',
	'A structure built for',
	'A creature associated with',
	'A title passed down for',
	'A secret society protecting'
];

const LEGACY_TRAITS = [
	'immense power',
	'forbidden knowledge',
	'ancient wisdom',
	'a terrible burden',
	'unbreakable loyalty',
	'eternal conflict',
	'divine favor',
	'a dark secret',
	'the hope of generations',
	'the memory of the fallen',
	'the key to survival',
	'a bridge between worlds',
	'justice or vengeance',
	'the truth of origins',
	'the promise of change'
];

/**
 * Get a random element from an array
 */
function randomFrom<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a history seed prompt (Subject + Action + Object)
 */
export function generateHistorySeed(): string {
	const subject = randomFrom(SUBJECTS);
	const action = randomFrom(ACTIONS);
	const object = randomFrom(OBJECTS);
	const includeCircumstance = Math.random() > 0.5;
	
	let seed = `${subject} ${action} ${object}`;
	if (includeCircumstance) {
		seed += ` ${randomFrom(CIRCUMSTANCES)}`;
	}
	return seed;
}

/**
 * Generate a focus theme suggestion
 */
export function generateFocus(): string {
	return randomFrom(FOCUS_THEMES);
}

/**
 * Generate a palette element with tone
 */
export function generatePaletteElement(tone?: 'light' | 'dark'): { text: string; tone: 'light' | 'dark' } {
	const selectedTone = tone ?? (Math.random() > 0.5 ? 'light' : 'dark');
	return {
		text: randomFrom(TONE_ELEMENTS[selectedTone]),
		tone: selectedTone
	};
}

/**
 * Generate a scene question
 */
export function generateSceneQuestion(): string {
	return randomFrom(SCENE_QUESTIONS);
}

/**
 * Generate a legacy suggestion
 */
export function generateLegacy(): string {
	const type = randomFrom(LEGACY_TYPES);
	const trait = randomFrom(LEGACY_TRAITS);
	return `${type} ${trait}`;
}

/**
 * Generate a period/event name inspiration
 */
export function generateNameInspiration(): string {
	const patterns = [
		() => `The ${randomFrom(['Age', 'Era', 'Time', 'Dawn', 'Fall', 'Rise', 'End', 'Beginning'])} of ${randomFrom(['Light', 'Shadow', 'Change', 'Division', 'Unity', 'Dreams', 'War', 'Peace', 'Discovery', 'Loss'])}`,
		() => `When ${randomFrom(['Everything Changed', 'Hope Died', 'The Walls Fell', 'Fire Swept the Land', 'The Old Ways Ended', 'Strangers Arrived', 'The Truth Emerged', 'Silence Fell'])}`,
		() => `The ${randomFrom(['First', 'Last', 'Great', 'Hidden', 'Forgotten', 'Broken', 'Sacred', 'Final'])} ${randomFrom(['War', 'Peace', 'Alliance', 'Betrayal', 'Discovery', 'Sacrifice', 'Journey', 'Council', 'Uprising'])}`,
		() => `${randomFrom(['Before', 'After', 'During'])} the ${randomFrom(['Storm', 'Silence', 'Reckoning', 'Awakening', 'Collapse', 'Renewal', 'Convergence', 'Sundering'])}`
	];
	return randomFrom(patterns)();
}

export type OracleCategory = 'seed' | 'focus' | 'palette' | 'scene' | 'legacy' | 'name';

/**
 * Generate oracle result based on category
 */
export function generateOracleResult(category: OracleCategory): string {
	switch (category) {
		case 'seed':
			return generateHistorySeed();
		case 'focus':
			return generateFocus();
		case 'palette':
			return generatePaletteElement().text;
		case 'scene':
			return generateSceneQuestion();
		case 'legacy':
			return generateLegacy();
		case 'name':
			return generateNameInspiration();
		default:
			return generateHistorySeed();
	}
}
