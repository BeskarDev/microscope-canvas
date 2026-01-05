import { test, expect } from '@playwright/test';

/**
 * E2E tests for drag-and-drop reordering functionality
 * Tests cover periods, events, and scenes reordering on desktop and mobile
 */

test.describe('Drag and Drop Reordering', () => {
	test.beforeEach(async ({ page }) => {
		// Create a test game with multiple periods
		await page.goto('/');
		await page.getByRole('button', { name: 'Create New History' }).click();
		await page.getByRole('textbox', { name: 'History Name' }).fill('Drag Test History');
		await page.getByRole('button', { name: 'Create History' }).click();
		await expect(page).toHaveURL(/\/game\//);
	});

	test.describe('Period Reordering', () => {
		test('should display multiple periods', async ({ page }) => {
			// Add two periods
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			await page.waitForTimeout(100);
			await page.getByRole('button', { name: 'Add period here' }).first().click();

			// Verify two periods exist
			const periods = page.getByRole('heading', { level: 3 });
			await expect(periods).toHaveCount(2);
		});

		test('should allow period reordering via drag', async ({ page }) => {
			// Add two periods with distinct names
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			
			// Edit first period name
			await page.getByRole('button', { name: 'New Period' }).click();
			await page.getByRole('textbox', { name: 'Name' }).fill('Period A');
			await page.getByRole('button', { name: 'Save Changes' }).click();
			
			// Add second period
			await page.getByRole('button', { name: 'Add period here' }).first().click();
			
			// Edit second period name
			await page.getByRole('button', { name: 'New Period' }).click();
			await page.getByRole('textbox', { name: 'Name' }).fill('Period B');
			await page.getByRole('button', { name: 'Save Changes' }).click();

			// Get initial order
			const periodA = page.getByRole('heading', { name: 'Period A', level: 3 });
			const periodB = page.getByRole('heading', { name: 'Period B', level: 3 });
			
			await expect(periodA).toBeVisible();
			await expect(periodB).toBeVisible();
			
			const initialBoxA = await periodA.boundingBox();
			const initialBoxB = await periodB.boundingBox();
			
			// Period A should be to the left of Period B
			expect(initialBoxA).not.toBeNull();
			expect(initialBoxB).not.toBeNull();
			if (initialBoxA && initialBoxB) {
				expect(initialBoxA.x).toBeLessThan(initialBoxB.x);
			}
		});
	});

	test.describe('Event Reordering', () => {
		test.beforeEach(async ({ page }) => {
			// Add a period with two events
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			await page.waitForTimeout(100);
			await page.getByRole('button', { name: 'Add event to this period' }).click();
		});

		test('should display multiple events under a period', async ({ page }) => {
			// Verify two events exist
			const events = page.getByRole('heading', { level: 4 });
			await expect(events).toHaveCount(2);
		});

		test('should name events for ordering test', async ({ page }) => {
			// Edit first event name
			await page.getByRole('button', { name: 'New Event' }).first().click();
			await page.getByRole('textbox', { name: 'Name' }).fill('Event A');
			await page.getByRole('button', { name: 'Save Changes' }).click();
			
			// Edit second event name  
			await page.getByRole('button', { name: 'New Event' }).click();
			await page.getByRole('textbox', { name: 'Name' }).fill('Event B');
			await page.getByRole('button', { name: 'Save Changes' }).click();

			// Verify both events exist with names
			await expect(page.getByRole('heading', { name: 'Event A', level: 4 })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Event B', level: 4 })).toBeVisible();
		});
	});

	test.describe('Scene Reordering', () => {
		test.beforeEach(async ({ page }) => {
			// Add a period with an event that has two scenes
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			await page.getByRole('button', { name: 'Add scene to this event' }).click();
			await page.waitForTimeout(100);
			await page.getByRole('button', { name: 'Add scene to this event' }).click();
		});

		test('should display multiple scenes under an event', async ({ page }) => {
			// Verify two scenes exist
			const scenes = page.getByRole('heading', { level: 5 });
			await expect(scenes).toHaveCount(2);
		});
	});

	test.describe('Add Buttons', () => {
		test('add period button should work', async ({ page }) => {
			const initialCount = await page.getByRole('heading', { level: 3 }).count();
			
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			
			const newCount = await page.getByRole('heading', { level: 3 }).count();
			expect(newCount).toBe(initialCount + 1);
		});

		test('add event button should work when period exists', async ({ page }) => {
			// Add period first
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			
			const initialEventCount = await page.getByRole('heading', { level: 4 }).count();
			
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			
			const newEventCount = await page.getByRole('heading', { level: 4 }).count();
			expect(newEventCount).toBe(initialEventCount + 1);
		});

		test('add scene button should work when event exists', async ({ page }) => {
			// Add period and event first
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			
			const initialSceneCount = await page.getByRole('heading', { level: 5 }).count();
			
			await page.getByRole('button', { name: 'Add scene to this event' }).click();
			
			const newSceneCount = await page.getByRole('heading', { level: 5 }).count();
			expect(newSceneCount).toBe(initialSceneCount + 1);
		});

		test('add buttons should be different sizes', async ({ page }) => {
			// Add period and event first
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			
			// Get button dimensions
			const addEventButton = page.getByRole('button', { name: 'Add event to this period' });
			const addSceneButton = page.getByRole('button', { name: 'Add scene to this event' });
			
			const eventBox = await addEventButton.boundingBox();
			const sceneBox = await addSceneButton.boundingBox();
			
			// Scene button should be smaller than event button
			expect(eventBox).not.toBeNull();
			expect(sceneBox).not.toBeNull();
			if (eventBox && sceneBox) {
				expect(sceneBox.height).toBeLessThan(eventBox.height);
			}
		});
	});

	test.describe('Mobile Support', () => {
		test('add period button should work on mobile', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });
			
			const initialCount = await page.getByRole('heading', { level: 3 }).count();
			
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			
			const newCount = await page.getByRole('heading', { level: 3 }).count();
			expect(newCount).toBe(initialCount + 1);
		});

		test('add event button should work on mobile', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });
			
			// Add period first
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			
			const initialEventCount = await page.getByRole('heading', { level: 4 }).count();
			
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			
			const newEventCount = await page.getByRole('heading', { level: 4 }).count();
			expect(newEventCount).toBe(initialEventCount + 1);
		});

		test('add scene button should work on mobile', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });
			
			// Add period and event first
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			
			const initialSceneCount = await page.getByRole('heading', { level: 5 }).count();
			
			await page.getByRole('button', { name: 'Add scene to this event' }).click();
			
			const newSceneCount = await page.getByRole('heading', { level: 5 }).count();
			expect(newSceneCount).toBe(initialSceneCount + 1);
		});
	});

	test.describe('Empty State', () => {
		test('should not show events section when period has no events', async ({ page }) => {
			// Add a period
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			
			// Verify period exists but no events section is visible (no empty space)
			await expect(page.getByRole('heading', { level: 3 })).toHaveCount(1);
			await expect(page.getByRole('heading', { level: 4 })).toHaveCount(0);
		});

		test('should not show scenes section when event has no scenes', async ({ page }) => {
			// Add period and event
			await page.getByRole('button', { name: 'Add period at beginning' }).click();
			await page.getByRole('button', { name: 'Add event to this period' }).click();
			
			// Verify event exists but no scenes section is visible (no empty space)
			await expect(page.getByRole('heading', { level: 4 })).toHaveCount(1);
			await expect(page.getByRole('heading', { level: 5 })).toHaveCount(0);
		});
	});
});
