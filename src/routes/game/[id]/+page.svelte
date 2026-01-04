<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import { resolve } from '$app/paths';
	import { loadGame, DatabaseUnavailableError, PersistenceError } from '$lib/services';
	import type { Game } from '$lib/types';

	const gameId = $derived($page.params.id ?? '');
	const homeUrl = resolve('/');

	// State
	let game = $state<Game | null>(null);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

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
</script>

<div class="canvas-placeholder">
	<div class="canvas-header">
		<a href={homeUrl}>
			<Button variant="ghost" size="sm">
				<ArrowLeft class="h-4 w-4" />
				Back to Games
			</Button>
		</a>
		{#if game}
			<span class="game-title">{game.name}</span>
		{:else if !isLoading && !loadError}
			<span class="game-id">Game: {gameId}</span>
		{/if}
	</div>

	<div class="canvas-content">
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
			<div class="placeholder-message">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="placeholder-icon"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" opacity="0.3" />
					<path d="M3 9h18" />
					<path d="M9 21V9" />
				</svg>
				<h2 class="placeholder-title">{game.name}</h2>
				<p class="placeholder-text">
					The interactive timeline canvas will be implemented in a future milestone. You'll be able
					to create periods, events, and scenes to build your world's history.
				</p>
				<div class="game-stats">
					<div class="stat">
						<span class="stat-value">{game.periods.length}</span>
						<span class="stat-label">Periods</span>
					</div>
					<div class="stat">
						<span class="stat-value">{game.legacies.length}</span>
						<span class="stat-label">Legacies</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.canvas-placeholder {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.canvas-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background-color: oklch(10% 0.02 265 / 0.5);
		backdrop-filter: blur(8px);
	}

	.game-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.game-id {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
	}

	.canvas-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.loading-state :global(svg) {
		color: var(--color-primary);
	}

	.loading-text {
		color: var(--color-muted-foreground);
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
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
	}

	.placeholder-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 400px;
		padding: 2rem;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-card);
	}

	.placeholder-icon {
		width: 4rem;
		height: 4rem;
		color: var(--color-muted-foreground);
		margin-bottom: 1.5rem;
		opacity: 0.5;
	}

	.placeholder-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: var(--color-foreground);
	}

	.placeholder-text {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.game-stats {
		display: flex;
		gap: 2rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
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
		.canvas-header {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}

		.game-title {
			font-size: 0.875rem;
		}

		.game-id {
			font-size: 0.75rem;
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
