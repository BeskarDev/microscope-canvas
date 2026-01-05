<script lang="ts">
	import type { Game, Legacy } from '$lib/types';
	import { createNewLegacy } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		game: Game | null;
		onSave: (updates: Partial<Game>) => void;
	}

	let { open, onOpenChange, game, onSave }: Props = $props();

	// Local form state
	let name = $state('');
	let focusName = $state('');
	let focusDescription = $state('');
	let legacies = $state<Legacy[]>([]);
	let newLegacyName = $state('');
	let nameError = $state<string | null>(null);

	// Sync form state when game changes
	$effect(() => {
		if (game) {
			name = game.name;
			focusName = game.focus?.name ?? '';
			focusDescription = game.focus?.description ?? '';
			// Deep clone legacies to avoid mutation
			legacies = JSON.parse(JSON.stringify(game.legacies ?? []));
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

	function handleSave() {
		if (!validateName()) return;

		const updates: Partial<Game> = {
			name: name.trim(),
			legacies: legacies
		};

		// Only add focus if name is provided
		if (focusName.trim()) {
			updates.focus = {
				id: game?.focus?.id ?? crypto.randomUUID(),
				name: focusName.trim(),
				description: focusDescription.trim() || undefined
			};
		} else {
			updates.focus = undefined;
		}

		onSave(updates);
		onOpenChange(false);
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="settings-dialog">
		<Dialog.Header>
			<Dialog.Title>Game Settings</Dialog.Title>
			<Dialog.Description>Configure your game's name, focus, and legacies.</Dialog.Description>
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

			<div class="form-section">
				<h3 class="section-title">Current Focus</h3>
				<p class="section-description">The theme or element being explored in the current round.</p>

				<div class="form-field">
					<label for="focus-name" class="form-label">Focus Name</label>
					<Input id="focus-name" bind:value={focusName} placeholder="e.g., The Lost City" />
				</div>

				<div class="form-field">
					<label for="focus-description" class="form-label">Focus Description</label>
					<Textarea
						id="focus-description"
						bind:value={focusDescription}
						placeholder="Additional details about the focus..."
						rows={2}
					/>
				</div>
			</div>

			<div class="form-section">
				<h3 class="section-title">Legacies</h3>
				<p class="section-description">
					Recurring elements that persist through history (characters, places, organizations).
				</p>

				<!-- Existing legacies -->
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
										class="remove-legacy-btn"
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

	:global(.settings-dialog) {
		max-width: 500px;
	}
</style>
