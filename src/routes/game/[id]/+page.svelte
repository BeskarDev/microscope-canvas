<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Settings from 'lucide-svelte/icons/settings';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import Redo2 from 'lucide-svelte/icons/redo-2';
	import History from 'lucide-svelte/icons/history';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import ArrowLeftToLine from 'lucide-svelte/icons/arrow-left-to-line';
	import { resolve } from '$app/paths';
	import {
		loadGame,
		DatabaseUnavailableError,
		PersistenceError,
		createAutosave,
		createSnapshotRecord,
		loadSnapshot,
		listSnapshotsForGame,
		enforceSnapshotLimit,
		getLatestSnapshot
	} from '$lib/services';
	import {
		createNewPeriod,
		createNewEvent,
		createNewScene,
		createSnapshot,
		generateChangeSummary,
		type Game,
		type Period,
		type Event as GameEvent,
		type Scene,
		type GameAction,
		type CreatePeriodAction,
		type DeletePeriodAction,
		type EditPeriodAction,
		type CreateEventAction,
		type DeleteEventAction,
		type EditEventAction,
		type CreateSceneAction,
		type DeleteSceneAction,
		type EditSceneAction,
		type EditGameMetadataAction,
		type SnapshotMetadata
	} from '$lib/types';
	import {
		createHistoryState,
		recordAction,
		popUndo,
		popRedo,
		canUndo,
		canRedo,
		clearHistory,
		type HistoryState
	} from '$lib/stores';
	import { applyAction, reverseAction } from '$lib/utils';
	import {
		Canvas,
		Timeline,
		ZoomControls,
		EditItemModal,
		GameSettingsModal,
		DeleteConfirmModal,
		HistoryModal,
		PublishVersionModal,
		ExportMenu
	} from '$lib/components/canvas';
	import { toast } from '$lib/components/ui/sonner';

	const gameId = $derived($page.params.id ?? '');
	const homeUrl = resolve('/');

	// Zoom levels: 200%, 175%, 150%, 125%, 100%, 75%, 50%, 25%
	const ZOOM_LEVELS = [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25];
	const MIN_ZOOM = 0.25;
	const MAX_ZOOM = 2;

	// State
	let game = $state<Game | null>(null);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);
	let zoom = $state(1);

	// Undo/Redo history state
	let historyState = $state<HistoryState>(createHistoryState());
	const canUndoAction = $derived(canUndo(historyState));
	const canRedoAction = $derived(canRedo(historyState));

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

	// History modal state
	let historyModalOpen = $state(false);
	let snapshots = $state<SnapshotMetadata[]>([]);
	let snapshotsLoading = $state(false);
	let snapshotsError = $state<string | null>(null);

	// Historical view state
	let isViewingHistory = $state(false);
	let historicalGame = $state<Game | null>(null);
	let currentSnapshotId = $state<string | null>(null);

	// Publish version modal state
	let publishModalOpen = $state(false);
	let isPublishing = $state(false);
	let lastPublishedGame = $state<Game | null>(null);

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
			} else {
				// Load the latest snapshot to track changes since last publish
				const latestSnapshot = await getLatestSnapshot(gameId);
				if (latestSnapshot) {
					lastPublishedGame = latestSnapshot.data;
				}
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
			const plainGame = JSON.parse(JSON.stringify(game)) as Game;
			// Update timestamp on the plain copy
			plainGame.updatedAt = new Date().toISOString();
			autosave.save(plainGame);
		}
	}

	/**
	 * Opens the publish version modal
	 */
	function openPublishModal() {
		publishModalOpen = true;
	}

	/**
	 * Generate a default version name
	 */
	function getDefaultVersionName(): string {
		const now = new Date();
		return now.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * Get the change summary for the publish modal
	 */
	function getCurrentChangeSummary(): string {
		if (!game) return '';
		return generateChangeSummary(lastPublishedGame, game);
	}

	/**
	 * Publishes the current game state as a new version
	 */
	async function handlePublishVersion(versionName: string) {
		if (!game || isPublishing) return;

		isPublishing = true;

		try {
			const plainGame = JSON.parse(JSON.stringify(game)) as Game;
			const changeSummary = generateChangeSummary(lastPublishedGame, plainGame);
			const snapshot = createSnapshot(plainGame, versionName, changeSummary);
			await createSnapshotRecord(snapshot);
			await enforceSnapshotLimit(plainGame.id);

			// Update the last published game
			lastPublishedGame = plainGame;

			toast.success('Version published', {
				description: `"${versionName}" has been saved to your version history.`
			});

			publishModalOpen = false;
		} catch (error) {
			console.error('Failed to publish version:', error);
			toast.error('Failed to publish version', {
				description: 'Could not save the version. Please try again.'
			});
		} finally {
			isPublishing = false;
		}
	}

	/**
	 * Records an action to history and triggers autosave
	 */
	function recordGameAction(action: GameAction) {
		historyState = recordAction(historyState, action);
		triggerAutosave();
	}

	/**
	 * Handles undo action
	 */
	function handleUndo() {
		if (!game || !canUndoAction) return;

		const result = popUndo(historyState);
		if (result) {
			historyState = result.newState;
			game = reverseAction(game, result.action);
			triggerAutosave();
		}
	}

	/**
	 * Handles redo action
	 */
	function handleRedo() {
		if (!game || !canRedoAction) return;

		const result = popRedo(historyState);
		if (result) {
			historyState = result.newState;
			game = applyAction(game, result.action);
			triggerAutosave();
		}
	}

	/**
	 * Keyboard shortcuts for undo/redo
	 */
	function handleGlobalKeyDown(e: KeyboardEvent) {
		// Check if user is in a text input
		const target = e.target as HTMLElement;
		const isTextInput =
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable;

		// Don't intercept when in text input (let browser handle native undo)
		if (isTextInput) return;

		const isMac = navigator.platform.toUpperCase().includes('MAC');
		const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

		if (cmdOrCtrl && !e.altKey) {
			if (e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				handleUndo();
			} else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
				e.preventDefault();
				handleRedo();
			}
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

	function handleZoomChange(newZoom: number) {
		zoom = newZoom;
	}

	// Add item handlers
	function handleAddPeriod(index: number) {
		if (!game) return;
		const period = createNewPeriod('New Period');
		
		// Create action for undo
		const action: CreatePeriodAction = {
			type: 'CREATE_PERIOD',
			timestamp: new Date().toISOString(),
			periodId: period.id,
			index,
			period: JSON.parse(JSON.stringify(period))
		};

		game.periods.splice(index, 0, period);
		game = game; // Trigger reactivity
		recordGameAction(action);
	}

	function handleAddEvent(periodId: string) {
		if (!game) return;
		const period = game.periods.find((p) => p.id === periodId);
		if (!period) return;

		const event = createNewEvent('New Event');
		const index = period.events.length;

		// Create action for undo
		const action: CreateEventAction = {
			type: 'CREATE_EVENT',
			timestamp: new Date().toISOString(),
			periodId,
			eventId: event.id,
			index,
			event: JSON.parse(JSON.stringify(event))
		};

		period.events.push(event);
		game = game;
		recordGameAction(action);
	}

	function handleAddScene(periodId: string, eventId: string) {
		if (!game) return;
		const period = game.periods.find((p) => p.id === periodId);
		if (!period) return;

		const event = period.events.find((e) => e.id === eventId);
		if (!event) return;

		const scene = createNewScene('New Scene');
		const index = event.scenes.length;

		// Create action for undo
		const action: CreateSceneAction = {
			type: 'CREATE_SCENE',
			timestamp: new Date().toISOString(),
			periodId,
			eventId,
			sceneId: scene.id,
			index,
			scene: JSON.parse(JSON.stringify(scene))
		};

		event.scenes.push(scene);
		game = game;
		recordGameAction(action);
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
				// Create action for undo - store previous values
				const periodUpdates = updates as Partial<Period>;
				const previousValues: Partial<Period> = {};
				const newValues: Partial<Period> = {};
				for (const key of Object.keys(periodUpdates) as (keyof Period)[]) {
					if (key in period && key in periodUpdates) {
						(previousValues as Record<string, unknown>)[key] = JSON.parse(
							JSON.stringify(period[key])
						);
						(newValues as Record<string, unknown>)[key] = periodUpdates[key];
					}
				}

				const action: EditPeriodAction = {
					type: 'EDIT_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: itemId,
					previousValues,
					newValues
				};

				Object.assign(period, updates, { updatedAt: new Date().toISOString() });
				recordGameAction(action);
			}
		} else if (editItemType === 'event') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			const event = period?.events.find((e) => e.id === itemId);
			if (event && editItemContext.periodId) {
				// Create action for undo - store previous values
				const eventUpdates = updates as Partial<GameEvent>;
				const previousValues: Partial<GameEvent> = {};
				const newValues: Partial<GameEvent> = {};
				for (const key of Object.keys(eventUpdates) as (keyof GameEvent)[]) {
					if (key in event && key in eventUpdates) {
						(previousValues as Record<string, unknown>)[key] = JSON.parse(
							JSON.stringify(event[key])
						);
						(newValues as Record<string, unknown>)[key] = eventUpdates[key];
					}
				}

				const action: EditEventAction = {
					type: 'EDIT_EVENT',
					timestamp: new Date().toISOString(),
					periodId: editItemContext.periodId,
					eventId: itemId,
					previousValues,
					newValues
				};

				Object.assign(event, updates, { updatedAt: new Date().toISOString() });
				recordGameAction(action);
			}
		} else if (editItemType === 'scene') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			const event = period?.events.find((e) => e.id === editItemContext.eventId);
			const scene = event?.scenes.find((s) => s.id === itemId);
			if (scene && editItemContext.periodId && editItemContext.eventId) {
				// Create action for undo - store previous values
				const sceneUpdates = updates as Partial<Scene>;
				const previousValues: Partial<Scene> = {};
				const newValues: Partial<Scene> = {};
				for (const key of Object.keys(sceneUpdates) as (keyof Scene)[]) {
					if (key in scene && key in sceneUpdates) {
						(previousValues as Record<string, unknown>)[key] = JSON.parse(
							JSON.stringify(scene[key])
						);
						(newValues as Record<string, unknown>)[key] = sceneUpdates[key];
					}
				}

				const action: EditSceneAction = {
					type: 'EDIT_SCENE',
					timestamp: new Date().toISOString(),
					periodId: editItemContext.periodId,
					eventId: editItemContext.eventId,
					sceneId: itemId,
					previousValues,
					newValues
				};

				Object.assign(scene, updates, { updatedAt: new Date().toISOString() });
				recordGameAction(action);
			}
		}

		game = game;
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
			const periodIndex = game.periods.findIndex((p) => p.id === itemId);
			const period = game.periods[periodIndex];
			if (period && periodIndex >= 0) {
				// Create action for undo - store deleted period
				const action: DeletePeriodAction = {
					type: 'DELETE_PERIOD',
					timestamp: new Date().toISOString(),
					periodId: itemId,
					index: periodIndex,
					period: JSON.parse(JSON.stringify(period))
				};

				game.periods = game.periods.filter((p) => p.id !== itemId);
				recordGameAction(action);
			}
		} else if (editItemType === 'event') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			if (period && editItemContext.periodId) {
				const eventIndex = period.events.findIndex((e) => e.id === itemId);
				const event = period.events[eventIndex];
				if (event && eventIndex >= 0) {
					// Create action for undo - store deleted event
					const action: DeleteEventAction = {
						type: 'DELETE_EVENT',
						timestamp: new Date().toISOString(),
						periodId: editItemContext.periodId,
						eventId: itemId,
						index: eventIndex,
						event: JSON.parse(JSON.stringify(event))
					};

					period.events = period.events.filter((e) => e.id !== itemId);
					recordGameAction(action);
				}
			}
		} else if (editItemType === 'scene') {
			const period = game.periods.find((p) => p.id === editItemContext.periodId);
			const event = period?.events.find((e) => e.id === editItemContext.eventId);
			if (event && editItemContext.periodId && editItemContext.eventId) {
				const sceneIndex = event.scenes.findIndex((s) => s.id === itemId);
				const scene = event.scenes[sceneIndex];
				if (scene && sceneIndex >= 0) {
					// Create action for undo - store deleted scene
					const action: DeleteSceneAction = {
						type: 'DELETE_SCENE',
						timestamp: new Date().toISOString(),
						periodId: editItemContext.periodId,
						eventId: editItemContext.eventId,
						sceneId: itemId,
						index: sceneIndex,
						scene: JSON.parse(JSON.stringify(scene))
					};

					event.scenes = event.scenes.filter((s) => s.id !== itemId);
					recordGameAction(action);
				}
			}
		}

		game = game;
		editItem = null;
		toast.success(`${editItemType.charAt(0).toUpperCase() + editItemType.slice(1)} deleted`);
	}

	// Game settings
	function handleSaveGameSettings(updates: Partial<Game>) {
		if (!game) return;

		// Create action for undo - store previous values
		const previousValues: EditGameMetadataAction['previousValues'] = {};
		const newValues: EditGameMetadataAction['newValues'] = {};

		if (updates.name !== undefined) {
			previousValues.name = game.name;
			newValues.name = updates.name;
		}
		if (updates.focus !== undefined) {
			previousValues.focus = game.focus ? JSON.parse(JSON.stringify(game.focus)) : undefined;
			newValues.focus = updates.focus;
		}
		if (updates.bigPicture !== undefined) {
			previousValues.bigPicture = game.bigPicture
				? JSON.parse(JSON.stringify(game.bigPicture))
				: undefined;
			newValues.bigPicture = updates.bigPicture;
		}
		if (updates.palette !== undefined) {
			previousValues.palette = game.palette ? JSON.parse(JSON.stringify(game.palette)) : undefined;
			newValues.palette = updates.palette;
		}

		const action: EditGameMetadataAction = {
			type: 'EDIT_GAME_METADATA',
			timestamp: new Date().toISOString(),
			previousValues,
			newValues
		};

		Object.assign(game, updates);
		game = game;
		recordGameAction(action);
	}

	// History modal handlers
	async function openHistoryModal() {
		historyModalOpen = true;
		snapshotsLoading = true;
		snapshotsError = null;

		try {
			snapshots = await listSnapshotsForGame(gameId);
		} catch (error) {
			console.error('Failed to load snapshots:', error);
			snapshotsError = 'Failed to load version history. Please try again.';
		} finally {
			snapshotsLoading = false;
		}
	}

	async function handleViewSnapshot(snapshotId: string) {
		try {
			const snapshot = await loadSnapshot(snapshotId);
			if (snapshot) {
				isViewingHistory = true;
				historicalGame = snapshot.data;
				currentSnapshotId = snapshotId;
				historyModalOpen = false;
			}
		} catch (error) {
			console.error('Failed to load snapshot:', error);
			toast.error('Failed to load version', {
				description: 'Could not load the selected version. Please try again.'
			});
		}
	}

	async function handleRestoreSnapshot(snapshotId: string) {
		if (!game) return;

		try {
			const snapshot = await loadSnapshot(snapshotId);
			if (snapshot) {
				// Create a snapshot of current state before restoring (auto-save current state)
				const plainGame = JSON.parse(JSON.stringify(game)) as Game;
				const changeSummary = generateChangeSummary(lastPublishedGame, plainGame);
				const currentSnapshot = createSnapshot(plainGame, 'Auto-saved before restore', changeSummary);
				await createSnapshotRecord(currentSnapshot);

				// Restore the historical version
				const restoredGame = JSON.parse(JSON.stringify(snapshot.data)) as Game;
				restoredGame.updatedAt = new Date().toISOString();
				game = restoredGame;

				// Update lastPublishedGame to the restored version
				lastPublishedGame = snapshot.data;

				// Clear undo/redo history since we're at a new state
				historyState = clearHistory(historyState);

				// Trigger autosave
				triggerAutosave();

				// Close modals and return to editing
				historyModalOpen = false;
				isViewingHistory = false;
				historicalGame = null;
				currentSnapshotId = null;

				toast.success('Version restored', {
					description: 'The selected version has been restored. Your previous state was saved.'
				});
			}
		} catch (error) {
			console.error('Failed to restore snapshot:', error);
			toast.error('Failed to restore version', {
				description: 'Could not restore the selected version. Please try again.'
			});
		}
	}

	function exitHistoryView() {
		isViewingHistory = false;
		historicalGame = null;
		currentSnapshotId = null;
	}
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<div class="canvas-page">
	<div class="canvas-header">
		<div class="canvas-header-content">
			<div class="header-left">
				{#if isViewingHistory}
					<Button variant="ghost" size="sm" onclick={exitHistoryView}>
						<ArrowLeftToLine class="h-4 w-4" />
						<span class="back-text">Return to Current</span>
					</Button>
				{:else}
					<a href={homeUrl}>
						<Button variant="ghost" size="sm">
							<ArrowLeft class="h-4 w-4" />
							<span class="back-text">Back</span>
						</Button>
					</a>
				{/if}
				{#if isViewingHistory && historicalGame}
					<span class="game-title">{historicalGame.name}</span>
					<span class="history-indicator">
						Viewing History
					</span>
				{:else if game}
					<span class="game-title">{game.name}</span>
					{#if game.focus}
						<span class="focus-indicator" title="Current Focus: {game.focus.name}">
							Focus: {game.focus.name}
						</span>
					{/if}
				{/if}
			</div>

			<div class="header-right">
				{#if isViewingHistory && currentSnapshotId}
					<Button
						variant="default"
						size="sm"
						onclick={() => handleRestoreSnapshot(currentSnapshotId!)}
					>
						Restore This Version
					</Button>
				{:else if game}
					<!-- Undo/Redo buttons -->
					<div class="undo-redo-controls">
						<Button
							variant="ghost"
							size="sm"
							onclick={handleUndo}
							disabled={!canUndoAction}
							aria-label="Undo"
							title="Undo (Ctrl+Z)"
						>
							<Undo2 class="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onclick={handleRedo}
							disabled={!canRedoAction}
							aria-label="Redo"
							title="Redo (Ctrl+Shift+Z)"
						>
							<Redo2 class="h-4 w-4" />
						</Button>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onclick={openPublishModal}
						aria-label="Publish version"
						title="Publish version"
					>
						<Bookmark class="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onclick={openHistoryModal}
						aria-label="Version history"
						title="Version history"
					>
						<History class="h-4 w-4" />
					</Button>
					<ExportMenu {game} />
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
	</div>

	<div class="canvas-area" class:historical-view={isViewingHistory}>
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
		{:else if isViewingHistory && historicalGame}
			<!-- Historical view (read-only) -->
			<Canvas {zoom} onZoomChange={handleZoomChange}>
				<Timeline
					game={historicalGame}
					onAddPeriod={() => {}}
					onAddEvent={() => {}}
					onAddScene={() => {}}
					onSelectPeriod={() => {}}
					onSelectEvent={() => {}}
					onSelectScene={() => {}}
				/>
			</Canvas>

			<!-- Historical view overlay -->
			<div class="historical-overlay">
				<span class="historical-label">Read-Only Historical View</span>
			</div>

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
		{:else if game}
			<Canvas {zoom} onZoomChange={handleZoomChange}>
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

<!-- History Modal -->
<HistoryModal
	open={historyModalOpen}
	onOpenChange={(open) => (historyModalOpen = open)}
	{snapshots}
	isLoading={snapshotsLoading}
	error={snapshotsError}
	onView={handleViewSnapshot}
	onRestore={handleRestoreSnapshot}
/>

<!-- Publish Version Modal -->
<PublishVersionModal
	open={publishModalOpen}
	onOpenChange={(open) => (publishModalOpen = open)}
	defaultName={getDefaultVersionName()}
	changeSummary={getCurrentChangeSummary()}
	onPublish={handlePublishVersion}
	{isPublishing}
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
		justify-content: center;
		padding: 0 1rem;
		border-bottom: 1px solid var(--color-border);
		background-color: oklch(10% 0.02 265 / 0.5);
		backdrop-filter: blur(8px);
		z-index: 10;
		flex-shrink: 0;
	}

	.canvas-header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1400px;
		width: 100%;
		padding: 0.5rem 0;
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

	.undo-redo-controls {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding-right: 0.5rem;
		border-right: 1px solid var(--color-border);
		margin-right: 0.25rem;
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

	.history-indicator {
		font-size: 0.75rem;
		color: oklch(85% 0.15 50);
		padding: 0.125rem 0.5rem;
		background-color: oklch(45% 0.15 50 / 0.2);
		border: 1px solid oklch(45% 0.15 50 / 0.4);
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

	.canvas-area.historical-view {
		background-color: oklch(from var(--color-background) calc(l + 0.03) c h);
	}

	.historical-overlay {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		padding: 0.5rem 1rem;
		background-color: oklch(45% 0.15 50 / 0.9);
		color: white;
		border-radius: var(--radius);
		font-size: 0.875rem;
		font-weight: 500;
		pointer-events: none;
	}

	.historical-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
