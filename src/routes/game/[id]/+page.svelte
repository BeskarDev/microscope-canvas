<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Settings from 'lucide-svelte/icons/settings';
	import { resolve } from '$app/paths';
	import {
		loadGame,
		DatabaseUnavailableError,
		PersistenceError,
		createAutosave
	} from '$lib/services';
	import {
		createNewPeriod,
		createNewEvent,
		createNewScene,
		type Game,
		type Period,
		type Event as GameEvent,
		type Scene
	} from '$lib/types';
	import {
		Canvas,
		Timeline,
		ZoomControls,
		EditItemModal,
		GameSettingsModal,
		DeleteConfirmModal
	} from '$lib/components/canvas';
	import { toast } from '$lib/components/ui/sonner';

	const gameId = $derived($page.params.id ?? '');
	const homeUrl = resolve('/');

	// Zoom levels for zoom-out only (100%, 75%, 50%, 25%)
	const ZOOM_LEVELS = [1, 0.75, 0.5, 0.25];
	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 1;

	// State
	let game = $state<Game | null>(null);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let zoom = $state(1);

	// Edit modal state
	let editModalOpen = $state(false);
	let editItemType = $state<'period' | 'event' | 'scene'>('period');
	let editItem = $state<Period | GameEvent | Scene | null>(null);
	let editItemContext = $state<{ periodId?: string; eventId?: string }>({});

	// Game settings modal state
	let settingsModalOpen = $state(false);

	// Delete confirmation state
	let deleteModalOpen = $state(false);
	let deleteItemType = $state<'period' | 'event' | 'scene'>('period');
	let deleteItemName = $state('');
	let deleteItemHasChildren = $state(false);

	// Autosave handler
	const autosave = createAutosave((error) => {
		toast.error('Failed to save', {
			description: error.message
		});
	});

	// Load game on mount
	onMount(async () => {
		await fetchGame();
	});

	async function fetchGame() {
		if (!gameId) {
			loadError = 'Invalid game URL. Please return to the home page.';
			isLoading = false;
			return;
		}

		isLoading = true;
		loadError = null;

		try {
			game = await loadGame(gameId);
			if (!game) {
				loadError = 'Game not found. It may have been deleted or the link is invalid.';
			}
		} catch (error) {
			if (error instanceof DatabaseUnavailableError) {
				loadError =
					'Local storage is not available. Please check your browser settings or try a different browser.';
			} else if (error instanceof PersistenceError) {
				loadError = 'Failed to load the game. Please try again.';
			} else {
				loadError = 'An unexpected error occurred. Please try again.';
			}
			console.error('Failed to load game:', error);
		} finally {
			isLoading = false;
		}
	}

	function triggerAutosave() {
		if (game) {
			// Create a plain object copy to avoid issues with Svelte proxies in IndexedDB
			// Use JSON round-trip to ensure we get a plain object without Svelte proxies
			const plainGame = JSON.parse(JSON.stringify(game));
			// Update timestamp on the plain copy
			plainGame.updatedAt = new Date().toISOString();
			autosave.save(plainGame);
		}
	}

	// Zoom controls
	function handleZoomIn() {
		const currentIndex = ZOOM_LEVELS.indexOf(zoom);
		if (currentIndex > 0) {
			zoom = ZOOM_LEVELS[currentIndex - 1];
		}
	}

	function handleZoomOut() {
		const currentIndex = ZOOM_LEVELS.indexOf(zoom);
		if (currentIndex < ZOOM_LEVELS.length - 1) {
			zoom = ZOOM_LEVELS[currentIndex + 1];
		}
	}

	function handleZoomReset() {
		zoom = 1;
	}

	// Add item handlers
	function handleAddPeriod(index: number) {
		if (!game) return;
		const period = createNewPeriod('New Period');
		game.periods.splice(index, 0, period);
		game = game; // Trigger reactivity
		triggerAutosave();
	}

	function handleAddEvent(periodId: string) {
		if (!game) return;
		const period = game.periods.find((p) => p.id === periodId);
		if (!period) return;

		const event = createNewEvent('New Event');
		period.events.push(event);
		game = game;
		triggerAutosave();
	}

	function handleAddScene(periodId: string, eventId: string) {
		if (!game) return;
		const period = game.periods.find((p) => p.id === periodId);
		if (!period) return;

		const event = period.events.find((e) => e.id === eventId);
		if (!event) return;

		const scene = createNewScene('New Scene');
		event.scenes.push(scene);
		game = game;
		triggerAutosave();
	}

	// Select item handlers (open edit modal)
	function handleSelectPeriod(period: Period) {
		editItemType = 'period';
		editItem = period;
		editItemContext = {};
		editModalOpen = true;
	}

	function handleSelectEvent(periodId: string, event: GameEvent) {
		editItemType = 'event';
		editItem = event;
		editItemContext = { periodId };
		editModalOpen = true;
	}

	function handleSelectScene(periodId: string, eventId: string, scene: Scene) {
		editItemType = 'scene';
		editItem = scene;
		editItemContext = { periodId, eventId };
		editModalOpen = true;
	}

	// Save item changes
	function handleSaveItem(updates: Partial<Period | GameEvent | Scene>) {
		if (!game || !editItem) return;

		const itemId = editItem.id;

		if (editItemType === 'period') {
			const period = game.periods.find((p) => p.id === itemId);
			if (period) {
				Object.assign(period, updates, { updatedAt: new Date().toISOString() });
			}
		} else if (editItemType === 'event') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			const event = period?.events.find((e) => e.id === itemId);
			if (event) {
				Object.assign(event, updates, { updatedAt: new Date().toISOString() });
			}
		} else if (editItemType === 'scene') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			const event = period?.events.find((e) => e.id === editItemContext.eventId);
			const scene = event?.scenes.find((s) => s.id === itemId);
			if (scene) {
				Object.assign(scene, updates, { updatedAt: new Date().toISOString() });
			}
		}

		game = game;
		triggerAutosave();
	}

	// Delete item
	function handleDeleteClick() {
		if (!editItem) return;

		deleteItemType = editItemType;
		deleteItemName = editItem.name;

		if (editItemType === 'period') {
			const period = editItem as Period;
			deleteItemHasChildren = period.events.length > 0;
		} else if (editItemType === 'event') {
			const event = editItem as GameEvent;
			deleteItemHasChildren = event.scenes.length > 0;
		} else {
			deleteItemHasChildren = false;
		}

		editModalOpen = false;
		deleteModalOpen = true;
	}

	function handleConfirmDelete() {
		if (!game || !editItem) return;

		const itemId = editItem.id;

		if (editItemType === 'period') {
			game.periods = game.periods.filter((p) => p.id !== itemId);
		} else if (editItemType === 'event') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			if (period) {
				period.events = period.events.filter((e) => e.id !== itemId);
			}
		} else if (editItemType === 'scene') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			const event = period?.events.find((e) => e.id === editItemContext.eventId);
			if (event) {
				event.scenes = event.scenes.filter((s) => s.id !== itemId);
			}
		}

		game = game;
		editItem = null;
		triggerAutosave();
		toast.success(`${editItemType.charAt(0).toUpperCase() + editItemType.slice(1)} deleted`);
	}

	// Game settings
	function handleSaveGameSettings(updates: Partial<Game>) {
		if (!game) return;
		Object.assign(game, updates);
		game = game;
		triggerAutosave();
	}
