import { test, expect } from '@playwright/test';

/**
 * E2E tests for game save functionality
 * These tests verify that all game actions persist correctly to IndexedDB
 */

test.describe('Game Save Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should persist newly created game', async ({ page }) => {
		// Create a new game
		await page.getByRole('button', { name: 'Create New Game' }).click();
		await page.getByRole('textbox', { name: 'Game Name' }).fill('Test Persistence Game');
		await page.getByRole('button', { name: 'Create Game' }).click();

		// Wait for navigation to game page
		await expect(page).toHaveURL(/\/game\//);
		const gameId = page.url().split('/').pop();

		// Navigate back to home
		await page.getByRole('button', { name: 'Back' }).click();

		// Verify game appears in list
		await expect(page.getByText('Test Persistence Game')).toBeVisible();

		// Reload and verify game still exists
		await page.reload();
		await expect(page.getByText('Test Persistence Game')).toBeVisible();

		// Clean up: delete the game
		await page.getByRole('button', { name: 'Delete Test Persistence Game' }).click();
		await page.getByRole('button', { name: 'Delete' }).click();
	});

	test('should persist added periods', async ({ page }) => {
		// Create a new game
		await page.getByRole('button', { name: 'Create New Game' }).click();
		await page.getByRole('textbox', { name: 'Game Name' }).fill('Period Test Game');
		await page.getByRole('button', { name: 'Create Game' }).click();
		await expect(page).toHaveURL(/\/game\//);

		// Add a period
		await page.getByRole('button', { name: 'Add period at beginning' }).click();
		await expect(page.getByRole('heading', { name: 'New Period', level: 3 })).toBeVisible();

		// Wait for autosave
		await page.waitForTimeout(1000);

		// Reload the page
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify period persisted
		await expect(page.getByRole('heading', { name: 'New Period', level: 3 })).toBeVisible();
	});

	test('should persist added events', async ({ page }) => {
		// Create game with a period
		await page.getByRole('button', { name: 'Create New Game' }).click();
		await page.getByRole('textbox', { name: 'Game Name' }).fill('Event Test Game');
		await page.getByRole('button', { name: 'Create Game' }).click();
		await page.getByRole('button', { name: 'Add period at beginning' }).click();

		// Add an event to the period
		await page.getByRole('button', { name: 'Add event to this period' }).click();
		await expect(page.getByRole('heading', { name: 'New Event', level: 4 })).toBeVisible();

		// Wait for autosave
		await page.waitForTimeout(1000);

		// Reload
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify event persisted
		await expect(page.getByRole('heading', { name: 'New Event', level: 4 })).toBeVisible();
	});

	test('should persist added scenes', async ({ page }) => {
		// Create game with period and event
		await page.getByRole('button', { name: 'Create New Game' }).click();
		await page.getByRole('textbox', { name: 'Game Name' }).fill('Scene Test Game');
		await page.getByRole('button', { name: 'Create Game' }).click();
		await page.getByRole('button', { name: 'Add period at beginning' }).click();
		await page.getByRole('button', { name: 'Add event to this period' }).click();

		// Add a scene to the event
		await page.getByRole('button', { name: 'Add scene to this event' }).click();
		await expect(page.getByRole('heading', { name: 'New Scene', level: 5 })).toBeVisible();

		// Wait for autosave
		await page.waitForTimeout(1000);

		// Reload
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify scene persisted
		await expect(page.getByRole('heading', { name: 'New Scene', level: 5 })).toBeVisible();
	});

	test('should persist edited period', async ({ page }) => {
		// Create game with a period
		await page.getByRole('button', { name: 'Create New Game' }).click();
		await page.getByRole('textbox', { name: 'Game Name' }).fill('Edit Test Game');
		await page.getByRole('button', { name: 'Create Game' }).click();
		await page.getByRole('button', { name: 'Add period at beginning' }).click();

		// Edit the period
		await page.getByRole('button', { name: 'New Period' }).click();
		await page.getByRole('textbox', { name: 'Name' }).fill('The Ancient Era');
		await page.getByRole('button', { name: 'Save Changes' }).click();

		// Verify change visible
		await expect(page.getByRole('heading', { name: 'The Ancient Era', level: 3 })).toBeVisible();

		// Wait for autosave
		await page.waitForTimeout(1000);

		// Reload
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify edit persisted
		await expect(page.getByRole('heading', { name: 'The Ancient Era', level: 3 })).toBeVisible();
	});

	test('should persist deleted period', async ({ page }) => {
		// Create game with two periods
		await page.getByRole('button', { name: 'Create New Game' }).click();
		await page.getByRole('textbox', { name: 'Game Name' }).fill('Delete Test Game');
		await page.getByRole('button', { name: 'Create Game' }).click();
		await page.getByRole('button', { name: 'Add period at beginning' }).click();
		await page.getByRole('button', { name: 'Add period here' }).first().click();

		// Verify two periods exist
		const periods = page.getByRole('heading', { level: 3 });
		await expect(periods).toHaveCount(2);

		// Delete first period
		await page.getByRole('button', { name: 'New Period' }).first().click();
		await page.getByRole('button', { name: 'Delete' }).click();
		await page.getByRole('button', { name: 'Delete Period' }).click();

		// Verify only one period remains
		await expect(periods).toHaveCount(1);

		// Wait for autosave
		await page.waitForTimeout(1000);

		// Reload
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify deletion persisted
		await expect(periods).toHaveCount(1);
	});

	test('should handle rapid consecutive saves', async ({ page }) => {
		// Create game
		await page.getByRole('button', { name: 'Create New Game' }).click();
		await page.getByRole('textbox', { name: 'Game Name' }).fill('Rapid Save Test');
		await page.getByRole('button', { name: 'Create Game' }).click();

		// Rapidly add multiple periods
		for (let i = 0; i < 5; i++) {
			await page.getByRole('button', { name: /Add period/ }).first().click();
			await page.waitForTimeout(100); // Brief delay between clicks
		}

		// Wait for autosave to complete
		await page.waitForTimeout(1500);

		// Reload
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify all periods persisted
		const periods = page.getByRole('heading', { level: 3 });
		await expect(periods).toHaveCount(5);
	});
});
