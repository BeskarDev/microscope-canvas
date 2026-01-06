<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { toast } from '$lib/components/ui/sonner';
	import Plus from 'lucide-svelte/icons/plus';
	import Upload from 'lucide-svelte/icons/upload';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import FileJson from 'lucide-svelte/icons/file-json';
	import Dices from 'lucide-svelte/icons/dices';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import {
		listGames,
		createGame as persistCreateGame,
		deleteGame as persistDeleteGame,
		DatabaseUnavailableError,
		PersistenceError,
		parseGameExportJSON,
		createGameAndHistoryFromImport,
		readFileAsText,
		isJSONFile,
		ImportError,
		createSnapshotRecord
	} from '$lib/services';
	import { createNewGame, type GameMetadata } from '$lib/types';
	import { generateNameInspiration, generateHistorySeed } from '$lib/utils/oracle/index';

	// State
	let games: GameMetadata[] = $state([]);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// Create game dialog state
	let createDialogOpen = $state(false);
	let newGameName = $state('');
	let newBigPicture = $state('');
	let isCreating = $state(false);

	// Delete confirmation state
	let deleteDialogOpen = $state(false);
	let gameToDelete = $state<GameMetadata | null>(null);
	let isDeleting = $state(false);

	// Import state
	let isImporting = $state(false);
	let isDragOver = $state(false);
	let fileInputRef = $state<HTMLInputElement | null>(null);

	// Load games on mount
	onMount(async () => {
		await loadGames();
	});

	async function loadGames() {
		isLoading = true;
		loadError = null;

		try {
			games = await listGames();
		} catch (error) {
			if (error instanceof DatabaseUnavailableError) {
				loadError =
					'Local storage is not available. Please check your browser settings or try a different browser.';
			} else if (error instanceof PersistenceError) {
				loadError = 'Failed to load your histories. Please refresh the page to try again.';
			} else {
				loadError = 'An unexpected error occurred. Please refresh the page.';
			}
			console.error('Failed to load histories:', error);
		} finally {
			isLoading = false;
		}
	}

	function openCreateDialog() {
		newGameName = '';
		newBigPicture = '';
		createDialogOpen = true;
	}

	async function handleCreateGame() {
		const trimmedName = newGameName.trim();
		if (!trimmedName) {
			toast.error('Please enter a history name');
			return;
		}

		isCreating = true;

		try {
			const game = createNewGame(trimmedName);
			
			// Add Big Picture if provided
			const trimmedBigPicture = newBigPicture.trim();
			if (trimmedBigPicture) {
				game.bigPicture = {
					premise: trimmedBigPicture
				};
			}
			
			await persistCreateGame(game);

			toast.success('History created!', {
				description: `"${trimmedName}" is ready for worldbuilding.`
			});

			createDialogOpen = false;
			goto(resolve('/game/[id]', { id: game.id }));
		} catch (error) {
			console.error('Failed to create history:', error);
			toast.error('Failed to create history', {
				description: 'Please try again. If the problem persists, check your browser storage.'
			});
		} finally {
			isCreating = false;
		}
	}

	function handleGenerateName() {
		newGameName = generateNameInspiration();
	}

	function handleGenerateBigPicture() {
		newBigPicture = generateHistorySeed();
	}

	function handleImportGame() {
		// Trigger file input click
		fileInputRef?.click();
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			await importFile(file);
		}
		// Reset input so the same file can be selected again
		input.value = '';
	}

	async function importFile(file: File) {
		if (!isJSONFile(file)) {
			toast.error('Invalid file type', {
				description: 'Please select a JSON file exported from Microscope Canvas.'
			});
			return;
		}

		isImporting = true;

		try {
			const content = await readFileAsText(file);
			const { game: importedGame, history: importedHistory } = parseGameExportJSON(content);
			const { game: newGame, history: newHistory } = createGameAndHistoryFromImport(
				importedGame,
				importedHistory
			);

			await persistCreateGame(newGame);

			// Also save the imported history if present
			for (const snapshot of newHistory) {
				await createSnapshotRecord(snapshot);
			}

			const historyNote =
				newHistory.length > 0
					? ` Restored ${newHistory.length} version${newHistory.length > 1 ? 's' : ''} from history.`
					: '';
			toast.success('History imported!', {
				description: `"${newGame.name}" has been added to your histories.${historyNote}`
			});

			// Navigate to the new history
			goto(resolve('/game/[id]', { id: newGame.id }));
		} catch (error) {
			console.error('Import failed:', error);

			if (error instanceof ImportError) {
				toast.error('Import failed', {
					description: error.message
				});
			} else {
				toast.error('Import failed', {
					description: 'Could not import the file. Please check that it is a valid export.'
				});
			}
		} finally {
			isImporting = false;
		}
	}

	// Drag and drop handlers
	// Track drag enter count to handle nested elements correctly
	let dragEnterCount = 0;

	function handleDragEnter(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragEnterCount++;
		if (dragEnterCount === 1) {
			isDragOver = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragEnterCount--;
		if (dragEnterCount === 0) {
			isDragOver = false;
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragEnterCount = 0;
		isDragOver = false;

		const file = event.dataTransfer?.files?.[0];
		if (file) {
			importFile(file);
		}
	}

	function openDeleteDialog(game: GameMetadata) {
		gameToDelete = game;
		deleteDialogOpen = true;
	}

	async function handleDeleteGame() {
		if (!gameToDelete) return;

		const gameId = gameToDelete.id;
		const gameName = gameToDelete.name;

		isDeleting = true;

		try {
			await persistDeleteGame(gameId);
			games = games.filter((g) => g.id !== gameId);

			toast.success('History deleted', {
				description: `"${gameName}" has been permanently deleted.`
			});

			deleteDialogOpen = false;
			gameToDelete = null;
		} catch (error) {
			console.error('Failed to delete history:', error);
			toast.error('Failed to delete history', {
				description: 'Please try again.'
			});
		} finally {
			isDeleting = false;
		}
	}

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Home | Microscope Canvas</title>
</svelte:head>

<!-- Hidden file input for import -->
<input
	type="file"
	accept=".json"
	bind:this={fileInputRef}
	onchange={handleFileSelect}
	class="hidden-input"
	aria-hidden="true"
/>

<div
	class="home-container"
	class:drag-over={isDragOver}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	role="region"
	aria-label="Drop zone for importing games"
>
	{#if isDragOver}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="drop-overlay animate-fade-in"
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
			ondragover={handleDragOver}
			ondrop={handleDrop}
		>
			<div class="drop-content">
				<FileJson class="h-16 w-16" />
				<p class="drop-text">Drop JSON file to import</p>
			</div>
		</div>
	{/if}

	<section class="hero-section">
		<div class="hero-icon">
			<Sparkles class="h-12 w-12" />
		</div>
		<h1 class="hero-title">Build Worlds Across Time</h1>
		<p class="hero-description">
			Create epic histories with Microscope. Define eras, explore events, and discover the stories
			that shape your world.
		</p>
	</section>

	<section class="actions-section">
		<Button onclick={openCreateDialog} size="lg" class="action-button" disabled={isImporting}>
			<Plus class="h-5 w-5" />
			Create New History
		</Button>
		<Button
			onclick={handleImportGame}
			variant="secondary"
			size="lg"
			class="action-button"
			disabled={isImporting}
		>
			{#if isImporting}
				<Loader2 class="h-5 w-5 animate-spin" />
				Importing...
			{:else}
				<Upload class="h-5 w-5" />
				Import History
			{/if}
		</Button>
	</section>

	<section class="games-section">
		<h2 class="section-title">Your Histories</h2>

		{#if isLoading}
			<div class="loading-state">
				<Loader2 class="h-8 w-8 animate-spin" />
				<p>Loading your histories...</p>
			</div>
		{:else if loadError}
			<div class="error-state">
				<p class="error-text">{loadError}</p>
				<Button onclick={loadGames} variant="secondary" size="sm">Try Again</Button>
			</div>
		{:else if games.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-16 w-16"
					>
						<circle cx="12" cy="12" r="10" opacity="0.3" />
						<path d="M8 12h8" />
						<path d="M12 8v8" />
					</svg>
				</div>
				<p class="empty-text">No histories yet</p>
				<p class="empty-subtext">Create a new history to begin your worldbuilding journey</p>
			</div>
		{:else}
			<ul class="games-list">
				{#each games as game (game.id)}
					<li class="game-item">
						<a href={resolve('/game/[id]', { id: game.id })} class="game-card">
							<span class="game-name">{game.name}</span>
							<span class="game-date">
								{formatDate(game.updatedAt)}
							</span>
						</a>
						<Button
							variant="ghost"
							size="icon"
							class="delete-button"
							onclick={(e: MouseEvent) => {
								e.preventDefault();
								e.stopPropagation();
								openDeleteDialog(game);
							}}
							aria-label={`Delete ${game.name}`}
							title={`Delete ${game.name}`}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Footer -->
	<footer class="home-footer">
		<p class="footer-text">
			This app is a digital companion for <strong>Microscope</strong>, a tabletop RPG created by
			<a href="https://lamemage.com/microscope/" target="_blank" rel="noopener noreferrer" class="footer-link">
				Ben Robbins
			</a>.
		</p>
		<p class="footer-text">
			This project does not claim any ownership of the Microscope game or its concepts.
			Please support the original creator by purchasing the game from
			<a href="https://lamemage.com/microscope/" target="_blank" rel="noopener noreferrer" class="footer-link">
				lamemage.com
			</a>.
		</p>
	</footer>
</div>

<!-- Create History Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create New History</Dialog.Title>
			<Dialog.Description>Give your Microscope history a name to get started.</Dialog.Description>
		</Dialog.Header>
		<div class="create-form">
			<div class="form-field">
				<div class="form-label-row">
					<label for="game-name" class="form-label">History Name</label>
					<Button
						variant="ghost"
						size="icon"
						class="oracle-btn"
						onclick={handleGenerateName}
						disabled={isCreating}
						title="Generate random name"
						type="button"
					>
						<Dices class="h-4 w-4" />
					</Button>
				</div>
				<Input
					id="game-name"
					bind:value={newGameName}
					placeholder="e.g., Rise and Fall of the Star Empire"
					disabled={isCreating}
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter' && !isCreating) {
							handleCreateGame();
						}
					}}
				/>
			</div>

			<div class="form-field">
				<div class="form-label-row">
					<label for="big-picture" class="form-label">Big Picture</label>
					<Button
						variant="ghost"
						size="icon"
						class="oracle-btn"
						onclick={handleGenerateBigPicture}
						disabled={isCreating}
						title="Generate random concept"
						type="button"
					>
						<Dices class="h-4 w-4" />
					</Button>
				</div>
				<Textarea
					id="big-picture"
					bind:value={newBigPicture}
					placeholder="The rise and fall of a galactic civilization..."
					disabled={isCreating}
					rows={3}
				/>
				<p class="form-hint">What is this history about? What is the overarching theme?</p>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="secondary" onclick={() => (createDialogOpen = false)} disabled={isCreating}>
				Cancel
			</Button>
			<Button onclick={handleCreateGame} disabled={isCreating || !newGameName.trim()}>
				{#if isCreating}
					<Loader2 class="h-4 w-4 animate-spin" />
					Creating...
				{:else}
					Create History
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete History?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete "{gameToDelete?.name}". This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isDeleting}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDeleteGame}
				disabled={isDeleting}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				{#if isDeleting}
					<Loader2 class="h-4 w-4 animate-spin" />
					Deleting...
				{:else}
					Delete
				{/if}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	.hidden-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.home-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1rem;
		max-width: 800px;
		margin: 0 auto;
		gap: 3rem;
		position: relative;
		min-height: calc(100vh - 60px);
	}

	.drop-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: oklch(from var(--color-background) l c h / 0.95);
		/* Allow pointer events on overlay so it can receive the drop */
		pointer-events: auto;
	}

	.drop-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem;
		border: 2px dashed var(--color-primary);
		border-radius: var(--radius);
		background-color: oklch(from var(--color-primary) l c h / 0.1);
	}

	.drop-content :global(svg) {
		color: var(--color-primary);
	}

	.drop-text {
		font-size: 1.25rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.hero-section {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.hero-icon {
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		letter-spacing: -0.025em;
		background: linear-gradient(
			135deg,
			var(--color-foreground) 0%,
			var(--color-primary) 50%,
			var(--color-foreground) 100%
		);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		line-height: 1.2;
	}

	.hero-description {
		font-size: 1.125rem;
		color: var(--color-muted-foreground);
		max-width: 500px;
		line-height: 1.6;
	}

	.actions-section {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
	}

	.actions-section :global(.action-button) {
		min-width: 180px;
	}

	.games-section {
		width: 100%;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-align: center;
		color: var(--color-foreground);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		gap: 1rem;
		color: var(--color-muted-foreground);
	}

	.loading-state :global(svg) {
		color: var(--color-primary);
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		gap: 1rem;
		border: 1px solid var(--color-destructive);
		border-radius: var(--radius);
		background-color: oklch(from var(--color-destructive) l c h / 0.1);
	}

	.error-text {
		color: var(--color-destructive);
		text-align: center;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-card);
		text-align: center;
	}

	.empty-icon {
		color: var(--color-muted-foreground);
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.empty-subtext {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.games-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.game-item {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
	}

	.game-card {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--color-card-foreground);
		transition:
			border-color 0.2s,
			background-color 0.2s;
	}

	.game-card:hover {
		border-color: var(--color-primary);
		background-color: var(--color-accent);
	}

	.game-name {
		font-weight: 500;
	}

	.game-date {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.game-item :global(.delete-button) {
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.game-item :global(.delete-button:hover) {
		color: var(--color-destructive);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 0;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.create-form :global(.oracle-btn) {
		width: 1.75rem;
		height: 1.75rem;
		color: var(--color-muted-foreground);
	}

	.create-form :global(.oracle-btn:hover) {
		color: var(--color-primary);
	}

	/* Footer */
	.home-footer {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 2rem 1rem 1rem;
		margin-top: auto;
		text-align: center;
		border-top: 1px solid var(--color-border);
	}

	.footer-text {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		margin: 0;
		line-height: 1.6;
	}

	.footer-link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.15s;
	}

	.footer-link:hover {
		opacity: 0.8;
		text-decoration: underline;
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

	@media (max-width: 640px) {
		.home-container {
			padding: 1.5rem 1rem;
			gap: 2rem;
		}

		.hero-title {
			font-size: 1.75rem;
		}

		.hero-description {
			font-size: 1rem;
		}

		.actions-section {
			flex-direction: column;
			width: 100%;
		}

		.actions-section :global(.action-button) {
			width: 100%;
		}

		.game-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
