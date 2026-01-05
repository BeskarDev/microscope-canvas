/**
 * Focus themes - What to explore in the game (100+ entries)
 * Generated combinatorially: [Theme Prefix] + [Theme Core]
 */

// Theme prefixes - the framing of the theme
export const THEME_PREFIXES = [
	'The nature of',
	'The cost of',
	'The pursuit of',
	'The loss of',
	'The price of',
	'The burden of',
	'The promise of',
	'The search for',
	'The meaning of',
	'The limits of',
	'The source of',
	'The paradox of',
	'The weight of',
	'The balance between',
	'The conflict between',
	'The tension between',
	'The relationship between',
	'The boundary between',
	'The bridge between',
	'The choice between'
];

// Theme cores - the central concept
export const THEME_CORES = [
	'power',
	'progress',
	'tradition',
	'freedom',
	'justice',
	'survival',
	'identity',
	'truth',
	'loyalty',
	'faith',
	'love',
	'war',
	'peace',
	'change',
	'memory',
	'hope',
	'fear',
	'ambition',
	'sacrifice',
	'redemption',
	'revenge',
	'duty',
	'honor',
	'knowledge',
	'innocence'
];

// Complete standalone focus themes (100+ entries)
export const FOCUS_THEMES = [
	// Power & Authority
	'The nature of power',
	'The corruption of authority',
	'Who deserves to rule',
	'The legitimacy of leadership',
	'Power through fear vs. love',
	'The burden of command',
	'The limits of control',
	'When power fails',
	'The temptation of absolute power',
	'The price of influence',
	
	// Progress & Change
	'The cost of progress',
	'What we sacrifice for advancement',
	'The clash of old and new',
	'Innovation and its consequences',
	'When progress becomes destruction',
	'The pace of change',
	'Resistance to the new',
	'The promise of a better future',
	'Progress at any cost',
	'The unintended consequences',
	
	// Identity & Belonging
	'What makes us who we are',
	'The search for identity',
	'Belonging and exclusion',
	'The outsider\'s perspective',
	'Cultural assimilation',
	'Preserving heritage',
	'The individual vs. the collective',
	'Finding one\'s place',
	'The masks we wear',
	'True self vs. public self',
	
	// Memory & History
	'What we owe the past',
	'The weight of history',
	'Memory and forgetting',
	'Learning from mistakes',
	'The stories we tell ourselves',
	'Rewriting history',
	'The burden of legacy',
	'Ancestor worship and rebellion',
	'Historical trauma',
	'Monuments and meaning',
	
	// Conflict & Peace
	'War and peace',
	'The cycle of violence',
	'Just and unjust wars',
	'The aftermath of conflict',
	'Building lasting peace',
	'Enemies becoming allies',
	'The cost of victory',
	'Defeat and resilience',
	'The spoils of war',
	'Healing divided nations',
	
	// Faith & Doubt
	'Faith and doubt',
	'The role of religion',
	'True believers',
	'Heresy and orthodoxy',
	'Divine intervention',
	'The silence of the gods',
	'Religious tolerance',
	'Fanaticism',
	'Spiritual awakening',
	'The death of belief',
	
	// Justice & Mercy
	'Justice and mercy',
	'Revenge vs. forgiveness',
	'The rule of law',
	'When laws fail',
	'Vigilante justice',
	'Punishment and rehabilitation',
	'The innocent condemned',
	'The guilty unpunished',
	'Systemic injustice',
	'Revolutionary justice',
	
	// Knowledge & Truth
	'Hidden truths',
	'Forbidden knowledge',
	'The pursuit of wisdom',
	'Ignorance and bliss',
	'Truth vs. comfort',
	'The danger of secrets',
	'Propaganda and truth',
	'Scientific discovery',
	'Lost knowledge',
	'The limits of understanding',
	
	// Love & Loss
	'Love and loss',
	'The bonds that unite us',
	'The walls that divide us',
	'Forbidden relationships',
	'Family obligations',
	'Chosen family',
	'Betrayal by loved ones',
	'Sacrifice for others',
	'The price of loyalty',
	'Grief and recovery',
	
	// Freedom & Duty
	'Freedom and responsibility',
	'The chains we choose',
	'Duty vs. desire',
	'Breaking free',
	'The cost of liberty',
	'Obligations to others',
	'Self-determination',
	'Fate vs. choice',
	'The burden of expectation',
	'Rebellion and conformity',
	
	// Life & Death
	'The cycle of life and death',
	'Mortality and legacy',
	'What we leave behind',
	'Facing death',
	'The fear of dying',
	'Afterlife beliefs',
	'Resurrection and return',
	'The value of life',
	'Death with dignity',
	'The undead and taboo'
];

/**
 * Generate a focus by combining prefix and core
 */
export function generateCombinedFocus(): string {
	const prefix = THEME_PREFIXES[Math.floor(Math.random() * THEME_PREFIXES.length)];
	const core = THEME_CORES[Math.floor(Math.random() * THEME_CORES.length)];
	return `${prefix} ${core}`;
}

/**
 * Generate a focus from the standalone themes
 */
export function generateStandaloneFocus(): string {
	return FOCUS_THEMES[Math.floor(Math.random() * FOCUS_THEMES.length)];
}
