<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import type { GameMetadata } from '$lib/types';

	interface Props {
		games: GameMetadata[];
		isLoading: boolean;
		loadError: string | null;
		onRetry: () => void;
		onDeleteGame: (game: GameMetadata) => void;
	}

	let { games, isLoading, loadError, onRetry, onDeleteGame }: Props = $props();

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

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
			<Button onclick={onRetry} variant="secondary" size="sm">Try Again</Button>
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
							onDeleteGame(game);
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

<style>
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
		.game-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
