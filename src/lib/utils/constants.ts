/**
 * Soft caps for game data
 * These are technical safeguards, not realistic constraints on normal use
 * Exceeding these caps is allowed but logged as warnings
 */

/**
 * Maximum number of periods per game
 */
export const MAX_PERIODS_PER_GAME = 1024;

/**
 * Maximum number of events per period
 */
export const MAX_EVENTS_PER_PERIOD = 256;

/**
 * Maximum number of scenes per event
 */
export const MAX_SCENES_PER_EVENT = 128;

/**
 * Maximum number of legacies per game
 */
export const MAX_LEGACIES_PER_GAME = 256;

/**
 * Validates count is a non-negative integer
 * @param count The count to validate
 * @returns The validated count, or 0 if invalid
 */
function validateCount(count: number): number {
	if (!Number.isInteger(count) || count < 0) {
		console.warn(`Invalid count value: ${count}, treating as 0`);
		return 0;
	}
	return count;
}

/**
 * Checks if adding a period would exceed the soft cap
 * @param currentCount Current number of periods (must be non-negative integer)
 * @returns true if adding would exceed the cap
 */
export function wouldExceedPeriodCap(currentCount: number): boolean {
	const validCount = validateCount(currentCount);
	const exceeded = validCount >= MAX_PERIODS_PER_GAME;
	if (exceeded) {
		console.warn(
			`Soft cap warning: Attempting to exceed maximum periods (${MAX_PERIODS_PER_GAME})`
		);
	}
	return exceeded;
}

/**
 * Checks if adding an event would exceed the soft cap
 * @param currentCount Current number of events in the period (must be non-negative integer)
 * @returns true if adding would exceed the cap
 */
export function wouldExceedEventCap(currentCount: number): boolean {
	const validCount = validateCount(currentCount);
	const exceeded = validCount >= MAX_EVENTS_PER_PERIOD;
	if (exceeded) {
		console.warn(`Soft cap warning: Attempting to exceed maximum events (${MAX_EVENTS_PER_PERIOD})`);
	}
	return exceeded;
}

/**
 * Checks if adding a scene would exceed the soft cap
 * @param currentCount Current number of scenes in the event (must be non-negative integer)
 * @returns true if adding would exceed the cap
 */
export function wouldExceedSceneCap(currentCount: number): boolean {
	const validCount = validateCount(currentCount);
	const exceeded = validCount >= MAX_SCENES_PER_EVENT;
	if (exceeded) {
		console.warn(`Soft cap warning: Attempting to exceed maximum scenes (${MAX_SCENES_PER_EVENT})`);
	}
	return exceeded;
}

/**
 * Checks if adding a legacy would exceed the soft cap
 * @param currentCount Current number of legacies (must be non-negative integer)
 * @returns true if adding would exceed the cap
 */
export function wouldExceedLegacyCap(currentCount: number): boolean {
	const validCount = validateCount(currentCount);
	const exceeded = validCount >= MAX_LEGACIES_PER_GAME;
	if (exceeded) {
		console.warn(
			`Soft cap warning: Attempting to exceed maximum legacies (${MAX_LEGACIES_PER_GAME})`
		);
	}
	return exceeded;
}
