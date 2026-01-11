<script lang="ts">
	import type { Period, Event, Scene, Tone } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import ToneToggle from './ToneToggle.svelte';
	import OracleDiceButton from './OracleDiceButton.svelte';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	type ItemType = 'period' | 'event' | 'scene';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		itemType: ItemType;
		item: Period | Event | Scene | null;
		onSave: (updates: Partial<Period | Event | Scene>) => void;
		onDelete: () => void;
	}

	let { open, onOpenChange, itemType, item, onSave, onDelete }: Props = $props();

	// Local form state
	let name = $state('');
	let description = $state('');
	let tone = $state<Tone>('light');
	let question = $state('');
	let answer = $state('');
	let nameError = $state<string | null>(null);

	// Track original values to detect unsaved changes
	let originalName = $state('');
	let originalDescription = $state('');
	let originalTone = $state<Tone>('light');
	let originalQuestion = $state('');
	let originalAnswer = $state('');

	// Track item ID to force reset when item changes
	let currentItemId = $state<string | null>(null);

	// Unsaved changes warning state
	let showUnsavedWarning = $state(false);

	// Detect if there are unsaved changes
	const hasUnsavedChanges = $derived(() => {
		if (!item) return false;
		if (name !== originalName) return true;
		if (description !== originalDescription) return true;
		if (tone !== originalTone) return true;
		if (itemType === 'scene') {
			if (question !== originalQuestion) return true;
			if (answer !== originalAnswer) return true;
		}
		return false;
	});

	// Reset form state function
	function resetFormState() {
		if (item) {
			name = item.name;
			description = item.description ?? '';
			tone = item.tone;

			// Store original values
			originalName = name;
			originalDescription = description;
			originalTone = tone;

			// Scene-specific fields
			if (itemType === 'scene' && 'question' in item) {
				question = (item as Scene).question ?? '';
				answer = (item as Scene).answer ?? '';
				originalQuestion = question;
				originalAnswer = answer;
			} else {
				question = '';
				answer = '';
				originalQuestion = '';
				originalAnswer = '';
			}

			currentItemId = item.id;
			nameError = null;
		} else {
			// Reset all values when no item
			name = '';
			description = '';
			tone = 'light';
			question = '';
			answer = '';
			originalName = '';
			originalDescription = '';
			originalTone = 'light';
			originalQuestion = '';
			originalAnswer = '';
			currentItemId = null;
			nameError = null;
		}
	}

	// Sync form state when item changes (using item.id as dependency)
	$effect(() => {
		const itemId = item?.id ?? null;
		// Only reset if the item ID changed (different item selected)
		if (itemId !== currentItemId) {
			resetFormState();
		}
	});

	// Also reset when dialog opens with an item
	$effect(() => {
		if (open && item && item.id !== currentItemId) {
			resetFormState();
		}
	});

	function getTitle(): string {
		switch (itemType) {
			case 'period':
				return 'Edit Period';
			case 'event':
				return 'Edit Event';
			case 'scene':
				return 'Edit Scene';
			default:
				return 'Edit';
		}
	}

	function validateName(): boolean {
		if (!name.trim()) {
			nameError = 'Name is required';
			return false;
		}
		nameError = null;
		return true;
	}

	function handleSave() {
		if (!validateName()) return;

		const updates: Partial<Period | Event | Scene> = {
			name: name.trim(),
			description: description.trim() || undefined,
			tone
		};

		if (itemType === 'scene') {
			Object.assign(updates, {
				question: question.trim() || undefined,
				answer: answer.trim() || undefined
			});
		}

		onSave(updates);
		// Reset tracking after save
		originalName = name;
		originalDescription = description;
		originalTone = tone;
		originalQuestion = question;
		originalAnswer = answer;
		onOpenChange(false);
	}

	function handleDelete() {
		onDelete();
		onOpenChange(false);
	}

	function handleToneChange(newTone: Tone) {
		tone = newTone;
	}

	function handleClose() {
		if (hasUnsavedChanges()) {
			showUnsavedWarning = true;
		} else {
			onOpenChange(false);
		}
	}

	function handleDiscardChanges() {
		showUnsavedWarning = false;
		resetFormState();
		onOpenChange(false);
	}

	function handleContinueEditing() {
		showUnsavedWarning = false;
	}

	// Intercept dialog close to check for unsaved changes
	function handleOpenChange(newOpen: boolean) {
		if (!newOpen && hasUnsavedChanges()) {
			showUnsavedWarning = true;
		} else {
			onOpenChange(newOpen);
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="edit-modal">
		<Dialog.Header>
			<Dialog.Title>{getTitle()}</Dialog.Title>
			<Dialog.Description>
				Make changes to your {itemType}. Click "Save Changes" when done.
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="edit-form"
			onsubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
		>
			<div class="form-field">
				<label for="item-name" class="form-label">Name</label>
				<div class="input-with-oracle">
					<Input
						id="item-name"
						bind:value={name}
						placeholder={`Enter ${itemType} name`}
						oninput={() => validateName()}
					/>
					<OracleDiceButton
						category="name"
						onResult={(result) => {
							name = result;
							validateName();
						}}
						title="Generate random name"
					/>
				</div>
				{#if nameError}
					<p class="error-message">{nameError}</p>
				{/if}
			</div>

			<fieldset class="form-field tone-fieldset">
				<legend class="form-label">Tone</legend>
				<ToneToggle value={tone} onchange={handleToneChange} />
			</fieldset>

			<div class="form-field">
				<label for="item-description" class="form-label">Description</label>
				<div class="input-with-oracle">
					<Textarea
						id="item-description"
						bind:value={description}
						placeholder="Add notes or description..."
						rows={3}
					/>
					<OracleDiceButton
						category="seed"
						onResult={(result) => {
							description = result;
						}}
						title="Generate random inspiration"
					/>
				</div>
			</div>

			{#if itemType === 'scene'}
				<div class="form-field">
					<label for="scene-question" class="form-label">Question</label>
					<div class="input-with-oracle">
						<Input
							id="scene-question"
							bind:value={question}
							placeholder="What question does this scene explore?"
						/>
						<OracleDiceButton
							category="scene"
							onResult={(result) => {
								question = result;
							}}
							title="Generate random scene question"
						/>
					</div>
				</div>

				<div class="form-field">
					<label for="scene-answer" class="form-label">Answer</label>
					<Textarea
						id="scene-answer"
						bind:value={answer}
						placeholder="What answer was discovered?"
						rows={2}
					/>
				</div>
			{/if}
		</form>

		<Dialog.Footer class="modal-footer">
			<Button type="button" variant="destructive" onclick={handleDelete} class="delete-button">
				<Trash2 class="h-4 w-4" />
				Delete
			</Button>
			<div class="spacer"></div>
			<Button type="button" variant="secondary" onclick={handleClose}>Cancel</Button>
			<Button type="button" onclick={handleSave} disabled={!!nameError || !name.trim()}>
				Save Changes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Unsaved changes warning dialog -->
<AlertDialog.Root bind:open={showUnsavedWarning}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Unsaved Changes</AlertDialog.Title>
			<AlertDialog.Description>
				You have unsaved changes. Do you want to discard them?
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={handleContinueEditing}>Continue Editing</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDiscardChanges}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Discard Changes
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

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

	.input-with-oracle {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.input-with-oracle :global(input),
	.input-with-oracle :global(textarea) {
		flex: 1;
	}

	.tone-fieldset {
		border: none;
		padding: 0;
		margin: 0;
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

	:global(.modal-footer) {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	:global(.modal-footer .delete-button) {
		margin-right: auto;
	}

	.spacer {
		flex: 1;
	}

	/* Modal responsive sizing and scrolling */
	:global(.edit-modal) {
		/* Use dvh (dynamic viewport height) for better mobile support, with vh as fallback */
		max-height: calc(100vh - 2rem);
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.edit-modal) .edit-form {
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	@media (max-width: 640px) {
		:global(.edit-modal) {
			max-width: calc(100vw - 2rem);
		}
	}
</style>
