<script lang="ts">
	import type { Period, Event, Scene, Tone } from '$lib/types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import ToneToggle from './ToneToggle.svelte';
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

	// Sync form state when item changes
	$effect(() => {
		if (item) {
			name = item.name;
			description = item.description ?? '';
			tone = item.tone;

			// Scene-specific fields
			if (itemType === 'scene' && 'question' in item) {
				question = (item as Scene).question ?? '';
				answer = (item as Scene).answer ?? '';
			}
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
		onOpenChange(false);
	}

	function handleDelete() {
		onDelete();
		onOpenChange(false);
	}

	function handleToneChange(newTone: Tone) {
		tone = newTone;
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="edit-modal">
		<Dialog.Header>
			<Dialog.Title>{getTitle()}</Dialog.Title>
			<Dialog.Description>
				Make changes to your {itemType}. Changes are saved automatically.
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
				<Input
					id="item-name"
					bind:value={name}
					placeholder={`Enter ${itemType} name`}
					oninput={() => validateName()}
				/>
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
				<Textarea
					id="item-description"
					bind:value={description}
					placeholder="Add notes or description..."
					rows={3}
				/>
			</div>

			{#if itemType === 'scene'}
				<div class="form-field">
					<label for="scene-question" class="form-label">Question</label>
					<Input
						id="scene-question"
						bind:value={question}
						placeholder="What question does this scene explore?"
					/>
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
</style>
