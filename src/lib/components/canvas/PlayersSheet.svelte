<script lang="ts">
	import type { Player } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import Shuffle from 'lucide-svelte/icons/shuffle';
	import Users from 'lucide-svelte/icons/users';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		players: Player[];
		activePlayerIndex: number;
		onSave: (players: Player[], activePlayerIndex: number) => void;
	}

	let { open, onOpenChange, players, activePlayerIndex, onSave }: Props = $props();

	// Local state for editing
	let localPlayers = $state<Player[]>([]);
	let localActiveIndex = $state(-1);
	let newPlayerName = $state('');

	// Sync local state when players change or sheet opens
	$effect(() => {
		if (open) {
			localPlayers = players.map(p => ({ ...p }));
			localActiveIndex = activePlayerIndex;
			newPlayerName = '';
		}
	});

	function handleAddPlayer() {
		const trimmed = newPlayerName.trim();
		if (!trimmed) return;
		const newPlayer: Player = {
			id: crypto.randomUUID(),
			name: trimmed
		};
		localPlayers = [...localPlayers, newPlayer];
		newPlayerName = '';
		// Auto-set first player as active
		if (localPlayers.length === 1) {
			localActiveIndex = 0;
		}
		saveChanges();
	}

	function handleRemovePlayer(playerId: string) {
		const idx = localPlayers.findIndex(p => p.id === playerId);
		localPlayers = localPlayers.filter(p => p.id !== playerId);
		// Adjust active index
		if (localActiveIndex >= localPlayers.length) {
			localActiveIndex = localPlayers.length - 1;
		} else if (idx < localActiveIndex) {
			localActiveIndex = localActiveIndex - 1;
		}
		saveChanges();
	}

	function handleSetActive(index: number) {
		localActiveIndex = index;
		saveChanges();
	}

	function handleRandomizeOrder() {
		if (localPlayers.length < 2) return;
		// Fisher-Yates shuffle
		const shuffled = [...localPlayers];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		localPlayers = shuffled;
		// Reset active player to first
		localActiveIndex = 0;
		saveChanges();
	}

	function saveChanges() {
		onSave(localPlayers, localActiveIndex);
	}

	function handleClose() {
		onOpenChange(false);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sheet-backdrop" onclick={handleBackdropClick}>
		<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="players-title">
			<div class="sheet-header">
				<div class="header-title-row">
					<h2 id="players-title" class="sheet-title">Players</h2>
					{#if localPlayers.length >= 2}
						<Button
							variant="outline"
							size="sm"
							onclick={handleRandomizeOrder}
							title="Randomize player order"
						>
							<Shuffle class="h-3.5 w-3.5" />
							<span class="button-text">Shuffle</span>
						</Button>
					{/if}
				</div>
				<p class="sheet-description">
					Manage turn order and track active player.
				</p>
				<Button
					variant="ghost"
					size="icon"
					class="close-btn"
					onclick={handleClose}
					aria-label="Close players"
					title="Close"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>

			<div class="sheet-content">
				<div class="add-player-row">
					<Input
						bind:value={newPlayerName}
						placeholder="Player name..."
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleAddPlayer();
							}
						}}
					/>
					<Button
						variant="secondary"
						size="sm"
						onclick={handleAddPlayer}
						disabled={!newPlayerName.trim()}
						title="Add player"
					>
						<Plus class="h-4 w-4" />
					</Button>
				</div>

				{#if localPlayers.length > 0}
					<ul class="players-list">
						{#each localPlayers as player, index (player.id)}
							<li class="player-item" class:active={index === localActiveIndex}>
								<button
									type="button"
									class="player-select-btn"
									onclick={() => handleSetActive(index)}
									title={index === localActiveIndex ? 'Active player' : 'Click to set as active'}
								>
									<span class="player-index">{index + 1}.</span>
									<span class="player-name">{player.name}</span>
									{#if index === localActiveIndex}
										<span class="active-badge">Active</span>
									{/if}
								</button>
								<Button
									variant="ghost"
									size="icon"
									class="remove-btn"
									onclick={() => handleRemovePlayer(player.id)}
									aria-label={`Remove ${player.name}`}
									title="Remove"
								>
									<X class="h-3 w-3" />
								</Button>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="empty-state">
						<Users class="h-12 w-12" />
						<p>No players yet</p>
						<span class="empty-hint">Add players to track turn order</span>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background-color: oklch(0% 0 0 / 0.5);
		animation: fade-in 0.15s ease-out;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.sheet-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		max-width: 400px;
		background-color: var(--color-background);
		border-left: 1px solid var(--color-border);
		box-shadow: -4px 0 24px oklch(0% 0 0 / 0.3);
		display: flex;
		flex-direction: column;
		animation: slide-in 0.2s ease-out;
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.sheet-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border);
		position: relative;
	}

	.header-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
		padding-right: 2rem;
	}

	.sheet-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
	}

	.button-text {
		display: none;
	}

	@media (min-width: 360px) {
		.button-text {
			display: inline;
		}
	}

	.sheet-description {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.sheet-header :global(.close-btn) {
		position: absolute;
		top: 1rem;
		right: 1rem;
	}

	.sheet-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.players-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.player-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		border: 2px solid transparent;
		transition: border-color 0.15s;
	}

	.player-item.active {
		border-color: oklch(70% 0.15 200);
		background-color: oklch(from oklch(70% 0.15 200) l c h / 0.1);
	}

	.player-select-btn {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: var(--color-foreground);
		font-size: 0.875rem;
	}

	.player-index {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		min-width: 1.5rem;
	}

	.player-name {
		font-weight: 500;
		flex: 1;
	}

	.active-badge {
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		font-weight: 500;
		background-color: oklch(70% 0.15 200);
		color: white;
		border-radius: var(--radius);
	}

	.player-item :global(.remove-btn) {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.player-item :global(.remove-btn:hover) {
		color: var(--color-destructive);
	}

	.add-player-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.add-player-row :global(input) {
		flex: 1;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		gap: 0.5rem;
		color: var(--color-muted-foreground);
	}

	.empty-state :global(svg) {
		opacity: 0.5;
	}

	.empty-hint {
		font-size: 0.875rem;
	}

	@media (max-width: 480px) {
		.sheet-panel {
			max-width: 100%;
		}
	}
</style>
