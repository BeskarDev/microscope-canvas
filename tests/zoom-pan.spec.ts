import { test, expect } from '@playwright/test';

/**
 * E2E tests for canvas zoom and pan functionality
 */

test.describe('Canvas Zoom Controls', () => {
	test.beforeEach(async ({ page }) => {
		// Create a test game and navigate to canvas
		await page.goto('/');
		await page.getByRole('button', { name: 'Create New History' }).click();
		await page.getByRole('textbox', { name: 'History Name' }).fill('Zoom Test Game');
		await page.getByRole('button', { name: 'Create History' }).click();
		await expect(page).toHaveURL(/\/game\//);
	});

	test('zoom controls should be visible on desktop', async ({ page }) => {
		// Verify zoom controls are visible
		await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Reset zoom' })).toBeVisible();
		await expect(page.getByText('100%')).toBeVisible();
	});

	test('zoom controls should be visible on mobile', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Verify zoom controls are visible
		await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Reset zoom' })).toBeVisible();

		// Verify they're in viewport (not requiring scroll)
		const zoomButton = page.getByRole('button', { name: 'Zoom out' });
		const boundingBox = await zoomButton.boundingBox();
		expect(boundingBox).not.toBeNull();
		if (boundingBox) {
			expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(667);
		}
	});

	test('should zoom out when clicking zoom out button', async ({ page }) => {
		// Initial zoom should be 100%
		await expect(page.getByText('100%')).toBeVisible();

		// Click zoom out
		await page.getByRole('button', { name: 'Zoom out' }).click();

		// Verify zoom changed to 75%
		await expect(page.getByText('75%')).toBeVisible();
	});

	test('should zoom in when clicking zoom in button', async ({ page }) => {
		// First zoom out
		await page.getByRole('button', { name: 'Zoom out' }).click();
		await expect(page.getByText('75%')).toBeVisible();

		// Then zoom in
		await page.getByRole('button', { name: 'Zoom in' }).click();

		// Should be back to 100%
		await expect(page.getByText('100%')).toBeVisible();
	});

	test('should reset zoom when clicking reset button', async ({ page }) => {
		// Zoom out twice
		await page.getByRole('button', { name: 'Zoom out' }).click();
		await page.getByRole('button', { name: 'Zoom out' }).click();
		await expect(page.getByText('50%')).toBeVisible();

		// Reset zoom
		await page.getByRole('button', { name: 'Reset zoom' }).click();

		// Should be back to 100%
		await expect(page.getByText('100%')).toBeVisible();
	});

	test('should disable zoom in at 200%', async ({ page }) => {
		// Zoom in to maximum (200%)
		await page.getByRole('button', { name: 'Zoom in' }).click(); // 125%
		await page.getByRole('button', { name: 'Zoom in' }).click(); // 150%
		await page.getByRole('button', { name: 'Zoom in' }).click(); // 175%
		await page.getByRole('button', { name: 'Zoom in' }).click(); // 200%

		await expect(page.getByText('200%')).toBeVisible();

		// At 200%, zoom in should be disabled
		const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
		await expect(zoomInButton).toBeDisabled();
	});

	test('should disable zoom out at 25%', async ({ page }) => {
		// Zoom out to minimum (25%)
		await page.getByRole('button', { name: 'Zoom out' }).click(); // 75%
		await page.getByRole('button', { name: 'Zoom out' }).click(); // 50%
		await page.getByRole('button', { name: 'Zoom out' }).click(); // 25%

		await expect(page.getByText('25%')).toBeVisible();

		// Zoom out should be disabled
		const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });
		await expect(zoomOutButton).toBeDisabled();
	});

	test('should disable reset button at 100%', async ({ page }) => {
		// At 100%, reset should be disabled
		const resetButton = page.getByRole('button', { name: 'Reset zoom' });
		await expect(resetButton).toBeDisabled();
	});
});

test.describe('Canvas Pan Functionality', () => {
	test.beforeEach(async ({ page }) => {
		// Create a test game with content
		await page.goto('/');
		await page.getByRole('button', { name: 'Create New History' }).click();
		await page.getByRole('textbox', { name: 'History Name' }).fill('Pan Test Game');
		await page.getByRole('button', { name: 'Create History' }).click();
		await expect(page).toHaveURL(/\/game\//);

		// Add some periods to have content to pan
		await page.getByRole('button', { name: 'Add period at beginning' }).click();
		await page.getByRole('button', { name: 'Add period here' }).first().click();
	});

	test('should allow panning the canvas', async ({ page }) => {
		const canvas = page.getByRole('application', { name: 'Timeline canvas' });

		// Get initial position of a period
		const period = page.getByRole('heading', { level: 3 }).first();
		const initialBox = await period.boundingBox();
		expect(initialBox).not.toBeNull();

		// Pan by dragging the canvas
		await canvas.hover({ position: { x: 300, y: 300 } });
		await page.mouse.down();
		await page.mouse.move(400, 400);
		await page.mouse.up();

		// Give it a moment to update
		await page.waitForTimeout(200);

		// Get new position
		const newBox = await period.boundingBox();
		expect(newBox).not.toBeNull();

		// Position should have changed
		if (initialBox && newBox) {
			expect(newBox.x).not.toBe(initialBox.x);
		}
	});

	test('should not pan when clicking on buttons', async ({ page }) => {
		const addButton = page.getByRole('button', { name: 'Add period here' }).first();

		// Get initial state
		const initialPeriodCount = await page.getByRole('heading', { level: 3 }).count();

		// Click add button (should not pan)
		await addButton.click();

		// Should add a period, not pan
		const newPeriodCount = await page.getByRole('heading', { level: 3 }).count();
		expect(newPeriodCount).toBe(initialPeriodCount + 1);
	});

	test('should not pan when clicking on cards', async ({ page }) => {
		const period = page.getByRole('button', { name: 'New Period' }).first();

		// Click on period card
		await period.click();

		// Should open edit modal, not pan
		await expect(page.getByRole('dialog', { name: 'Edit Period' })).toBeVisible();
	});

	test('pan should work on mobile', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		const canvas = page.getByRole('application', { name: 'Timeline canvas' });

		// Get initial position
		const period = page.getByRole('heading', { level: 3 }).first();
		const initialBox = await period.boundingBox();
		expect(initialBox).not.toBeNull();

		// Pan with touch
		await canvas.hover({ position: { x: 150, y: 300 } });
		await page.mouse.down();
		await page.mouse.move(200, 350);
		await page.mouse.up();

		await page.waitForTimeout(200);

		// Position should have changed
		const newBox = await period.boundingBox();
		expect(newBox).not.toBeNull();
		if (initialBox && newBox) {
			expect(newBox.x).not.toBe(initialBox.x);
		}
	});
});
