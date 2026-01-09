/**
 * Character generators - Roles and archetypes with room for interpretation
 * Uses combinatorial approach for variety
 * Can inspire ideas for people, animals, or personified non-humans
 */

// Character prefixes - Modifies the archetype
export const CHARACTER_PREFIXES = [
	'The Reluctant',
	'The Ambitious',
	'The Fallen',
	'The Rising',
	'The Last',
	'The First',
	'The Hidden',
	'The Exiled',
	'The Forgotten',
	'The Legendary',
	'The Cursed',
	'The Blessed',
	'The Ancient',
	'The Young',
	'The Wise',
	'The Foolish',
	'The Lost',
	'The Found',
	'The Broken',
	'The Whole',
	'The Silent',
	'The Loud',
	'The Humble',
	'The Proud',
	'The Wandering',
	'The Returning',
	'The Devoted',
	'The Faithless',
	'The Noble',
	'The Common'
];

// Character archetypes - Core roles
export const CHARACTER_ARCHETYPES = [
	'Hero',
	'Villain',
	'Guardian',
	'Betrayer',
	'Seeker',
	'Teacher',
	'Student',
	'Warrior',
	'Healer',
	'Destroyer',
	'Builder',
	'Prophet',
	'Fool',
	'Trickster',
	'Judge',
	'Rebel',
	'Tyrant',
	'Martyr',
	'Savior',
	'Messenger',
	'Witness',
	'Keeper',
	'Hunter',
	'Prey',
	'Leader',
	'Follower',
	'Outcast',
	'Peacemaker',
	'Warmonger',
	'Inventor',
	'Explorer',
	'Survivor',
	'Victim',
	'Champion',
	'Coward'
];

// Character suffixes - Additional context
export const CHARACTER_SUFFIXES = [
	'of Two Worlds',
	'of the Old Ways',
	'of the New Dawn',
	'Who Remembers',
	'Who Forgets',
	'Who Knows the Truth',
	'Who Bears the Burden',
	'Who Seeks Redemption',
	'Who Desires Vengeance',
	'Between Light and Dark',
	'Born of Prophecy',
	'Marked by Fate',
	'Touched by the Divine',
	'Bound by Oath',
	'Freed from Duty',
	'Carrying the Past',
	'Shaping the Future',
	'At the Crossroads',
	'Beyond the Veil',
	'Of Legend',
	'Of Mystery',
	'In Shadow',
	'In Glory',
	'Without Fear',
	'Without Hope',
	'With Nothing to Lose',
	'With Everything to Gain',
	'Against All Odds',
	'Against the Tide',
	'Who Stands Alone'
];

// Role descriptors - Simple but evocative
export const ROLE_DESCRIPTORS = [
	'The One Who Waits',
	'The One Who Acts',
	'The Voice of Reason',
	'The Voice of Madness',
	'The Bearer of Secrets',
	'The Keeper of Flames',
	'The Walker Between',
	'The Bridge Builder',
	'The Wall Breaker',
	'The Truth Teller',
	'The Liar Supreme',
	'The Heart of the Storm',
	'The Eye of Chaos',
	'The Hand of Justice',
	'The Sword of Mercy',
	'The Crown Unearned',
	'The Throne Denied',
	'The Child of Destiny',
	'The Parent of Doom',
	'The Sibling in Shadow'
];

// Character aspects - What defines them
export const CHARACTER_ASPECTS = [
	'who sacrificed everything',
	'who lost their way',
	'who found their purpose',
	'who never surrendered',
	'who always endured',
	'who broke the cycle',
	'who started the war',
	'who ended the peace',
	'who questioned the gods',
	'who defied the stars',
	'who loved too much',
	'who loved too little',
	'who trusted no one',
	'who believed in all',
	'who saw what others missed',
	'who heard the silence',
	'who spoke the unspeakable',
	'who changed everything',
	'who preserved what was',
	'who destroyed what should be'
];

/**
 * Generate a character role/archetype suggestion
 */
export function generateCharacter(): string {
	const patterns = [
		// Prefix + Archetype (e.g., "The Reluctant Hero")
		() => {
			const prefix = CHARACTER_PREFIXES[Math.floor(Math.random() * CHARACTER_PREFIXES.length)];
			const archetype = CHARACTER_ARCHETYPES[Math.floor(Math.random() * CHARACTER_ARCHETYPES.length)];
			return `${prefix} ${archetype}`;
		},
		// Archetype + Suffix (e.g., "Guardian of Two Worlds")
		() => {
			const archetype = CHARACTER_ARCHETYPES[Math.floor(Math.random() * CHARACTER_ARCHETYPES.length)];
			const suffix = CHARACTER_SUFFIXES[Math.floor(Math.random() * CHARACTER_SUFFIXES.length)];
			return `${archetype} ${suffix}`;
		},
		// Role descriptor (e.g., "The One Who Waits")
		() => {
			return ROLE_DESCRIPTORS[Math.floor(Math.random() * ROLE_DESCRIPTORS.length)];
		},
		// Prefix + Archetype + Aspect (e.g., "The Ancient Warrior who never surrendered")
		() => {
			const prefix = CHARACTER_PREFIXES[Math.floor(Math.random() * CHARACTER_PREFIXES.length)];
			const archetype = CHARACTER_ARCHETYPES[Math.floor(Math.random() * CHARACTER_ARCHETYPES.length)];
			const aspect = CHARACTER_ASPECTS[Math.floor(Math.random() * CHARACTER_ASPECTS.length)];
			return `${prefix} ${archetype} ${aspect}`;
		}
	];
	
	return patterns[Math.floor(Math.random() * patterns.length)]();
}
