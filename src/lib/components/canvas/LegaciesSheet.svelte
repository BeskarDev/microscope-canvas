<script lang="ts">
	import type { Legacy } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { generateLegacy } from '$lib/utils/oracle/index';
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import BookMarked from 'lucide-svelte/icons/book-marked';
	import Dices from 'lucide-svelte/icons/dices';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		legacies: Legacy[];
		onSave: (legacies: Legacy[]) => void;
	}

	let { open, onOpenChange, legacies, onSave }: Props = $props();

	// Local state for editing
	let localLegacies = $state<Legacy[]>([]);
	let newLegacyName = $state('');

	// Sync local state when legacies change or sheet opens
	$effect(() => {
		if (open) {
			localLegacies = legacies.map(l => ({ ...l }));
			newLegacyName = '';
		}
	});

	function handleAddLegacy() {
		const trimmed = newLegacyName.trim();
		if (!trimmed) return;
		const newLegacy: Legacy = {
			id: crypto.randomUUID(),
			name: trimmed
		};
		localLegacies = [...localLegacies, newLegacy];
		newLegacyName = '';
		saveChanges();
	}

	function handleRemoveLegacy(legacyId: string) {
		localLegacies = localLegacies.filter(l => l.id !== legacyId);
		saveChanges();
	}

	function handleGenerateLegacy() {
		const result = generateLegacy();
		newLegacyName = result;
	}

	function saveChanges() {
		onSave(localLegacies);
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
		<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="legacies-title">
			<div class="sheet-header">
				<h2 id="legacies-title" class="sheet-title">Legacies</h2>
				<p class="sheet-description">
					Recurring elements that persist through history (characters, places, organizations).
				</p>
				<Button
					variant="ghost"
					size="icon"
					class="close-btn"
					onclick={handleClose}
					aria-label="Close legacies"
					title="Close"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>

			<div class="sheet-content">
				<div class="add-legacy-row">
					<Input
						bind:value={newLegacyName}
						placeholder="Legacy name..."
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleAddLegacy();
							}
						}}
					/>
					<Button
						variant="ghost"
						size="icon"
						onclick={handleGenerateLegacy}
						title="Generate random legacy"
					>
						<Dices class="h-4 w-4" />
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onclick={handleAddLegacy}
						disabled={!newLegacyName.trim()}
						title="Add legacy"
					>
						<Plus class="h-4 w-4" />
					</Button>
				</div>

				{#if localLegacies.length > 0}
					<ul class="legacies-list">
						{#each localLegacies as legacy (legacy.id)}
							<li class="legacy-item">
								<span class="legacy-name">{legacy.name}</span>
								<Button
									variant="ghost"
									size="icon"
									class="remove-btn"
									onclick={() => handleRemoveLegacy(legacy.id)}
									aria-label={`Remove ${legacy.name}`}
									title="Remove"
								>
									<X class="h-3 w-3" />
								</Button>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="empty-state">
						<BookMarked class="h-12 w-12" />
						<p>No legacies yet</p>
						<span class="empty-hint">Add recurring elements to track</span>
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

	.sheet-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0 0 0.25rem 0;
		padding-right: 2rem;
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

	.legacies-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.legacy-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		border: 1px solid transparent;
		transition: border-color 0.15s;
	}

	.legacy-item:hover {
		border-color: var(--color-border);
	}

	.legacy-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.legacy-item :global(.remove-btn) {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.legacy-item :global(.remove-btn:hover) {
		color: var(--color-destructive);
	}

	.add-legacy-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.add-legacy-row :global(input) {
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
