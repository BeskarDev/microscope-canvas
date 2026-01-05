<script lang="ts">
	import type { Game, Legacy, Player, Focus } from '$lib/types';
	import { createNewLegacy, createNewPlayer, createNewFocus } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';
	import Shuffle from 'lucide-svelte/icons/shuffle';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		game: Game | null;
		onSave: (updates: Partial<Game>) => void;
	}

	let { open, onOpenChange, game, onSave }: Props = $props();

	// Local form state
	let name = $state('');
	let legacies = $state<Legacy[]>([]);
	let newLegacyName = $state('');
	let players = $state<Player[]>([]);
	let newPlayerName = $state('');
	let activePlayerIndex = $state(-1);
	let focuses = $state<Focus[]>([]);
	let newFocusName = $state('');
	let newFocusDescription = $state('');
	let currentFocusIndex = $state(-1);
	let nameError = $state<string | null>(null);

	// Sync form state when game changes
	$effect(() => {
		if (game) {
			name = game.name;
			// Deep clone arrays to avoid mutation
			legacies = JSON.parse(JSON.stringify(game.legacies ?? []));
			players = JSON.parse(JSON.stringify(game.players ?? []));
			activePlayerIndex = game.activePlayerIndex ?? -1;
			focuses = JSON.parse(JSON.stringify(game.focuses ?? []));
			currentFocusIndex = game.currentFocusIndex ?? -1;
		}
	});

	function validateName(): boolean {
		if (!name.trim()) {
			nameError = 'Game name is required';
			return false;
		}
		nameError = null;
		return true;
	}

	// Legacy handlers
	function handleAddLegacy() {
		const trimmedName = newLegacyName.trim();
		if (!trimmedName) return;
		const legacy = createNewLegacy(trimmedName);
		legacies = [...legacies, legacy];
		newLegacyName = '';
	}

	function handleRemoveLegacy(legacyId: string) {
		legacies = legacies.filter((l) => l.id !== legacyId);
	}

	function handleUpdateLegacyDescription(legacyId: string, description: string) {
		legacies = legacies.map((l) =>
			l.id === legacyId ? { ...l, description: description.trim() || undefined } : l
		);
	}

	// Player handlers
	function handleAddPlayer() {
		const trimmedName = newPlayerName.trim();
		if (!trimmedName) return;
		const player = createNewPlayer(trimmedName);
		players = [...players, player];
		newPlayerName = '';
		// Auto-set first player as active
		if (players.length === 1) {
			activePlayerIndex = 0;
		}
	}

	function handleRemovePlayer(playerId: string) {
		const idx = players.findIndex((p) => p.id === playerId);
		players = players.filter((p) => p.id !== playerId);
		// Adjust active index
		if (activePlayerIndex >= players.length) {
			activePlayerIndex = players.length - 1;
		} else if (idx < activePlayerIndex) {
			activePlayerIndex = activePlayerIndex - 1;
		}
	}

	function handleRandomizePlayerOrder() {
		if (players.length < 2) return;
		// Fisher-Yates shuffle
		const shuffled = [...players];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		players = shuffled;
		// Reset active player to first
		activePlayerIndex = 0;
	}

	// Focus handlers
	function handleAddFocus() {
		const trimmedName = newFocusName.trim();
		if (!trimmedName) return;
		const focus = createNewFocus(trimmedName);
		focus.description = newFocusDescription.trim() || undefined;
		focuses = [...focuses, focus];
		newFocusName = '';
		newFocusDescription = '';
		// Auto-set first focus as current
		if (focuses.length === 1) {
			currentFocusIndex = 0;
		}
	}

	function handleRemoveFocus(focusId: string) {
		const idx = focuses.findIndex((f) => f.id === focusId);
		focuses = focuses.filter((f) => f.id !== focusId);
		// Adjust current index
		if (currentFocusIndex >= focuses.length) {
			currentFocusIndex = focuses.length - 1;
		} else if (idx < currentFocusIndex) {
			currentFocusIndex = currentFocusIndex - 1;
		}
	}

	function handleSave() {
		if (!validateName()) return;

		const updates: Partial<Game> = {
			name: name.trim(),
			legacies: legacies,
			players: players,
			activePlayerIndex: activePlayerIndex,
			focuses: focuses,
			currentFocusIndex: currentFocusIndex,
			// Also update the legacy focus field for backwards compatibility
			focus:
				currentFocusIndex >= 0 && focuses[currentFocusIndex]
					? focuses[currentFocusIndex]
					: undefined
		};

		onSave(updates);
		onOpenChange(false);
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="settings-dialog">
		<Dialog.Header>
			<Dialog.Title>Game Settings</Dialog.Title>
			<Dialog.Description>Configure your game's players, focuses, and legacies.</Dialog.Description>
		</Dialog.Header>

		<form
			class="edit-form"
			onsubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
		>
			<div class="form-field">
				<label for="game-name" class="form-label">Game Name</label>
				<Input
					id="game-name"
					bind:value={name}
					placeholder="Enter game name"
					oninput={() => validateName()}
				/>
				{#if nameError}
					<p class="error-message">{nameError}</p>
				{/if}
			</div>

			<!-- Players Section -->
			<div class="form-section">
				<div class="section-header">
					<div>
						<h3 class="section-title">Players</h3>
						<p class="section-description">Add players for turn order tracking.</p>
					</div>
					{#if players.length >= 2}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={handleRandomizePlayerOrder}
							title="Randomize player order"
						>
							<Shuffle class="h-3.5 w-3.5" />
							<span class="button-text">Shuffle</span>
						</Button>
					{/if}
				</div>

				{#if players.length > 0}
					<div class="items-list">
						{#each players as player, idx (player.id)}
							<div class="list-item" class:active={idx === activePlayerIndex}>
								<button
									type="button"
									class="item-select-btn"
									onclick={() => (activePlayerIndex = idx)}
									title={idx === activePlayerIndex ? 'Active player' : 'Click to set as active'}
								>
									<span class="item-index">{idx + 1}.</span>
									<span class="item-name">{player.name}</span>
									{#if idx === activePlayerIndex}
										<span class="active-badge">Active</span>
									{/if}
								</button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="remove-btn"
									onclick={() => handleRemovePlayer(player.id)}
									aria-label={`Remove ${player.name}`}
								>
									<X class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				{/if}

				<div class="add-item-row">
					<Input
						bind:value={newPlayerName}
						placeholder="Player name"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleAddPlayer();
							}
						}}
					/>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={handleAddPlayer}
						disabled={!newPlayerName.trim()}
					>
						<Plus class="h-4 w-4" />
						Add
					</Button>
				</div>
			</div>

			<!-- Focuses Section -->
			<div class="form-section">
				<h3 class="section-title">Focuses</h3>
				<p class="section-description">
					Themes or elements to explore. Click to set the current focus.
				</p>

				{#if focuses.length > 0}
					<div class="items-list">
						{#each focuses as focus, idx (focus.id)}
							<div class="list-item" class:active={idx === currentFocusIndex}>
								<button
									type="button"
									class="item-select-btn focus-item"
									onclick={() => (currentFocusIndex = idx)}
									title={idx === currentFocusIndex ? 'Current focus' : 'Click to set as current'}
								>
									<span class="item-name">{focus.name}</span>
									{#if focus.description}
										<span class="item-description">{focus.description}</span>
									{/if}
									{#if idx === currentFocusIndex}
										<span class="active-badge">Current</span>
									{/if}
								</button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="remove-btn"
									onclick={() => handleRemoveFocus(focus.id)}
									aria-label={`Remove ${focus.name}`}
								>
									<X class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				{/if}

				<div class="add-focus-fields">
					<Input
						bind:value={newFocusName}
						placeholder="Focus name (e.g., The Lost City)"
						onkeydown={(e) => {
							if (e.key === 'Enter' && newFocusName.trim()) {
								e.preventDefault();
								handleAddFocus();
							}
						}}
					/>
					<Textarea
						bind:value={newFocusDescription}
						placeholder="Description (optional)"
						rows={2}
					/>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={handleAddFocus}
						disabled={!newFocusName.trim()}
						class="add-focus-btn"
					>
						<Plus class="h-4 w-4" />
						Add Focus
					</Button>
				</div>
			</div>

			<!-- Legacies Section -->
			<div class="form-section">
				<h3 class="section-title">Legacies</h3>
				<p class="section-description">
					Recurring elements that persist through history (characters, places, organizations).
				</p>

				{#if legacies.length > 0}
					<div class="legacies-list">
						{#each legacies as legacy (legacy.id)}
							<div class="legacy-item">
								<div class="legacy-header">
									<span class="legacy-name">{legacy.name}</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="remove-btn"
										onclick={() => handleRemoveLegacy(legacy.id)}
										aria-label={`Remove ${legacy.name}`}
									>
										<X class="h-4 w-4" />
									</Button>
								</div>
								<Input
									value={legacy.description ?? ''}
									oninput={(e) =>
										handleUpdateLegacyDescription(legacy.id, (e.target as HTMLInputElement).value)}
									placeholder="Description (optional)"
									class="legacy-description"
								/>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Add new legacy -->
				<div class="add-legacy-row">
					<Input
						bind:value={newLegacyName}
						placeholder="New legacy name"
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleAddLegacy();
							}
						}}
					/>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={handleAddLegacy}
						disabled={!newLegacyName.trim()}
					>
						<Plus class="h-4 w-4" />
						Add
					</Button>
				</div>
			</div>
		</form>

		<Dialog.Footer>
			<Button type="button" variant="secondary" onclick={() => onOpenChange(false)}>Cancel</Button>
			<Button type="button" onclick={handleSave} disabled={!!nameError || !name.trim()}>
				Save Changes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 0;
		padding-right: 0.75rem;
		max-height: 60vh;
		overflow-y: auto;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.error-message {
		font-size: 0.75rem;
		color: var(--color-destructive);
		margin: 0;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		color: var(--color-foreground);
	}

	.section-description {
		font-size: 0.8125rem;
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.legacies-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.legacy-item {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
	}

	.legacy-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.legacy-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.legacy-item :global(.remove-legacy-btn) {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--color-muted-foreground);
	}

	.legacy-item :global(.remove-legacy-btn:hover) {
		color: var(--color-destructive);
	}

	.legacy-item :global(.legacy-description) {
		font-size: 0.8125rem;
	}

	.add-legacy-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.add-legacy-row :global(input) {
		flex: 1;
	}

	/* Section header with actions */
	.section-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.section-header .button-text {
		display: none;
	}

	@media (min-width: 400px) {
		.section-header .button-text {
			display: inline;
		}
	}

	/* Items list (players/focuses) */
	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		border: 1px solid transparent;
		transition: border-color 0.15s;
	}

	.list-item.active {
		border-color: var(--color-primary);
		background-color: oklch(from var(--color-primary) l c h / 0.1);
	}

	.item-select-btn {
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

	.item-select-btn.focus-item {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
	}

	.item-index {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		min-width: 1.5rem;
	}

	.item-name {
		font-weight: 500;
	}

	.item-description {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.active-badge {
		margin-left: auto;
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		font-weight: 500;
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
		border-radius: var(--radius);
	}

	.list-item :global(.remove-btn) {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--color-muted-foreground);
		flex-shrink: 0;
	}

	.list-item :global(.remove-btn:hover) {
		color: var(--color-destructive);
	}

	.add-item-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.add-item-row :global(input) {
		flex: 1;
	}

	.add-focus-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.add-focus-fields :global(.add-focus-btn) {
		align-self: flex-start;
	}

	:global(.settings-dialog) {
		max-width: 600px;
	}

	@media (max-width: 640px) {
		:global(.settings-dialog) {
			max-width: calc(100vw - 2rem);
		}
	}
</style>
