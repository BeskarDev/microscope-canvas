import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Type utilities for shadcn-svelte components

/**
 * Extracts the element ref type from a component
 */
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
	ref?: E | null;
};

/**
 * Removes the 'child' property from a type
 */
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;

/**
 * Removes both 'child' and 'children' properties from a type
 */
export type WithoutChildrenOrChild<T> = T extends { children?: unknown; child?: unknown }
	? Omit<T, 'children' | 'child'>
	: T extends { children?: unknown }
		? Omit<T, 'children'>
		: T extends { child?: unknown }
			? Omit<T, 'child'>
			: T;

/**
 * Utility type for flyAndScale transition
 */
export type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

/**
 * Creates a fly and scale transition function for svelte components
 */
export function flyAndScale(
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
) {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (styleObj: Record<string, number | string | undefined>): string => {
		return Object.keys(styleObj).reduce((str, key) => {
			if (styleObj[key] === undefined) return str;
			return str + `${key}:${styleObj[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t: number) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: (t: number) => {
			// Custom easing (cubicOut)
			const f = t - 1;
			return f * f * f + 1;
		}
	};
}
