/**
 * Oracle system index - Main entry point for the Oracle
 * Combines all oracle tables and provides unified generation functions
 */

import { SUBJECTS, ACTIONS, OBJECTS, CIRCUMSTANCES } from './history-seeds';
import { FOCUS_THEMES, generateCombinedFocus, generateStandaloneFocus } from './focuses';
import { generatePeriodName, generateEventName, generateSceneName } from './names';
import { generateLightElement, generateDarkElement } from './palette';
import { generateSceneQuestion, SCENE_QUESTIONS } from './scene-questions';
import { generateLegacy, LEGACY_TYPES, LEGACY_TRAITS } from './legacies';

/**
 * Get a random element from an array
 */
function randomFrom<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a history seed prompt (Subject + Action + Object + optional Circumstance)
 * This creates evocative prompts that can be interpreted many ways
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
	// Mix between combined and standalone for variety
	return Math.random() > 0.5 ? generateCombinedFocus() : generateStandaloneFocus();
}

/**
 * Generate a palette element with tone
 */
export function generatePaletteElement(tone?: 'light' | 'dark'): { text: string; tone: 'light' | 'dark' } {
	const selectedTone = tone ?? (Math.random() > 0.5 ? 'light' : 'dark');
	return {
		text: selectedTone === 'light' ? generateLightElement() : generateDarkElement(),
		tone: selectedTone
	};
}

/**
 * Generate a period/event name inspiration
 */
export function generateNameInspiration(): string {
	// Mix period, event, and scene names for variety
	const generators = [generatePeriodName, generateEventName, generateSceneName];
	return randomFrom(generators)();
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

// Re-export individual generators for direct use
export { 
	generatePeriodName, 
	generateEventName, 
	generateSceneName,
	generateSceneQuestion,
	generateLegacy,
	generateLightElement,
	generateDarkElement
};

// Re-export tables for inspection/debugging
export {
	SUBJECTS,
	ACTIONS,
	OBJECTS,
	CIRCUMSTANCES,
	FOCUS_THEMES,
	SCENE_QUESTIONS,
	LEGACY_TYPES,
	LEGACY_TRAITS
};
