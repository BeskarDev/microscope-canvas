<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowLeftToLine from 'lucide-svelte/icons/arrow-left-to-line';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import User from 'lucide-svelte/icons/user';
	import Target from 'lucide-svelte/icons/target';
	import type { Game, Focus } from '$lib/types';

	interface Props {
		game: Game | null;
		isViewingHistory: boolean;
		historicalGame: Game | null;
		onExitHistoryView: () => void;
		onPreviousPlayer: () => void;
		onNextPlayer: () => void;
		onPreviousFocus: () => void;
		onNextFocus: () => void;
	}

	let {
		game,
		isViewingHistory,
		historicalGame,
		onExitHistoryView,
		onPreviousPlayer,
		onNextPlayer,
		onPreviousFocus,
		onNextFocus
	}: Props = $props();

	// Resolve homeUrl within this component
	const homeUrl = resolve('/');

	// Get current player name
	const currentPlayerName = $derived(() => {
		if (!game || !game.players || game.players.length === 0) return 'No player';
		const player = game.players[game.activePlayerIndex];
		return player?.name || 'No player';
	});

	// Get current focus
	const currentFocusName = $derived(() => {
		if (!game || !game.focuses || game.focuses.length === 0) return 'No focus';
		const focus = game.focuses[game.currentFocusIndex];
		return focus?.name || 'No focus';
	});

	// Legacy focus for backwards compatibility
	const legacyFocus = $derived<Focus | undefined>(game?.focus);
</script>

<div class="game-header-left">
	{#if isViewingHistory}
		<Button variant="ghost" size="sm" onclick={onExitHistoryView}>
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
					onclick={onPreviousPlayer}
					aria-label="Previous player"
					title="Previous player"
					disabled={game.players.length <= 1}
				>
					<ChevronLeft class="h-3.5 w-3.5" />
				</Button>
				<div class="nav-label">
					<User class="h-3.5 w-3.5 nav-icon" />
					<span class="nav-text">
						{currentPlayerName()}
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					class="nav-btn"
					onclick={onNextPlayer}
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
					onclick={onPreviousFocus}
					aria-label="Previous focus"
					title="Previous focus"
					disabled={game.focuses.length <= 1}
				>
					<ChevronLeft class="h-3.5 w-3.5" />
				</Button>
				<div class="nav-label">
					<Target class="h-3.5 w-3.5 nav-icon" />
					<span class="nav-text">
						{currentFocusName()}
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					class="nav-btn"
					onclick={onNextFocus}
					aria-label="Next focus"
					title="Next focus"
					disabled={game.focuses.length <= 1}
				>
					<ChevronRight class="h-3.5 w-3.5" />
				</Button>
			</div>
		{:else if legacyFocus}
			<!-- Fallback for legacy focus field -->
			<div class="focus-indicator" title="Current Focus: {legacyFocus.name}">
				<Target class="h-3.5 w-3.5" />
				{legacyFocus.name}
			</div>
		{/if}
	</div>
{/if}

<style>
	.game-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.game-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-foreground);
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

	@media (min-width: 640px) {
		.back-text {
			display: inline;
		}
	}

	@media (max-width: 640px) {
		.game-title {
			font-size: 0.8125rem;
		}

		.focus-indicator {
			display: none;
		}

		.header-center {
			display: none;
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
