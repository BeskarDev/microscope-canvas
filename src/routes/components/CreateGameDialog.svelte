<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Dialog from '$lib/components/ui/dialog';
	import Dices from 'lucide-svelte/icons/dices';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import { generateNameInspiration, generateHistorySeed } from '$lib/utils/oracle/index';

	interface Props {
		open: boolean;
		isCreating: boolean;
		onOpenChange: (open: boolean) => void;
		onCreate: (name: string, bigPicture: string) => void;
	}

	let { open, isCreating, onOpenChange, onCreate }: Props = $props();

	// Local state for form
	let newGameName = $state('');
	let newBigPicture = $state('');

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			newGameName = '';
			newBigPicture = '';
		}
	});

	function handleGenerateName() {
		newGameName = generateNameInspiration();
	}

	function handleGenerateBigPicture() {
		newBigPicture = generateHistorySeed();
	}

	function handleCreate() {
		const trimmedName = newGameName.trim();
		if (!trimmedName) return;
		onCreate(trimmedName, newBigPicture.trim());
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isCreating) {
			handleCreate();
		}
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create New History</Dialog.Title>
			<Dialog.Description>Give your Microscope history a name to get started.</Dialog.Description>
		</Dialog.Header>
		<div class="create-form">
			<div class="form-field">
				<div class="form-label-row">
					<label for="game-name" class="form-label">History Name</label>
					<Button
						variant="ghost"
						size="icon"
						class="oracle-btn"
						onclick={handleGenerateName}
						disabled={isCreating}
						title="Generate random name"
						type="button"
					>
						<Dices class="h-4 w-4" />
					</Button>
				</div>
				<Input
					id="game-name"
					bind:value={newGameName}
					placeholder="e.g., Rise and Fall of the Star Empire"
					disabled={isCreating}
					onkeydown={handleKeyDown}
				/>
			</div>

			<div class="form-field">
				<div class="form-label-row">
					<label for="big-picture" class="form-label">Big Picture</label>
					<Button
						variant="ghost"
						size="icon"
						class="oracle-btn"
						onclick={handleGenerateBigPicture}
						disabled={isCreating}
						title="Generate random concept"
						type="button"
					>
						<Dices class="h-4 w-4" />
					</Button>
				</div>
				<Textarea
					id="big-picture"
					bind:value={newBigPicture}
					placeholder="The rise and fall of a galactic civilization..."
					disabled={isCreating}
					rows={3}
				/>
				<p class="form-hint">What is this history about? What is the overarching theme?</p>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="secondary" onclick={() => onOpenChange(false)} disabled={isCreating}>
				Cancel
			</Button>
			<Button onclick={handleCreate} disabled={isCreating || !newGameName.trim()}>
				{#if isCreating}
					<Loader2 class="h-4 w-4 animate-spin" />
					Creating...
				{:else}
					Create History
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.create-form {
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

	.form-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.create-form :global(.oracle-btn) {
		width: 1.75rem;
		height: 1.75rem;
		color: var(--color-muted-foreground);
	}

	.create-form :global(.oracle-btn:hover) {
		color: var(--color-primary);
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
</style>
