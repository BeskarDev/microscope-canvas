<script lang="ts">
	/**
	 * Game Page
	 * 
	 * Main entry point for the game editor. This component:
	 * - Orchestrates state from game-state, ui-state, and game-actions
	 * - Handles lifecycle (mount/unmount, autosave)
	 * - Delegates rendering to child components
	 */
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { GameHeader, HeaderActions, MobileInfoBar, CanvasArea, GameModals, GameSheets } from './components';
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
		createSnapshot,
		generateChangeSummary,
		type Game,
		type Period,
		type Event as GameEvent,
		type Scene,
		type Anchor,
		type Palette as PaletteType,
		type Player,
		type Focus,
		type Legacy
	} from '$lib/types';
	import { applyAction, reverseAction } from '$lib/utils';
	import { deepClone } from '$lib/utils/deep-clone';
	import { toast } from '$lib/components/ui/sonner';
	
	// Import state modules
	import {
		gameState,
		snapshotState,
		publishState,
		setGame,
		setLoading,
		setLoadError,
		setLastPublishedGame,
		setViewingHistory,
		setHistoricalGame,
		setCurrentSnapshotId,
		setSnapshots,
		setSnapshotsLoading,
		setSnapshotsError,
		exitHistoryView,
		setPublishing,
		setPublishModalOpen
	} from './state/game-state.svelte';
	
	import {
		MIN_ZOOM,
		MAX_ZOOM,
		canvasState,
		modalState,
		editState,
		deleteState,
		anchorsState,
		setZoom,
		zoomIn,
		zoomOut,
		resetZoom,
		toggleCardReorder,
		setCardReorderToggledBySpace,
		openEditModal,
		setEditModalOpen,
		setSettingsModalOpen,
		openDeleteModal,
		setDeleteModalOpen,
		setHistoryModalOpen,
		setPaletteSheetOpen,
		setPlayersSheetOpen,
		setFocusesSheetOpen,
		setLegaciesSheetOpen,
		setAnchorsSheetOpen,
		openAnchorsSheet
	} from './state/ui-state.svelte';
	
	import {
		historyState,
		canUndo,
		canRedo,
		clearHistory,
		addPeriod,
		addEvent,
		addScene,
		deletePeriod,
		deleteEvent,
		deleteScene,
		editPeriod,
		editEvent,
		editScene,
		reorderPeriods,
		reorderEvents,
		reorderScenes,
		editGameMetadata,
		createAnchor,
		editAnchor,
		deleteAnchor,
		setCurrentAnchor,
		clearCurrentAnchor
	} from './state/game-actions.svelte';

	const gameId = $derived($page.params.id ?? '');

	// Derived state for undo/redo (use functions from game-actions)
	const canUndoAction = $derived(canUndo());
	const canRedoAction = $derived(canRedo());

	// Canvas refs for reset position
	let canvasRef = $state<{ resetPosition: () => void } | null>(null);
	let historicalCanvasRef = $state<{ resetPosition: () => void } | null>(null);

	// Autosave handler
	const autosave = createAutosave((error) => {
		toast.error('Failed to save', { description: error.message });
	});

	// Load game on mount
	onMount(async () => {
		await fetchGame();
	});

	// Cleanup on unmount
	onDestroy(() => {
		autosave.cancel();
	});

	// Blur the anchors button when the sheet opens
	$effect(() => {
		if (modalState.anchorsSheetOpen && typeof document !== 'undefined') {
			setTimeout(() => {
				const activeElement = document.activeElement as HTMLElement;
				if (activeElement && activeElement.getAttribute('aria-label') === 'Anchors') {
					activeElement.blur();
				}
			}, 100);
		}
	});

	// ============================================
	// Data Loading
	// ============================================

	async function fetchGame() {
		if (!gameId) {
			setLoadError('Invalid game URL. Please return to the home page.');
			setLoading(false);
			return;
		}

		setLoading(true);
		setLoadError(null);

		try {
			const loadedGame = await loadGame(gameId);
			if (!loadedGame) {
				setLoadError('History not found. It may have been deleted or the link is invalid.');
			} else {
				setGame(loadedGame);
				const latestSnapshot = await getLatestSnapshot(gameId);
				if (latestSnapshot) {
					setLastPublishedGame(latestSnapshot.data);
				}
			}
		} catch (error) {
			if (error instanceof DatabaseUnavailableError) {
				setLoadError('Local storage is not available. Please check your browser settings.');
			} else if (error instanceof PersistenceError) {
				setLoadError('Failed to load the history. Please try again.');
			} else {
				setLoadError('An unexpected error occurred. Please try again.');
			}
			console.error('Failed to load history:', error);
		} finally {
			setLoading(false);
		}
	}

	function triggerAutosave() {
		if (gameState.game) {
			const plainGame = deepClone(gameState.game);
			plainGame.updatedAt = new Date().toISOString();
			autosave.save(plainGame);
		}
	}

	// ============================================
	// Undo/Redo
	// ============================================

	function handleUndo() {
		if (!gameState.game || !canUndoAction) return;

		const action = historyState.undoStack[historyState.undoStack.length - 1];
		historyState.undoStack = historyState.undoStack.slice(0, -1);
		historyState.redoStack = [...historyState.redoStack, action];
		
		const newGame = reverseAction(gameState.game, action);
		setGame(newGame);
		triggerAutosave();
	}

	function handleRedo() {
		if (!gameState.game || !canRedoAction) return;

		const action = historyState.redoStack[historyState.redoStack.length - 1];
		historyState.redoStack = historyState.redoStack.slice(0, -1);
		historyState.undoStack = [...historyState.undoStack, action];
		
		const newGame = applyAction(gameState.game, action);
		setGame(newGame);
		triggerAutosave();
	}

	// ============================================
	// Keyboard Shortcuts
	// ============================================

	function handleGlobalKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
		if (isTextInput) return;

		const isMac = navigator.platform.toUpperCase().includes('MAC');
		const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

		// Spacebar for temporary card reorder toggle
		if (e.code === 'Space' && !cmdOrCtrl && !e.altKey && !e.shiftKey) {
			e.preventDefault();
			if (!canvasState.cardReorderToggledBySpace) {
				setCardReorderToggledBySpace(true);
				toggleCardReorder();
			}
		}

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

	function handleGlobalKeyUp(e: KeyboardEvent) {
		if (e.code === 'Space' && canvasState.cardReorderToggledBySpace) {
			const target = e.target as HTMLElement;
			const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
			if (!isTextInput) {
				e.preventDefault();
				toggleCardReorder();
				setCardReorderToggledBySpace(false);
			}
		}
	}

	// ============================================
	// Zoom Controls
	// ============================================

	function handleZoomChange(newZoom: number) {
		setZoom(newZoom);
	}

	function handleResetPosition() {
		if (snapshotState.isViewingHistory && historicalCanvasRef) {
			historicalCanvasRef.resetPosition();
		} else if (canvasRef) {
			canvasRef.resetPosition();
		}
	}

	// ============================================
	// Item Selection (opens edit modal)
	// ============================================

	function handleSelectPeriod(period: Period) {
		openEditModal('period', period, {});
	}

	function handleSelectEvent(periodId: string, event: GameEvent) {
		openEditModal('event', event, { periodId });
	}

	function handleSelectScene(periodId: string, eventId: string, scene: Scene) {
		openEditModal('scene', scene, { periodId, eventId });
	}

	// ============================================
	// Item CRUD with autosave
	// ============================================

	function handleAddPeriod(index: number) {
		addPeriod(index);
		triggerAutosave();
	}

	function handleAddEvent(periodId: string) {
		addEvent(periodId);
		triggerAutosave();
	}

	function handleAddScene(periodId: string, eventId: string) {
		addScene(periodId, eventId);
		triggerAutosave();
	}

	function handleSaveItem(updates: Partial<Period | GameEvent | Scene>) {
		if (!editState.item) return;

		const itemId = editState.item.id;
		const { periodId, eventId } = editState.context;

		if (editState.itemType === 'period') {
			editPeriod(itemId, updates as Partial<Period>);
		} else if (editState.itemType === 'event' && periodId) {
			editEvent(periodId, itemId, updates as Partial<GameEvent>);
		} else if (editState.itemType === 'scene' && periodId && eventId) {
			editScene(periodId, eventId, itemId, updates as Partial<Scene>);
		}
		triggerAutosave();
	}

	function handleDeleteClick() {
		if (!editState.item) return;

		const hasChildren = editState.itemType === 'period'
			? (editState.item as Period).events.length > 0
			: editState.itemType === 'event'
				? (editState.item as GameEvent).scenes.length > 0
				: false;

		setEditModalOpen(false);
		openDeleteModal(editState.itemType, editState.item.name, hasChildren);
	}

	function handleConfirmDelete() {
		if (!editState.item) return;

		const itemId = editState.item.id;
		const { periodId, eventId } = editState.context;

		if (editState.itemType === 'period') {
			deletePeriod(itemId);
		} else if (editState.itemType === 'event' && periodId) {
			deleteEvent(periodId, itemId);
		} else if (editState.itemType === 'scene' && periodId && eventId) {
			deleteScene(periodId, eventId, itemId);
		}

		triggerAutosave();
		editState.item = null;
		toast.success(`${editState.itemType.charAt(0).toUpperCase() + editState.itemType.slice(1)} deleted`);
	}

	// ============================================
	// Reorder handlers
	// ============================================

	function handleReorderPeriods(fromIndex: number, toIndex: number) {
		reorderPeriods(fromIndex, toIndex);
		triggerAutosave();
	}

	function handleReorderEvents(periodId: string, fromIndex: number, toIndex: number) {
		reorderEvents(periodId, fromIndex, toIndex);
		triggerAutosave();
	}

	function handleReorderScenes(periodId: string, eventId: string, fromIndex: number, toIndex: number) {
		reorderScenes(periodId, eventId, fromIndex, toIndex);
		triggerAutosave();
	}

	// ============================================
	// Game Settings
	// ============================================

	function handleSaveGameSettings(updates: Partial<Game>) {
		editGameMetadata(updates);
		triggerAutosave();
	}

	function handlePreviousPlayer() {
		const game = gameState.game;
		if (!game || game.players.length === 0) return;
		const newIndex = game.activePlayerIndex <= 0 ? game.players.length - 1 : game.activePlayerIndex - 1;
		handleSaveGameSettings({ activePlayerIndex: newIndex });
	}

	function handleNextPlayer() {
		const game = gameState.game;
		if (!game || game.players.length === 0) return;
		const newIndex = (game.activePlayerIndex + 1) % game.players.length;
		handleSaveGameSettings({ activePlayerIndex: newIndex });
	}

	function handlePreviousFocus() {
		const game = gameState.game;
		if (!game || game.focuses.length === 0) return;
		const newIndex = game.currentFocusIndex <= 0 ? game.focuses.length - 1 : game.currentFocusIndex - 1;
		handleSaveGameSettings({ currentFocusIndex: newIndex, focus: game.focuses[newIndex] });
	}

	function handleNextFocus() {
		const game = gameState.game;
		if (!game || game.focuses.length === 0) return;
		const newIndex = (game.currentFocusIndex + 1) % game.focuses.length;
		handleSaveGameSettings({ currentFocusIndex: newIndex, focus: game.focuses[newIndex] });
	}

	// ============================================
	// Snapshots & History
	// ============================================

	async function openHistoryModal() {
		setHistoryModalOpen(true);
		setSnapshotsLoading(true);
		setSnapshotsError(null);

		try {
			const loadedSnapshots = await listSnapshotsForGame(gameId);
			setSnapshots(loadedSnapshots);
		} catch (error) {
			console.error('Failed to load snapshots:', error);
			setSnapshotsError('Failed to load version history. Please try again.');
		} finally {
			setSnapshotsLoading(false);
		}
	}

	async function handleViewSnapshot(snapshotId: string) {
		try {
			const snapshot = await loadSnapshot(snapshotId);
			if (snapshot) {
				setViewingHistory(true);
				setHistoricalGame(snapshot.data);
				setCurrentSnapshotId(snapshotId);
				setHistoryModalOpen(false);
			}
		} catch (error) {
			console.error('Failed to load snapshot:', error);
			toast.error('Failed to load version', { description: 'Could not load the selected version.' });
		}
	}

	async function handleRestoreSnapshot(snapshotId: string) {
		const game = gameState.game;
		if (!game) return;

		try {
			const snapshot = await loadSnapshot(snapshotId);
			if (snapshot) {
				// Auto-save current state before restore
				const plainGame = deepClone(game);
				const changeSummary = generateChangeSummary(gameState.lastPublishedGame, plainGame);
				const currentSnapshot = createSnapshot(plainGame, 'Auto-saved before restore', changeSummary);
				await createSnapshotRecord(currentSnapshot);

				// Restore the historical version
				const restoredGame = deepClone(snapshot.data);
				restoredGame.updatedAt = new Date().toISOString();
				setGame(restoredGame);
				setLastPublishedGame(snapshot.data);
				clearHistory();
				triggerAutosave();

				setHistoryModalOpen(false);
				exitHistoryView();
				toast.success('Version restored', { description: 'Your previous state was saved.' });
			}
		} catch (error) {
			console.error('Failed to restore snapshot:', error);
			toast.error('Failed to restore version');
		}
	}

	// ============================================
	// Publishing
	// ============================================

	function getDefaultVersionName(): string {
		return new Date().toLocaleDateString(undefined, {
			year: 'numeric', month: 'short', day: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	function getCurrentChangeSummary(): string {
		if (!gameState.game) return '';
		return generateChangeSummary(gameState.lastPublishedGame, gameState.game);
	}

	async function handlePublishVersion(versionName: string) {
		const game = gameState.game;
		if (!game || publishState.isPublishing) return;

		setPublishing(true);
		try {
			const plainGame = deepClone(game);
			const changeSummary = generateChangeSummary(gameState.lastPublishedGame, plainGame);
			const snapshot = createSnapshot(plainGame, versionName, changeSummary);
			await createSnapshotRecord(snapshot);
			await enforceSnapshotLimit(plainGame.id);
			setLastPublishedGame(plainGame);
			toast.success('Version published', { description: `"${versionName}" has been saved.` });
			setPublishModalOpen(false);
		} catch (error) {
			console.error('Failed to publish version:', error);
			toast.error('Failed to publish version');
		} finally {
			setPublishing(false);
		}
	}

	// ============================================
	// Export
	// ============================================

	async function handleExportJSON() {
		const game = gameState.game;
		if (!game) return;
		try {
			const history = await loadAllSnapshotsForGame(game.id);
			downloadGameAsJSON(game, history);
			toast.success('Export complete', { description: 'Your history has been exported as JSON.' });
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Export failed');
		}
	}

	function handleExportMarkdown() {
		const game = gameState.game;
		if (!game) return;
		try {
			downloadGameAsMarkdown(game);
			toast.success('Export complete', { description: 'Your history has been exported as Markdown.' });
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Export failed');
		}
	}

	// ============================================
	// Sheet Save Handlers
	// ============================================

	function handleSavePalette(palette: PaletteType) {
		handleSaveGameSettings({ palette });
	}

	function handleSavePlayers(players: Player[], activePlayerIndex: number) {
		handleSaveGameSettings({ players, activePlayerIndex });
	}

	function handleSaveFocuses(focuses: Focus[], currentFocusIndex: number) {
		const focus = currentFocusIndex >= 0 && focuses[currentFocusIndex] ? focuses[currentFocusIndex] : undefined;
		handleSaveGameSettings({ focuses, currentFocusIndex, focus });
	}

	function handleSaveLegacies(legacies: Legacy[]) {
		handleSaveGameSettings({ legacies });
	}

	// ============================================
	// Anchor Handlers
	// ============================================

	function handleCreateAnchor(name: string, description?: string) {
		createAnchor(name, description);
		triggerAutosave();
	}

	function handleEditAnchor(anchorId: string, name: string, description?: string) {
		editAnchor(anchorId, name, description);
		triggerAutosave();
	}

	function handleDeleteAnchor(anchorId: string) {
		if (deleteAnchor(anchorId)) {
			triggerAutosave();
			toast.success('Anchor deleted');
		}
	}

	function handleSetCurrentAnchor(anchorId: string, periodId: string) {
		const result = setCurrentAnchor(anchorId, periodId);
		if (result.success) {
			triggerAutosave();
			if (result.message) toast.success(result.message);
		} else if (result.message) {
			toast.info(result.message);
		}
	}

	function handleClearCurrentAnchor() {
		if (clearCurrentAnchor()) {
			triggerAutosave();
			toast.success('Active anchor cleared');
		}
	}

	function handleSelectAnchor(anchor: Anchor) {
		openAnchorsSheet(anchor.id);
	}

	// ============================================
	// Derived Values
	// ============================================

	const game = $derived(gameState.game);
	const currentPalette = $derived<PaletteType>(game?.palette ?? { yes: [], no: [] });
	const currentPlayers = $derived(game?.players ?? []);
	const currentActivePlayerIndex = $derived(game?.activePlayerIndex ?? -1);
	const currentFocuses = $derived(game?.focuses ?? []);
	const currentFocusIndex = $derived(game?.currentFocusIndex ?? -1);
	const currentLegacies = $derived(game?.legacies ?? []);
	const currentAnchors = $derived(game?.anchors ?? []);
	const currentAnchorId = $derived(game?.currentAnchorId ?? null);
	const currentAnchorPlacements = $derived(game?.anchorPlacements ?? []);

	const paletteCount = $derived((currentPalette.yes?.length ?? 0) + (currentPalette.no?.length ?? 0));
	const playersCount = $derived(currentPlayers.length);
	const focusesCount = $derived(currentFocuses.length);
	const legaciesCount = $derived(currentLegacies.length);
	const anchorsCount = $derived(currentAnchors.length);

	const pageTitle = $derived(
		snapshotState.isViewingHistory && snapshotState.historicalGame
			? `${snapshotState.historicalGame.name} (History) | Microscope Canvas`
			: game ? `${game.name} | Microscope Canvas` : 'Microscope Canvas'
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<svelte:window onkeydown={handleGlobalKeyDown} onkeyup={handleGlobalKeyUp} />

<div class="canvas-page">
	<div class="canvas-header">
		<div class="canvas-header-content">
			<GameHeader
				{game}
				isViewingHistory={snapshotState.isViewingHistory}
				historicalGame={snapshotState.historicalGame}
				onExitHistoryView={exitHistoryView}
				onPreviousPlayer={handlePreviousPlayer}
				onNextPlayer={handleNextPlayer}
				onPreviousFocus={handlePreviousFocus}
				onNextFocus={handleNextFocus}
			/>

			<HeaderActions
				{game}
				canUndo={canUndoAction}
				canRedo={canRedoAction}
				isViewingHistory={snapshotState.isViewingHistory}
				currentSnapshotId={snapshotState.currentSnapshotId}
				{paletteCount}
				{playersCount}
				{focusesCount}
				{legaciesCount}
				{anchorsCount}
				onUndo={handleUndo}
				onRedo={handleRedo}
				onRestoreSnapshot={() => handleRestoreSnapshot(snapshotState.currentSnapshotId!)}
				onOpenPalette={() => setPaletteSheetOpen(true)}
				onOpenPlayers={() => setPlayersSheetOpen(true)}
				onOpenFocuses={() => setFocusesSheetOpen(true)}
				onOpenLegacies={() => setLegaciesSheetOpen(true)}
				onOpenAnchors={() => openAnchorsSheet(null)}
				onOpenPublish={() => setPublishModalOpen(true)}
				onOpenHistory={openHistoryModal}
				onOpenSettings={() => setSettingsModalOpen(true)}
				onExportJSON={handleExportJSON}
				onExportMarkdown={handleExportMarkdown}
			/>
		</div>
	</div>

	{#if !snapshotState.isViewingHistory && game}
		<MobileInfoBar
			{game}
			onNextPlayer={handleNextPlayer}
			onNextFocus={handleNextFocus}
		/>
	{/if}

	<CanvasArea
		isLoading={gameState.isLoading}
		loadError={gameState.loadError}
		{game}
		isViewingHistory={snapshotState.isViewingHistory}
		historicalGame={snapshotState.historicalGame}
		zoom={canvasState.zoom}
		minZoom={MIN_ZOOM}
		maxZoom={MAX_ZOOM}
		cardReorderEnabled={canvasState.cardReorderEnabled}
		onFetchGame={fetchGame}
		onZoomChange={handleZoomChange}
		onZoomIn={zoomIn}
		onZoomOut={zoomOut}
		onZoomReset={resetZoom}
		onResetPosition={handleResetPosition}
		onToggleCardReorder={toggleCardReorder}
		onAddPeriod={handleAddPeriod}
		onAddEvent={handleAddEvent}
		onAddScene={handleAddScene}
		onSelectPeriod={handleSelectPeriod}
		onSelectEvent={handleSelectEvent}
		onSelectScene={handleSelectScene}
		onSelectAnchor={handleSelectAnchor}
		onReorderPeriods={handleReorderPeriods}
		onReorderEvents={handleReorderEvents}
		onReorderScenes={handleReorderScenes}
		bind:canvasRef
		bind:historicalCanvasRef
	/>
</div>

<GameModals
	editModalOpen={modalState.editModalOpen}
	editItemType={editState.itemType}
	editItem={editState.item}
	onEditModalOpenChange={setEditModalOpen}
	onSaveItem={handleSaveItem}
	onDeleteClick={handleDeleteClick}
	settingsModalOpen={modalState.settingsModalOpen}
	{game}
	onSettingsModalOpenChange={setSettingsModalOpen}
	onSaveGameSettings={handleSaveGameSettings}
	deleteModalOpen={modalState.deleteModalOpen}
	deleteItemType={deleteState.itemType}
	deleteItemName={deleteState.itemName}
	deleteItemHasChildren={deleteState.hasChildren}
	onDeleteModalOpenChange={setDeleteModalOpen}
	onConfirmDelete={handleConfirmDelete}
	historyModalOpen={modalState.historyModalOpen}
	snapshots={snapshotState.snapshots}
	snapshotsLoading={snapshotState.snapshotsLoading}
	snapshotsError={snapshotState.snapshotsError}
	onHistoryModalOpenChange={setHistoryModalOpen}
	onViewSnapshot={handleViewSnapshot}
	onRestoreSnapshot={handleRestoreSnapshot}
	publishModalOpen={publishState.publishModalOpen}
	isPublishing={publishState.isPublishing}
	defaultVersionName={getDefaultVersionName()}
	changeSummary={getCurrentChangeSummary()}
	onPublishModalOpenChange={setPublishModalOpen}
	onPublishVersion={handlePublishVersion}
/>

<GameSheets
	paletteSheetOpen={modalState.paletteSheetOpen}
	palette={currentPalette}
	onPaletteSheetOpenChange={setPaletteSheetOpen}
	onSavePalette={handleSavePalette}
	playersSheetOpen={modalState.playersSheetOpen}
	players={currentPlayers}
	activePlayerIndex={currentActivePlayerIndex}
	onPlayersSheetOpenChange={setPlayersSheetOpen}
	onSavePlayers={handleSavePlayers}
	focusesSheetOpen={modalState.focusesSheetOpen}
	focuses={currentFocuses}
	{currentFocusIndex}
	onFocusesSheetOpenChange={setFocusesSheetOpen}
	onSaveFocuses={handleSaveFocuses}
	legaciesSheetOpen={modalState.legaciesSheetOpen}
	legacies={currentLegacies}
	onLegaciesSheetOpenChange={setLegaciesSheetOpen}
	onSaveLegacies={handleSaveLegacies}
	anchorsSheetOpen={modalState.anchorsSheetOpen}
	anchors={currentAnchors}
	{currentAnchorId}
	anchorPlacements={currentAnchorPlacements}
	periods={game?.periods ?? []}
	selectedAnchorId={anchorsState.selectedAnchorId}
	onAnchorsSheetOpenChange={setAnchorsSheetOpen}
	onCreateAnchor={handleCreateAnchor}
	onEditAnchor={handleEditAnchor}
	onDeleteAnchor={handleDeleteAnchor}
	onSetCurrentAnchor={handleSetCurrentAnchor}
	onClearCurrentAnchor={handleClearCurrentAnchor}
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

	@media (max-width: 640px) {
		.canvas-header {
			padding: 0.5rem 0.75rem;
		}
	}
</style>
