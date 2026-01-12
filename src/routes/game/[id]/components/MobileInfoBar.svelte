<script lang="ts">
	import User from 'lucide-svelte/icons/user';
	import Target from 'lucide-svelte/icons/target';
	import type { Game, Focus } from '$lib/types';

	interface Props {
		game: Game | null;
		onNextPlayer: () => void;
		onNextFocus: () => void;
	}

	let { game, onNextPlayer, onNextFocus }: Props = $props();

	// Get current player name
	const currentPlayerName = $derived(() => {
		if (!game || !game.players || game.players.length === 0) return 'No player';
		const player = game.players[game.activePlayerIndex];
		return player?.name || 'No player';
	});

	// Get current focus name
	const currentFocusName = $derived(() => {
		if (!game || !game.focuses || game.focuses.length === 0) return 'No focus';
		const focus = game.focuses[game.currentFocusIndex];
		return focus?.name || 'No focus';
	});

	// Legacy focus for backwards compatibility
	const legacyFocus = $derived<Focus | undefined>(game?.focus);
</script>

<div class="mobile-info-bar">
	{#if game?.players && game.players.length > 0}
		<button type="button" class="mobile-info-item player-info" onclick={onNextPlayer}>
			<User class="h-3.5 w-3.5" />
			<span class="info-label">
				{currentPlayerName()}
			</span>
		</button>
	{/if}
	{#if game?.focuses && game.focuses.length > 0}
		<button type="button" class="mobile-info-item focus-info" onclick={onNextFocus}>
			<Target class="h-3.5 w-3.5" />
			<span class="info-label">
				{currentFocusName()}
			</span>
		</button>
	{:else if legacyFocus}
		<div class="mobile-info-item focus-info">
			<Target class="h-3.5 w-3.5" />
			<span class="info-label">{legacyFocus.name}</span>
		</div>
	{/if}
</div>

<style>
	.mobile-info-bar {
		display: none;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
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
	}
</style>
