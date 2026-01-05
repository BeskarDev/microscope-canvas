/**
 * Standardized animation utilities for consistent game-like feel
 * These CSS keyframe names and transition presets can be used across components
 */

/**
 * Animation duration presets (in ms)
 */
export const ANIMATION_DURATIONS = {
	/** Fast micro-interactions like hover states */
	fast: 150,
	/** Standard transitions for most UI elements */
	normal: 200,
	/** Slower transitions for emphasis */
	slow: 300,
	/** Extra slow for dramatic effect */
	dramatic: 500
} as const;

/**
 * Easing presets for different animation types
 */
export const ANIMATION_EASINGS = {
	/** Standard ease for most animations */
	default: 'cubic-bezier(0.4, 0, 0.2, 1)',
	/** Ease-out for entrance animations */
	easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
	/** Ease-in for exit animations */
	easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
	/** Spring-like bounce effect */
	spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
	/** Smooth deceleration */
	decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
	/** Smooth acceleration */
	accelerate: 'cubic-bezier(0.4, 0, 1, 1)'
} as const;

/**
 * Common transition presets as CSS transition values
 */
export const TRANSITIONS = {
	/** Standard opacity fade */
	fade: `opacity ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASINGS.default}`,
	/** Scale and fade for modal/card entrance */
	scaleIn: `transform ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASINGS.spring}, opacity ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASINGS.easeOut}`,
	/** Scale and fade for modal/card exit */
	scaleOut: `transform ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.easeIn}, opacity ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.easeIn}`,
	/** Slide animation for panels */
	slide: `transform ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASINGS.decelerate}`,
	/** Color/background transitions */
	colors: `background-color ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.default}, border-color ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.default}, color ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.default}`,
	/** Button hover effect */
	button: `transform ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.spring}, background-color ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.default}, box-shadow ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.default}`,
	/** Card hover effect */
	card: `transform ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASINGS.spring}, box-shadow ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASINGS.default}, border-color ${ANIMATION_DURATIONS.fast}ms ${ANIMATION_EASINGS.default}`,
	/** All common properties */
	all: `all ${ANIMATION_DURATIONS.normal}ms ${ANIMATION_EASINGS.default}`
} as const;

/**
 * CSS class names for keyframe animations (defined in app.css)
 */
export const ANIMATION_CLASSES = {
	/** Fade in from transparent */
	fadeIn: 'animate-fade-in',
	/** Fade out to transparent */
	fadeOut: 'animate-fade-out',
	/** Scale up from 95% with fade */
	scaleIn: 'animate-scale-in',
	/** Scale down to 95% with fade */
	scaleOut: 'animate-scale-out',
	/** Slide in from bottom */
	slideInUp: 'animate-slide-in-up',
	/** Slide out to bottom */
	slideOutDown: 'animate-slide-out-down',
	/** Slide in from right */
	slideInRight: 'animate-slide-in-right',
	/** Slide out to right */
	slideOutRight: 'animate-slide-out-right',
	/** Subtle pulse effect */
	pulse: 'animate-pulse',
	/** Shimmer loading effect */
	shimmer: 'animate-shimmer',
	/** Gentle float effect */
	float: 'animate-float'
} as const;

/**
 * Generate a CSS transition string from presets
 */
export function createTransition(...properties: Array<keyof typeof TRANSITIONS>): string {
	return properties.map((p) => TRANSITIONS[p]).join(', ');
}

/**
 * Generate inline style object for transition
 */
export function transitionStyle(properties: Array<keyof typeof TRANSITIONS>): {
	transition: string;
} {
	return { transition: createTransition(...properties) };
}
