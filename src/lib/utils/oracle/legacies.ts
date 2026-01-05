/**
 * Legacy generators - Recurring elements in the history (100+ combinations)
 * Uses combinatorial approach: [Type] + [Trait]
 */

// Legacy types - What kind of legacy is it?
export const LEGACY_TYPES = [
	// People & Bloodlines
	'A bloodline that carries',
	'A family that guards',
	'A dynasty that holds',
	'A lineage cursed with',
	'Descendants chosen for',
	'An heir destined for',
	'A people marked by',
	'A tribe bound to',
	'A clan sworn to',
	'Generations shaped by',
	
	// Organizations
	'An organization that guards',
	'A secret society protecting',
	'An order dedicated to',
	'A guild preserving',
	'A brotherhood sworn to',
	'A sisterhood keeping',
	'A council maintaining',
	'An academy teaching',
	'A cult worshipping',
	'A league united by',
	
	// Places
	'A place that holds',
	'A city built upon',
	'A fortress guarding',
	'A temple housing',
	'A land cursed with',
	'A realm shaped by',
	'A sanctuary preserving',
	'A ruin containing',
	'A monument to',
	'A grave holding',
	
	// Objects
	'An artifact that contains',
	'A weapon forged for',
	'A crown symbolizing',
	'A tome recording',
	'A treasure hiding',
	'A relic imbued with',
	'A key unlocking',
	'A seal binding',
	'A book preserving',
	'A map revealing',
	
	// Abstract
	'A tradition that preserves',
	'A prophecy speaking of',
	'A curse that binds',
	'A mystery surrounding',
	'A symbol representing',
	'A legend telling of',
	'A song remembering',
	'A ritual invoking',
	'A belief teaching',
	'A story warning of'
];

// Legacy traits - What makes it significant?
export const LEGACY_TRAITS = [
	// Power
	'immense power',
	'forbidden knowledge',
	'ancient wisdom',
	'divine authority',
	'supernatural abilities',
	'incredible wealth',
	'vast influence',
	'unmatched skill',
	'legendary strength',
	'mystic insight',
	
	// Burden
	'a terrible burden',
	'unbreakable loyalty',
	'eternal conflict',
	'a dark secret',
	'an ancient duty',
	'a sacred obligation',
	'an impossible task',
	'a dangerous truth',
	'a heavy responsibility',
	'an unfulfilled prophecy',
	
	// Hope
	'the hope of generations',
	'the memory of the fallen',
	'the key to survival',
	'a bridge between worlds',
	'the promise of change',
	'the truth of origins',
	'the path to redemption',
	'the seeds of renewal',
	'the light in darkness',
	'the way forward',
	
	// Conflict
	'justice or vengeance',
	'war without end',
	'an ancient enemy',
	'a blood feud',
	'eternal vigilance',
	'an uneasy peace',
	'a fragile alliance',
	'a bitter rivalry',
	'a contested inheritance',
	'a divided purpose',
	
	// Mystery
	'the secret of creation',
	'the mystery of death',
	'knowledge thought lost',
	'truths best forgotten',
	'questions without answers',
	'riddles from the past',
	'signs of what comes',
	'echoes of history',
	'shadows of the future',
	'the unknown made known'
];

// Complete standalone legacies
export const STANDALONE_LEGACIES = [
	'The crown that chooses its wearer',
	'A bloodline touched by the divine',
	'The order that guards the threshold',
	'A weapon that hungers',
	'The family that remembers everything',
	'A place where time flows differently',
	'The book that writes itself',
	'A curse that skips generations',
	'The treaty that must never be broken',
	'A song that can only be sung once',
	'The title that demands sacrifice',
	'A secret that has destroyed empires',
	'The ritual that maintains the world',
	'A creature that has always been',
	'The prophecy that none may escape',
	'A symbol that means different things',
	'The oath that binds beyond death',
	'A truth that changes everything',
	'The burden that must be carried',
	'A gift that is also a curse'
];

/**
 * Generate a legacy suggestion
 */
export function generateLegacy(): string {
	// Sometimes use standalone
	if (Math.random() > 0.7) {
		return STANDALONE_LEGACIES[Math.floor(Math.random() * STANDALONE_LEGACIES.length)];
	}
	
	// Use combinatorial approach
	const type = LEGACY_TYPES[Math.floor(Math.random() * LEGACY_TYPES.length)];
	const trait = LEGACY_TRAITS[Math.floor(Math.random() * LEGACY_TRAITS.length)];
	return `${type} ${trait}`;
}
