<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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
	import Menu from 'lucide-svelte/icons/menu';
	import FileJson from 'lucide-svelte/icons/file-json';
	import FileText from 'lucide-svelte/icons/file-text';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import User from 'lucide-svelte/icons/user';
	import Target from 'lucide-svelte/icons/target';
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
		getLatestSnapshot,
		loadAllSnapshotsForGame,
		downloadGameAsJSON,
		downloadGameAsMarkdown
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
		type SnapshotMetadata,
		type Palette as PaletteType,
		type ReorderPeriodsAction,
		type ReorderEventsAction,
		type ReorderScenesAction
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
	import { deepClone } from '$lib/utils/deep-clone';
	import {
		Canvas,
		Timeline,
		ZoomControls,
		EditItemModal,
		GameSettingsModal,
		DeleteConfirmModal,
		HistoryModal,
		PublishVersionModal,
		ExportMenu,
		PaletteSheet
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

	// Canvas ref for reset position
	let canvasRef = $state<{ resetPosition: () => void } | null>(null);
	let historicalCanvasRef = $state<{ resetPosition: () => void } | null>(null);

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

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	// Palette sheet state
	let paletteSheetOpen = $state(false);

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
	
	// Cleanup on unmount
	onDestroy(() => {
		autosave.cancel(); // Cancel any pending autosave
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
				loadError = 'History not found. It may have been deleted or the link is invalid.';
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
				loadError = 'Failed to load the history. Please try again.';
			} else {
				loadError = 'An unexpected error occurred. Please try again.';
			}
			console.error('Failed to load history:', error);
		} finally {
			isLoading = false;
		}
	}

	function triggerAutosave() {
		if (game) {
			// Create a plain object copy to avoid issues with Svelte proxies in IndexedDB
			const plainGame = deepClone(game);
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
			const plainGame = deepClone(game);
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
			target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

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

	function handleResetPosition() {
		if (isViewingHistory && historicalCanvasRef) {
			historicalCanvasRef.resetPosition();
		} else if (canvasRef) {
			canvasRef.resetPosition();
		}
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
			period: deepClone(period)
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
			event: deepClone(event)
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
			scene: deepClone(scene)
		};

		event.scenes.push(scene);
		game = game;
		recordGameAction(action);
	}

	// Reorder handlers
	function handleReorderPeriods(fromIndex: number, toIndex: number) {
		if (!game) return;
		if (fromIndex === toIndex) return;

		const previousOrder = game.periods.map((p) => p.id);
		const newPeriods = [...game.periods];
		const [movedPeriod] = newPeriods.splice(fromIndex, 1);
		newPeriods.splice(toIndex, 0, movedPeriod);
		const newOrder = newPeriods.map((p) => p.id);

		const action: ReorderPeriodsAction = {
			type: 'REORDER_PERIODS',
			timestamp: new Date().toISOString(),
			previousOrder,
			newOrder
		};

		game.periods = newPeriods;
		game = game;
		recordGameAction(action);
	}

	function handleReorderEvents(periodId: string, fromIndex: number, toIndex: number) {
		if (!game) return;
		if (fromIndex === toIndex) return;

		const period = game.periods.find((p) => p.id === periodId);
		if (!period) return;

		const previousOrder = period.events.map((e) => e.id);
		const newEvents = [...period.events];
		const [movedEvent] = newEvents.splice(fromIndex, 1);
		newEvents.splice(toIndex, 0, movedEvent);
		const newOrder = newEvents.map((e) => e.id);

		const action: ReorderEventsAction = {
			type: 'REORDER_EVENTS',
			timestamp: new Date().toISOString(),
			periodId,
			previousOrder,
			newOrder
		};

		period.events = newEvents;
		game = game;
		recordGameAction(action);
	}

	function handleReorderScenes(
		periodId: string,
		eventId: string,
		fromIndex: number,
		toIndex: number
	) {
		if (!game) return;
		if (fromIndex === toIndex) return;

		const period = game.periods.find((p) => p.id === periodId);
		const event = period?.events.find((e) => e.id === eventId);
		if (!event) return;

		const previousOrder = event.scenes.map((s) => s.id);
		const newScenes = [...event.scenes];
		const [movedScene] = newScenes.splice(fromIndex, 1);
		newScenes.splice(toIndex, 0, movedScene);
		const newOrder = newScenes.map((s) => s.id);

		const action: ReorderScenesAction = {
			type: 'REORDER_SCENES',
			timestamp: new Date().toISOString(),
			periodId,
			eventId,
			previousOrder,
			newOrder
		};

		event.scenes = newScenes;
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
						(previousValues as Record<string, unknown>)[key] = deepClone(period[key]);
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
						(previousValues as Record<string, unknown>)[key] = deepClone(event[key]);
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
						(previousValues as Record<string, unknown>)[key] = deepClone(scene[key]);
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
					period: deepClone(period)
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
						event: deepClone(event)
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
						scene: deepClone(scene)
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
			previousValues.focus = game.focus ? deepClone(game.focus) : undefined;
			newValues.focus = updates.focus;
		}
		if (updates.bigPicture !== undefined) {
			previousValues.bigPicture = game.bigPicture ? deepClone(game.bigPicture) : undefined;
			newValues.bigPicture = updates.bigPicture;
		}
		if (updates.palette !== undefined) {
			previousValues.palette = game.palette ? deepClone(game.palette) : undefined;
			newValues.palette = updates.palette;
		}
		if (updates.legacies !== undefined) {
			previousValues.legacies = deepClone(game.legacies);
			newValues.legacies = updates.legacies;
		}
		if (updates.players !== undefined) {
			previousValues.players = deepClone(game.players);
			newValues.players = updates.players;
		}
		if (updates.activePlayerIndex !== undefined) {
			previousValues.activePlayerIndex = game.activePlayerIndex;
			newValues.activePlayerIndex = updates.activePlayerIndex;
		}
		if (updates.focuses !== undefined) {
			previousValues.focuses = deepClone(game.focuses);
			newValues.focuses = updates.focuses;
		}
		if (updates.currentFocusIndex !== undefined) {
			previousValues.currentFocusIndex = game.currentFocusIndex;
			newValues.currentFocusIndex = updates.currentFocusIndex;
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

	// Player navigation
	function handlePreviousPlayer() {
		if (!game || game.players.length === 0) return;
		const newIndex =
			game.activePlayerIndex <= 0 ? game.players.length - 1 : game.activePlayerIndex - 1;
		handleSaveGameSettings({ activePlayerIndex: newIndex });
	}

	function handleNextPlayer() {
		if (!game || game.players.length === 0) return;
		const newIndex = (game.activePlayerIndex + 1) % game.players.length;
		handleSaveGameSettings({ activePlayerIndex: newIndex });
	}

	// Focus navigation
	function handlePreviousFocus() {
		if (!game || game.focuses.length === 0) return;
		const newIndex =
			game.currentFocusIndex <= 0 ? game.focuses.length - 1 : game.currentFocusIndex - 1;
		handleSaveGameSettings({
			currentFocusIndex: newIndex,
			focus: game.focuses[newIndex]
		});
	}

	function handleNextFocus() {
		if (!game || game.focuses.length === 0) return;
		const newIndex = (game.currentFocusIndex + 1) % game.focuses.length;
		handleSaveGameSettings({
			currentFocusIndex: newIndex,
			focus: game.focuses[newIndex]
		});
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
				const plainGame = deepClone(game);
				const changeSummary = generateChangeSummary(lastPublishedGame, plainGame);
				const currentSnapshot = createSnapshot(
					plainGame,
					'Auto-saved before restore',
					changeSummary
				);
				await createSnapshotRecord(currentSnapshot);

				// Restore the historical version
				const restoredGame = deepClone(snapshot.data);
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

	// Mobile menu handlers
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	async function handleMobileExportJSON() {
		if (!game) return;
		closeMobileMenu();
		try {
			const history = await loadAllSnapshotsForGame(game.id);
			downloadGameAsJSON(game, history);
			const historyNote =
				history.length > 0
					? ` Includes ${history.length} version${history.length > 1 ? 's' : ''} in history.`
					: '';
			toast.success('Export complete', {
				description: `Your history has been exported as JSON.${historyNote}`
			});
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Export failed', {
				description: 'Could not export the history. Please try again.'
			});
		}
	}

	function handleMobileExportMarkdown() {
		if (!game) return;
		closeMobileMenu();
		try {
			downloadGameAsMarkdown(game);
			toast.success('Export complete', {
				description: 'Your history has been exported as Markdown.'
			});
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Export failed', {
				description: 'Could not export the history. Please try again.'
			});
		}
	}

	function handleMobilePublish() {
		closeMobileMenu();
		openPublishModal();
	}

	function handleMobileHistory() {
		closeMobileMenu();
		openHistoryModal();
	}

	function handleMobileSettings() {
		closeMobileMenu();
		settingsModalOpen = true;
	}

	// Palette handler
	function handleSavePalette(palette: PaletteType) {
		handleSaveGameSettings({ palette });
	}

	// Get current palette with defaults
	const currentPalette = $derived<PaletteType>(game?.palette ?? { yes: [], no: [] });

	// Get page title based on game name
	const pageTitle = $derived(
		isViewingHistory && historicalGame
			? `${historicalGame.name} (History) | Microscope Canvas`
			: game
				? `${game.name} | Microscope Canvas`
				: 'Microscope Canvas'
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

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
					<span class="history-indicator"> Viewing History </span>
				{:else if game}
					<span class="game-title">{game.name}</span>
				{/if}
			</div>

			<!-- Player and Focus navigation (center section) -->
			{#if !isViewingHistory && game}
				<div class="header-center">
					<!-- Active Player -->
					{#if game.players && game.players.length > 0}
						<div class="nav-control player-control" title="Active Player">
							<Button
								variant="ghost"
								size="icon"
								class="nav-btn"
								onclick={handlePreviousPlayer}
								aria-label="Previous player"
								title="Previous player"
								disabled={game.players.length <= 1}
							>
								<ChevronLeft class="h-3.5 w-3.5" />
							</Button>
							<div class="nav-label">
								<User class="h-3.5 w-3.5 nav-icon" />
								<span class="nav-text">
									{game.activePlayerIndex >= 0 && game.players[game.activePlayerIndex]
										? game.players[game.activePlayerIndex].name
										: 'No player'}
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon"
								class="nav-btn"
								onclick={handleNextPlayer}
								aria-label="Next player"
								title="Next player"
								disabled={game.players.length <= 1}
							>
								<ChevronRight class="h-3.5 w-3.5" />
							</Button>
						</div>
					{/if}

					<!-- Current Focus -->
					{#if game.focuses && game.focuses.length > 0}
						<div class="nav-control focus-control" title="Current Focus">
							<Button
								variant="ghost"
								size="icon"
								class="nav-btn"
								onclick={handlePreviousFocus}
								aria-label="Previous focus"
								title="Previous focus"
								disabled={game.focuses.length <= 1}
							>
								<ChevronLeft class="h-3.5 w-3.5" />
							</Button>
							<div class="nav-label">
								<Target class="h-3.5 w-3.5 nav-icon" />
								<span class="nav-text">
									{game.currentFocusIndex >= 0 && game.focuses[game.currentFocusIndex]
										? game.focuses[game.currentFocusIndex].name
										: 'No focus'}
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon"
								class="nav-btn"
								onclick={handleNextFocus}
								aria-label="Next focus"
								title="Next focus"
								disabled={game.focuses.length <= 1}
							>
								<ChevronRight class="h-3.5 w-3.5" />
							</Button>
						</div>
					{:else if game.focus}
						<!-- Fallback for legacy focus field -->
						<div class="focus-indicator" title="Current Focus: {game.focus.name}">
							<Target class="h-3.5 w-3.5" />
							{game.focus.name}
						</div>
					{/if}
				</div>
			{/if}

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
					<!-- Undo/Redo buttons (always visible) -->
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

					<!-- Desktop controls (hidden on mobile) -->
					<div class="desktop-controls">
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
							aria-label="History settings"
							title="History settings"
						>
							<Settings class="h-4 w-4" />
						</Button>
					</div>

					<!-- Mobile menu button (hidden on desktop) -->
					<div class="mobile-menu-container">
						<Button
							variant="ghost"
							size="sm"
							onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
							aria-label="Menu"
							aria-haspopup="menu"
							aria-expanded={mobileMenuOpen}
						>
							<Menu class="h-4 w-4" />
						</Button>

						{#if mobileMenuOpen}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="mobile-menu-backdrop"
								onclick={closeMobileMenu}
								onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}
							></div>
							<div class="mobile-dropdown" role="menu">
								<button
									type="button"
									class="mobile-menu-item"
									onclick={handleMobilePublish}
									role="menuitem"
								>
									<Bookmark class="h-4 w-4" />
									<span>Publish Version</span>
								</button>
								<button
									type="button"
									class="mobile-menu-item"
									onclick={handleMobileHistory}
									role="menuitem"
								>
									<History class="h-4 w-4" />
									<span>Version History</span>
								</button>
								<div class="mobile-menu-divider"></div>
								<button
									type="button"
									class="mobile-menu-item"
									onclick={handleMobileExportJSON}
									role="menuitem"
								>
									<FileJson class="h-4 w-4" />
									<span>Export as JSON</span>
								</button>
								<button
									type="button"
									class="mobile-menu-item"
									onclick={handleMobileExportMarkdown}
									role="menuitem"
								>
									<FileText class="h-4 w-4" />
									<span>Export as Markdown</span>
								</button>
								<div class="mobile-menu-divider"></div>
								<button
									type="button"
									class="mobile-menu-item"
									onclick={handleMobileSettings}
									role="menuitem"
								>
									<Settings class="h-4 w-4" />
									<span>History Settings</span>
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Mobile floating indicators for player and focus -->
	{#if !isViewingHistory && game}
		<div class="mobile-info-bar">
			{#if game.players && game.players.length > 0}
				<button type="button" class="mobile-info-item player-info" onclick={handleNextPlayer}>
					<User class="h-3.5 w-3.5" />
					<span class="info-label">
						{game.activePlayerIndex >= 0 && game.players[game.activePlayerIndex]
							? game.players[game.activePlayerIndex].name
							: 'No player'}
					</span>
				</button>
			{/if}
			{#if game.focuses && game.focuses.length > 0}
				<button type="button" class="mobile-info-item focus-info" onclick={handleNextFocus}>
					<Target class="h-3.5 w-3.5" />
					<span class="info-label">
						{game.currentFocusIndex >= 0 && game.focuses[game.currentFocusIndex]
							? game.focuses[game.currentFocusIndex].name
							: 'No focus'}
					</span>
				</button>
			{:else if game.focus}
				<div class="mobile-info-item focus-info">
					<Target class="h-3.5 w-3.5" />
					<span class="info-label">{game.focus.name}</span>
				</div>
			{/if}
		</div>
	{/if}

	<div class="canvas-area" class:historical-view={isViewingHistory}>
		{#if isLoading}
			<div class="loading-state">
				<Loader2 class="h-12 w-12 animate-spin" />
				<p class="loading-text">Loading history...</p>
			</div>
		{:else if loadError}
			<div class="error-state">
				<AlertTriangle class="h-12 w-12 error-icon" />
				<h2 class="error-title">Unable to Load History</h2>
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
			<Canvas bind:this={historicalCanvasRef} {zoom} onZoomChange={handleZoomChange}>
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
					onResetPosition={handleResetPosition}
				/>
			</div>
		{:else if game}
			<Canvas bind:this={canvasRef} {zoom} onZoomChange={handleZoomChange}>
				<Timeline
					{game}
					onAddPeriod={handleAddPeriod}
					onAddEvent={handleAddEvent}
					onAddScene={handleAddScene}
					onSelectPeriod={handleSelectPeriod}
					onSelectEvent={handleSelectEvent}
					onSelectScene={handleSelectScene}
					onReorderPeriods={handleReorderPeriods}
					onReorderEvents={handleReorderEvents}
					onReorderScenes={handleReorderScenes}
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
					onResetPosition={handleResetPosition}
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

<!-- Palette Sheet -->
<PaletteSheet
	open={paletteSheetOpen}
	onOpenChange={(open) => (paletteSheetOpen = open)}
	palette={currentPalette}
	onSave={handleSavePalette}
/>

<style>
	.canvas-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	/*
	 * Game header uses a nested structure (.canvas-header > .canvas-header-content)
	 * to match the global app header pattern. The outer container spans full width
	 * with centered content, while inner content has max-width: 1400px to align
	 * with the main Header component in +layout.svelte.
	 */
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

	.desktop-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* Center section with player/focus navigation */
	.header-center {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-control {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		padding: 0.125rem;
	}

	.nav-control :global(.nav-btn) {
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
	}

	.nav-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		min-width: 0;
	}

	.nav-label :global(.nav-icon) {
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.player-control :global(.nav-icon) {
		color: oklch(70% 0.15 200);
	}

	.focus-control :global(.nav-icon) {
		color: oklch(70% 0.15 50);
	}

	.nav-text {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-foreground);
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mobile-menu-container {
		display: none;
		position: relative;
	}

	.mobile-menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
	}

	.mobile-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.25rem;
		min-width: 200px;
		background-color: var(--color-popover);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: 0 4px 12px oklch(0% 0 0 / 0.3);
		z-index: 50;
		overflow: hidden;
	}

	.mobile-menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		text-align: left;
		color: var(--color-popover-foreground);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.mobile-menu-item:hover {
		background-color: var(--color-accent);
	}

	.mobile-menu-item :global(svg) {
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.mobile-menu-divider {
		height: 1px;
		background-color: var(--color-border);
		margin: 0.25rem 0;
	}

	.game-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.focus-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		padding: 0.25rem 0.5rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
	}

	.focus-indicator :global(svg) {
		flex-shrink: 0;
		color: oklch(70% 0.15 50);
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
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 10;
	}

	/* Mobile info bar for player/focus - hidden on desktop */
	.mobile-info-bar {
		display: none;
		flex-shrink: 0;
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

		.header-center {
			display: none;
		}

		.desktop-controls {
			display: none;
		}

		.mobile-menu-container {
			display: block;
		}

		.mobile-info-bar {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			padding: 0.5rem 0.75rem;
			background-color: oklch(10% 0.02 265 / 0.8);
			backdrop-filter: blur(8px);
			border-bottom: 1px solid var(--color-border);
			flex-shrink: 0;
		}

		.mobile-info-item {
			display: flex;
			align-items: center;
			gap: 0.375rem;
			padding: 0.375rem 0.625rem;
			background-color: var(--color-muted);
			border: none;
			border-radius: var(--radius);
			font-size: 0.75rem;
			font-weight: 500;
			color: var(--color-foreground);
			cursor: pointer;
			transition: background-color 0.15s;
		}

		.mobile-info-item:hover {
			background-color: var(--color-accent);
		}

		.mobile-info-item.player-info :global(svg) {
			color: oklch(70% 0.15 200);
		}

		.mobile-info-item.focus-info :global(svg) {
			color: oklch(70% 0.15 50);
		}

		.info-label {
			max-width: 100px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
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

	/* Show header center on tablets */
	@media (min-width: 768px) {
		.header-center {
			display: flex;
		}

		.nav-text {
			max-width: 120px;
		}
	}

	@media (min-width: 1024px) {
		.nav-text {
			max-width: 160px;
		}
	}
</style>
