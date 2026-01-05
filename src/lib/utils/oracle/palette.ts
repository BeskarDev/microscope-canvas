/**
 * Palette elements - Yes/No items for worldbuilding (100+ each for light and dark)
 * Uses combinatorial approach for variety
 */

// Light tone descriptors
export const LIGHT_DESCRIPTORS = [
	'Hope',
	'Unity',
	'Wisdom',
	'Love',
	'Courage',
	'Redemption',
	'Discovery',
	'Celebration',
	'Reconciliation',
	'Growth',
	'Healing',
	'Friendship',
	'Trust',
	'Compassion',
	'Mercy',
	'Justice',
	'Innovation',
	'Progress',
	'Harmony',
	'Peace'
];

export const LIGHT_CONTEXTS = [
	'rises from unexpected places',
	'overcomes division',
	'guides the way',
	'transcends barriers',
	'in the face of fear',
	'against all odds',
	'through sacrifice',
	'in dark times',
	'from unlikely sources',
	'when least expected',
	'through understanding',
	'across boundaries',
	'despite past wrongs',
	'in moments of crisis',
	'through cooperation',
	'by ordinary people',
	'in small acts',
	'through perseverance',
	'when all seems lost',
	'from the ashes'
];

// Additional standalone light elements
export const LIGHT_ELEMENTS = [
	'Second chances',
	'Unlikely friendships',
	'The triumph of the underdog',
	'Healing old wounds',
	'A new dawn',
	'Finding common ground',
	'Peaceful revolution',
	'Earned forgiveness',
	'Sacrifice rewarded',
	'Truth setting free',
	'Love conquering fear',
	'Unity in diversity',
	'Wisdom of the young',
	'Courage of the weak',
	'Mercy for the fallen',
	'Justice restored',
	'Lost things found',
	'Broken bonds mended',
	'Enemies becoming friends',
	'Light in the darkness',
	'Hope against hope',
	'The power of kindness',
	'Unexpected heroism',
	'Grace under pressure',
	'The strength of community',
	'Dreams realized',
	'Barriers broken',
	'Chains removed',
	'Voices heard',
	'Justice served',
	'Wrongs righted',
	'Peace achieved',
	'Freedom won',
	'Love triumphant',
	'Faith rewarded',
	'Trust earned',
	'Respect gained',
	'Understanding reached',
	'Harmony restored',
	'Balance achieved'
];

// Dark tone descriptors
export const DARK_DESCRIPTORS = [
	'Betrayal',
	'Corruption',
	'Desperation',
	'Ambition',
	'Tragedy',
	'Decay',
	'Innocence',
	'Revenge',
	'Hubris',
	'Buried',
	'Monsters',
	'Sacrifices',
	'The end',
	'Trust',
	'The point',
	'Destruction',
	'Loss',
	'Fear',
	'Hatred',
	'Despair'
];

export const DARK_CONTEXTS = [
	'from within',
	'of ideals',
	'measures',
	'unchecked',
	'unavoidable',
	'slow and certain',
	'lost forever',
	'perpetual',
	'before the fall',
	'best left buried',
	'we become',
	'unmourned',
	'of an era',
	'shattered',
	'of no return',
	'by ones we love',
	'in high places',
	'spreading',
	'consuming all',
	'inescapable'
];

// Additional standalone dark elements
export const DARK_ELEMENTS = [
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
	'The point of no return',
	'Blood debts unpaid',
	'Secrets that destroy',
	'Power that corrupts',
	'Love that turns to hate',
	'Friends turned enemies',
	'Noble lies',
	'Necessary evils',
	'Collateral damage',
	'The cost of victory',
	'Hollow triumphs',
	'Pyrrhic victories',
	'Casualties of progress',
	'The forgotten',
	'The abandoned',
	'The betrayed',
	'The condemned',
	'The fallen',
	'The corrupted',
	'The lost',
	'The damned',
	'Unforgivable sins',
	'Irreversible choices',
	'Permanent scars',
	'Broken promises',
	'Shattered dreams'
];

/**
 * Generate a light palette element
 */
export function generateLightElement(): string {
	const useCombo = Math.random() > 0.5;
	if (useCombo) {
		const descriptor = LIGHT_DESCRIPTORS[Math.floor(Math.random() * LIGHT_DESCRIPTORS.length)];
		const context = LIGHT_CONTEXTS[Math.floor(Math.random() * LIGHT_CONTEXTS.length)];
		return `${descriptor} ${context}`;
	}
	return LIGHT_ELEMENTS[Math.floor(Math.random() * LIGHT_ELEMENTS.length)];
}

/**
 * Generate a dark palette element
 */
export function generateDarkElement(): string {
	const useCombo = Math.random() > 0.5;
	if (useCombo) {
		const descriptor = DARK_DESCRIPTORS[Math.floor(Math.random() * DARK_DESCRIPTORS.length)];
		const context = DARK_CONTEXTS[Math.floor(Math.random() * DARK_CONTEXTS.length)];
		return `${descriptor} ${context}`;
	}
	return DARK_ELEMENTS[Math.floor(Math.random() * DARK_ELEMENTS.length)];
}
