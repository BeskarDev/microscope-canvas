<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { toast } from '$lib/components/ui/sonner';
	import Plus from 'lucide-svelte/icons/plus';
	import Upload from 'lucide-svelte/icons/upload';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import FileJson from 'lucide-svelte/icons/file-json';
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
	import { GamesList, CreateGameDialog } from './components';

	// State
	let games: GameMetadata[] = $state([]);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// Create game dialog state
	let createDialogOpen = $state(false);
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
		createDialogOpen = true;
	}

	async function handleCreateGame(name: string, bigPicture: string) {
		if (!name) {
			toast.error('Please enter a history name');
			return;
		}

		isCreating = true;

		try {
			const game = createNewGame(name);

			// Add Big Picture if provided
			if (bigPicture) {
				game.bigPicture = {
					premise: bigPicture
				};
			}

			await persistCreateGame(game);

			toast.success('History created!', {
				description: `"${name}" is ready for worldbuilding.`
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

	<GamesList
		{games}
		{isLoading}
		{loadError}
		onRetry={loadGames}
		onDeleteGame={openDeleteDialog}
	/>

	<!-- Footer -->
	<footer class="home-footer">
		<p class="footer-text">
			This app is a fan-made digital companion for <strong>Microscope</strong>, a tabletop RPG created by
			<a href="https://lamemage.com/" target="_blank" rel="noopener noreferrer" class="footer-link">
				Ben Robbins
			</a>.
		</p>
		<p class="footer-text">
			This project does not claim any ownership of the Microscope game or its concepts.
			Please support the original creator by purchasing the game from
			<a href="https://lamemage.com/microscope/" target="_blank" rel="noopener noreferrer" class="footer-link">
				https://lamemage.com/microscope/
			</a>.
		</p>
	</footer>
</div>

<!-- Create History Dialog -->
<CreateGameDialog
	open={createDialogOpen}
	{isCreating}
	onOpenChange={(open) => (createDialogOpen = open)}
	onCreate={handleCreateGame}
/>

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
	}
</style>