</script>

<div class="canvas-page">
	<div class="canvas-header">
		<div class="header-left">
			<a href={homeUrl}>
				<Button variant="ghost" size="sm">
					<ArrowLeft class="h-4 w-4" />
					<span class="back-text">Back</span>
				</Button>
			</a>
			{#if game}
				<span class="game-title">{game.name}</span>
				{#if game.focus}
					<span class="focus-indicator" title="Current Focus: {game.focus.name}">
						Focus: {game.focus.name}
					</span>
				{/if}
			{/if}
		</div>

		<div class="header-right">
			{#if game}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => (settingsModalOpen = true)}
					aria-label="Game settings"
				>
					<Settings class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</div>

	<div class="canvas-area">
		{#if isLoading}
			<div class="loading-state">
				<Loader2 class="h-12 w-12 animate-spin" />
				<p class="loading-text">Loading game...</p>
			</div>
		{:else if loadError}
			<div class="error-state">
				<AlertTriangle class="h-12 w-12 error-icon" />
				<h2 class="error-title">Unable to Load Game</h2>
				<p class="error-text">{loadError}</p>
				<div class="error-actions">
					<Button onclick={fetchGame} variant="secondary">Try Again</Button>
					<a href={homeUrl}>
						<Button variant="default">Return Home</Button>
					</a>
				</div>
			</div>
		{:else if game}
			<Canvas {zoom}>
				<Timeline
					{game}
					onAddPeriod={handleAddPeriod}
					onAddEvent={handleAddEvent}
					onAddScene={handleAddScene}
					onSelectPeriod={handleSelectPeriod}
					onSelectEvent={handleSelectEvent}
					onSelectScene={handleSelectScene}
				/>
			</Canvas>

			<!-- Zoom controls -->
			<div class="zoom-controls-container">
				<ZoomControls
					{zoom}
					minZoom={MIN_ZOOM}
					maxZoom={MAX_ZOOM}
					onZoomIn={handleZoomIn}
					onZoomOut={handleZoomOut}
					onReset={handleZoomReset}
				/>
			</div>
		{/if}
	</div>
</div>

<!-- Edit Item Modal -->
<EditItemModal
	open={editModalOpen}
	onOpenChange={(open) => (editModalOpen = open)}
	itemType={editItemType}
	item={editItem}
	onSave={handleSaveItem}
	onDelete={handleDeleteClick}
/>

<!-- Game Settings Modal -->
<GameSettingsModal
	open={settingsModalOpen}
	onOpenChange={(open) => (settingsModalOpen = open)}
	{game}
	onSave={handleSaveGameSettings}
/>

<!-- Delete Confirmation Modal -->
<DeleteConfirmModal
	open={deleteModalOpen}
	onOpenChange={(open) => (deleteModalOpen = open)}
	itemType={deleteItemType}
	itemName={deleteItemName}
	hasChildren={deleteItemHasChildren}
	onConfirm={handleConfirmDelete}
/>

<style>
	.canvas-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.canvas-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background-color: oklch(10% 0.02 265 / 0.5);
		backdrop-filter: blur(8px);
		z-index: 10;
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.game-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.focus-indicator {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		padding: 0.125rem 0.5rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
	}

	.back-text {
		display: none;
	}

	.canvas-area {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.loading-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.loading-state :global(svg) {
		color: var(--color-primary);
	}

	.loading-text {
		color: var(--color-muted-foreground);
	}

	.error-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
	}

	.error-state > div {
		max-width: 400px;
		padding: 2rem;
		border: 1px solid var(--color-destructive);
		border-radius: var(--radius);
		background-color: oklch(from var(--color-destructive) l c h / 0.1);
	}

	.error-state :global(.error-icon) {
		color: var(--color-destructive);
		margin-bottom: 1rem;
	}

	.error-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.error-text {
		color: var(--color-muted-foreground);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.error-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.zoom-controls-container {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		z-index: 10;
	}

	/* Animation for spinner */
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (min-width: 640px) {
		.back-text {
			display: inline;
		}
	}

	@media (max-width: 640px) {
		.canvas-header {
			padding: 0.5rem 0.75rem;
		}

		.game-title {
			font-size: 0.8125rem;
		}

		.focus-indicator {
			display: none;
		}

		.zoom-controls-container {
			bottom: 0.5rem;
			right: 0.5rem;
		}

		.error-actions {
			flex-direction: column;
			width: 100%;
		}

		.error-actions :global(button),
		.error-actions :global(a) {
			width: 100%;
		}
	}
</style>
