<script lang="ts">
	import type { Focus } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { generateFocus } from '$lib/utils/oracle/index';
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import Target from 'lucide-svelte/icons/target';
	import Dices from 'lucide-svelte/icons/dices';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		focuses: Focus[];
		currentFocusIndex: number;
		onSave: (focuses: Focus[], currentFocusIndex: number) => void;
	}

	let { open, onOpenChange, focuses, currentFocusIndex, onSave }: Props = $props();

	// Local state for editing
	let localFocuses = $state<Focus[]>([]);
	let localCurrentIndex = $state(-1);
	let newFocusName = $state('');
	let newFocusDescription = $state('');

	// Sync local state when focuses change or sheet opens
	$effect(() => {
		if (open) {
			localFocuses = focuses.map(f => ({ ...f }));
			localCurrentIndex = currentFocusIndex;
			newFocusName = '';
			newFocusDescription = '';
		}
	});

	function handleAddFocus() {
		const trimmed = newFocusName.trim();
		if (!trimmed) return;
		const newFocus: Focus = {
			id: crypto.randomUUID(),
			name: trimmed,
			description: newFocusDescription.trim() || undefined
		};
		localFocuses = [...localFocuses, newFocus];
		newFocusName = '';
		newFocusDescription = '';
		// Auto-set first focus as current
		if (localFocuses.length === 1) {
			localCurrentIndex = 0;
		}
		saveChanges();
	}

	function handleRemoveFocus(focusId: string) {
		const idx = localFocuses.findIndex(f => f.id === focusId);
		localFocuses = localFocuses.filter(f => f.id !== focusId);
		// Adjust current index
		if (localCurrentIndex >= localFocuses.length) {
			localCurrentIndex = localFocuses.length - 1;
		} else if (idx < localCurrentIndex) {
			localCurrentIndex = localCurrentIndex - 1;
		}
		saveChanges();
	}

	function handleSetCurrent(index: number) {
		localCurrentIndex = index;
		saveChanges();
	}

	function handleGenerateFocus() {
		const result = generateFocus();
		newFocusName = result;
	}

	function saveChanges() {
		onSave(localFocuses, localCurrentIndex);
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
		<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="focuses-title">
			<div class="sheet-header">
				<h2 id="focuses-title" class="sheet-title">Focuses</h2>
				<p class="sheet-description">
					Themes or elements to explore. Click to set the current focus.
				</p>
				<Button
					variant="ghost"
					size="icon"
					class="close-btn"
					onclick={handleClose}
					aria-label="Close focuses"
					title="Close"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>

			<div class="sheet-content">
				{#if localFocuses.length > 0}
					<ul class="focuses-list">
						{#each localFocuses as focus, index (focus.id)}
							<li class="focus-item" class:current={index === localCurrentIndex}>
								<button
									type="button"
									class="focus-select-btn"
									onclick={() => handleSetCurrent(index)}
									title={index === localCurrentIndex ? 'Current focus' : 'Click to set as current'}
								>
									<div class="focus-content">
										<div class="focus-header">
											<span class="focus-name">{focus.name}</span>
											{#if index === localCurrentIndex}
												<span class="current-badge">Current</span>
											{/if}
										</div>
										{#if focus.description}
											<span class="focus-description">{focus.description}</span>
										{/if}
									</div>
								</button>
								<Button
									variant="ghost"
									size="icon"
									class="remove-btn"
									onclick={() => handleRemoveFocus(focus.id)}
									aria-label={`Remove ${focus.name}`}
									title="Remove"
								>
									<X class="h-3 w-3" />
								</Button>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="empty-state">
						<Target class="h-12 w-12" />
						<p>No focuses yet</p>
						<span class="empty-hint">Add themes or elements to explore</span>
					</div>
				{/if}

				<div class="add-focus-section">
					<div class="input-with-oracle">
						<Input
							bind:value={newFocusName}
							placeholder="Focus name (e.g., The Lost City)"
							onkeydown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									handleAddFocus();
								}
							}}
						/>
						<Button
							variant="ghost"
							size="icon"
							onclick={handleGenerateFocus}
							title="Generate random focus"
						>
							<Dices class="h-4 w-4" />
						</Button>
					</div>
					<Textarea
						bind:value={newFocusDescription}
						placeholder="Description (optional)"
						rows={2}
					/>
					<Button
						variant="secondary"
						size="sm"
						onclick={handleAddFocus}
						disabled={!newFocusName.trim()}
						title="Add focus"
						class="add-btn"
					>
						<Plus class="h-4 w-4" />
						<span>Add Focus</span>
					</Button>
				</div>
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

	.focuses-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.focus-item {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		border: 2px solid transparent;
		transition: border-color 0.15s;
	}

	.focus-item.current {
		border-color: oklch(65% 0.2 25);
		background-color: oklch(from oklch(65% 0.2 25) l c h / 0.1);
	}

	.focus-select-btn {
		flex: 1;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: var(--color-foreground);
		font-size: 0.875rem;
	}

	.focus-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.focus-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.focus-name {
		font-weight: 500;
	}

	.focus-description {
		font-size: 0.8125rem;
		color: var(--color-muted-foreground);
		line-height: 1.4;
	}

	.current-badge {
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		font-weight: 500;
		background-color: oklch(65% 0.2 25);
		color: white;
		border-radius: var(--radius);
	}

	.focus-item :global(.remove-btn) {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: var(--color-muted-foreground);
		margin-top: 0.5rem;
	}

	.focus-item :global(.remove-btn:hover) {
		color: var(--color-destructive);
	}

	.add-focus-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.input-with-oracle {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.input-with-oracle :global(input) {
		flex: 1;
	}

	.add-focus-section :global(.add-btn) {
		align-self: flex-start;
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
