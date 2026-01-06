/**
 * Deep clone utility that safely handles undefined values
 * Unlike JSON.parse(JSON.stringify()), this preserves undefined values
 */

/**
 * Safely deep clones an object, handling undefined values correctly.
 * This is safer than JSON.parse(JSON.stringify()) which fails when
 * encountering undefined values.
 *
 * @param obj The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
	// Handle primitive types and null
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// Handle Date
	if (obj instanceof Date) {
		return new Date(obj.getTime()) as T;
	}

	// Handle Array
	if (Array.isArray(obj)) {
		return obj.map((item) => deepClone(item)) as T;
	}

	// Handle Object
	const cloned = {} as T;
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			cloned[key] = deepClone(obj[key]);
		}
	}

	return cloned;
}
