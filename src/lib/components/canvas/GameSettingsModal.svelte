<script lang="ts">
	import type { Game } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

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
	let nameError = $state<string | null>(null);

	// Sync form state when game changes
	$effect(() => {
		if (game) {
			name = game.name;
			focusName = game.focus?.name ?? '';
			focusDescription = game.focus?.description ?? '';
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

	function handleSave() {
		if (!validateName()) return;

		const updates: Partial<Game> = {
			name: name.trim()
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
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Game Settings</Dialog.Title>
			<Dialog.Description>Configure your game's name and current focus.</Dialog.Description>
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
</style>
