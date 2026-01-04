import { describe, it, expect } from 'vitest';
import {
	MAX_PERIODS_PER_GAME,
	MAX_EVENTS_PER_PERIOD,
	MAX_SCENES_PER_EVENT,
	MAX_LEGACIES_PER_GAME,
	wouldExceedPeriodCap,
	wouldExceedEventCap,
	wouldExceedSceneCap,
	wouldExceedLegacyCap
} from './constants';

describe('Soft Caps', () => {
	describe('Constants', () => {
		it('should have sensible default values', () => {
			expect(MAX_PERIODS_PER_GAME).toBeGreaterThan(0);
			expect(MAX_EVENTS_PER_PERIOD).toBeGreaterThan(0);
			expect(MAX_SCENES_PER_EVENT).toBeGreaterThan(0);
			expect(MAX_LEGACIES_PER_GAME).toBeGreaterThan(0);
		});

		it('should be large enough for practical use', () => {
			// These caps should be generous for normal gameplay
			expect(MAX_PERIODS_PER_GAME).toBeGreaterThanOrEqual(100);
			expect(MAX_EVENTS_PER_PERIOD).toBeGreaterThanOrEqual(50);
			expect(MAX_SCENES_PER_EVENT).toBeGreaterThanOrEqual(25);
			expect(MAX_LEGACIES_PER_GAME).toBeGreaterThanOrEqual(50);
		});
	});

	describe('wouldExceedPeriodCap', () => {
		it('should return false when under the cap', () => {
			expect(wouldExceedPeriodCap(0)).toBe(false);
			expect(wouldExceedPeriodCap(MAX_PERIODS_PER_GAME - 1)).toBe(false);
		});

		it('should return true when at or over the cap', () => {
			expect(wouldExceedPeriodCap(MAX_PERIODS_PER_GAME)).toBe(true);
			expect(wouldExceedPeriodCap(MAX_PERIODS_PER_GAME + 1)).toBe(true);
		});
	});

	describe('wouldExceedEventCap', () => {
		it('should return false when under the cap', () => {
			expect(wouldExceedEventCap(0)).toBe(false);
			expect(wouldExceedEventCap(MAX_EVENTS_PER_PERIOD - 1)).toBe(false);
		});

		it('should return true when at or over the cap', () => {
			expect(wouldExceedEventCap(MAX_EVENTS_PER_PERIOD)).toBe(true);
		});
	});

	describe('wouldExceedSceneCap', () => {
		it('should return false when under the cap', () => {
			expect(wouldExceedSceneCap(0)).toBe(false);
			expect(wouldExceedSceneCap(MAX_SCENES_PER_EVENT - 1)).toBe(false);
		});

		it('should return true when at or over the cap', () => {
			expect(wouldExceedSceneCap(MAX_SCENES_PER_EVENT)).toBe(true);
		});
	});

	describe('wouldExceedLegacyCap', () => {
		it('should return false when under the cap', () => {
			expect(wouldExceedLegacyCap(0)).toBe(false);
			expect(wouldExceedLegacyCap(MAX_LEGACIES_PER_GAME - 1)).toBe(false);
		});

		it('should return true when at or over the cap', () => {
			expect(wouldExceedLegacyCap(MAX_LEGACIES_PER_GAME)).toBe(true);
		});
	});
});
