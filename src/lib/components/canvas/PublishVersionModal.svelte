<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import Bookmark from 'lucide-svelte/icons/bookmark';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		defaultName: string;
		changeSummary: string;
		onPublish: (versionName: string) => void;
		isPublishing: boolean;
	}

	let { open, onOpenChange, defaultName, changeSummary, onPublish, isPublishing }: Props = $props();

	let versionName = $state('');

	// Reset version name when dialog opens
	$effect(() => {
		if (open) {
			versionName = defaultName;
		}
	});

	function handleSubmit() {
		if (!isPublishing) {
			onPublish(versionName.trim() || defaultName);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isPublishing) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent class="publish-modal">
		<DialogHeader>
			<DialogTitle class="publish-title">
				<Bookmark class="h-5 w-5" />
				Publish Version
			</DialogTitle>
			<DialogDescription>
				Save a checkpoint of your current world state. You can restore any published version later.
			</DialogDescription>
		</DialogHeader>

		<div class="publish-form">
			<label for="version-name" class="form-label">Version Name (optional)</label>
			<Input
				id="version-name"
				bind:value={versionName}
				placeholder={defaultName}
				disabled={isPublishing}
				onkeydown={handleKeydown}
			/>
			{#if changeSummary}
				<div class="change-summary">
					<span class="summary-label">Changes since last version:</span>
					<span class="summary-text">{changeSummary}</span>
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="secondary" onclick={() => onOpenChange(false)} disabled={isPublishing}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={isPublishing}>
				{#if isPublishing}
					<Loader2 class="h-4 w-4 animate-spin" />
					Publishing...
				{:else}
					Publish
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<style>
	:global(.publish-modal) {
		max-width: 450px;
	}

	:global(.publish-title) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.publish-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem 0;
	}

	.form-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.change-summary {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		font-size: 0.8125rem;
	}

	.summary-label {
		font-weight: 500;
		color: var(--color-muted-foreground);
	}

	.summary-text {
		color: var(--color-foreground);
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
