import { describe, it, expect } from 'vitest';
import { deepClone } from './deep-clone';

describe('deepClone', () => {
	it('should clone primitive values', () => {
		expect(deepClone(42)).toBe(42);
		expect(deepClone('hello')).toBe('hello');
		expect(deepClone(true)).toBe(true);
		expect(deepClone(null)).toBe(null);
		expect(deepClone(undefined)).toBe(undefined);
	});

	it('should clone simple objects', () => {
		const obj = { a: 1, b: 'test', c: true };
		const cloned = deepClone(obj);

		expect(cloned).toEqual(obj);
		expect(cloned).not.toBe(obj); // Different reference
	});

	it('should handle undefined values in objects', () => {
		const obj = { a: 1, b: undefined, c: 'test' };
		const cloned = deepClone(obj);

		expect(cloned).toEqual(obj);
		expect(cloned.b).toBeUndefined();
		expect('b' in cloned).toBe(true); // Key should still exist
	});

	it('should clone nested objects', () => {
		const obj = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3
				}
			}
		};
		const cloned = deepClone(obj);

		expect(cloned).toEqual(obj);
		expect(cloned).not.toBe(obj);
		expect(cloned.b).not.toBe(obj.b);
		expect(cloned.b.d).not.toBe(obj.b.d);
	});

	it('should clone arrays', () => {
		const arr = [1, 2, 3, 4, 5];
		const cloned = deepClone(arr);

		expect(cloned).toEqual(arr);
		expect(cloned).not.toBe(arr);
	});

	it('should clone arrays with objects', () => {
		const arr = [{ a: 1 }, { b: 2 }, { c: 3 }];
		const cloned = deepClone(arr);

		expect(cloned).toEqual(arr);
		expect(cloned).not.toBe(arr);
		expect(cloned[0]).not.toBe(arr[0]);
		expect(cloned[1]).not.toBe(arr[1]);
		expect(cloned[2]).not.toBe(arr[2]);
	});

	it('should handle arrays with undefined values', () => {
		const arr = [1, undefined, 3];
		const cloned = deepClone(arr);

		expect(cloned).toEqual(arr);
		expect(cloned[1]).toBeUndefined();
	});

	it('should clone Date objects', () => {
		const date = new Date('2024-01-01T00:00:00.000Z');
		const cloned = deepClone(date);

		expect(cloned).toEqual(date);
		expect(cloned).not.toBe(date);
		expect(cloned.getTime()).toBe(date.getTime());
	});

	it('should handle complex nested structures', () => {
		const obj = {
			id: '123',
			name: 'Test',
			description: undefined,
			notes: 'Some notes',
			metadata: {
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-02'),
				tags: ['tag1', 'tag2']
			},
			items: [
				{ id: '1', value: 10 },
				{ id: '2', value: undefined }
			]
		};

		const cloned = deepClone(obj);

		expect(cloned).toEqual(obj);
		expect(cloned).not.toBe(obj);
		expect(cloned.description).toBeUndefined();
		expect(cloned.metadata).not.toBe(obj.metadata);
		expect(cloned.metadata.createdAt).not.toBe(obj.metadata.createdAt);
		expect(cloned.items[1].value).toBeUndefined();
	});

	it('should handle objects with optional properties', () => {
		interface TestObject {
			required: string;
			optional?: string;
			nested?: {
				value?: number;
			};
		}

		const obj: TestObject = {
			required: 'test',
			optional: undefined,
			nested: {
				value: undefined
			}
		};

		const cloned = deepClone(obj);

		expect(cloned.required).toBe('test');
		expect(cloned.optional).toBeUndefined();
		expect(cloned.nested?.value).toBeUndefined();
	});

	it('should not mutate the original object', () => {
		const original = { a: 1, b: { c: 2 } };
		const cloned = deepClone(original);

		cloned.a = 99;
		cloned.b.c = 99;

		expect(original.a).toBe(1);
		expect(original.b.c).toBe(2);
	});
});
