<script lang="ts">
	import type { Palette } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { generatePaletteElement } from '$lib/utils/oracle/index';
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import Check from 'lucide-svelte/icons/check';
	import Ban from 'lucide-svelte/icons/ban';
	import Dices from 'lucide-svelte/icons/dices';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		palette: Palette;
		onSave: (palette: Palette) => void;
	}

	let { open, onOpenChange, palette, onSave }: Props = $props();

	// Local state for editing
	let yesItems = $state<string[]>([]);
	let noItems = $state<string[]>([]);
	let newYesItem = $state('');
	let newNoItem = $state('');

	// Sync local state when palette changes or sheet opens
	$effect(() => {
		if (open) {
			yesItems = [...(palette.yes ?? [])];
			noItems = [...(palette.no ?? [])];
			newYesItem = '';
			newNoItem = '';
		}
	});

	function handleAddYes() {
		const trimmed = newYesItem.trim();
		if (!trimmed || yesItems.includes(trimmed)) return;
		yesItems = [...yesItems, trimmed];
		newYesItem = '';
		saveChanges();
	}

	function handleAddNo() {
		const trimmed = newNoItem.trim();
		if (!trimmed || noItems.includes(trimmed)) return;
		noItems = [...noItems, trimmed];
		newNoItem = '';
		saveChanges();
	}

	function handleGenerateYes() {
		const result = generatePaletteElement('light');
		newYesItem = result.text;
	}

	function handleGenerateNo() {
		const result = generatePaletteElement('dark');
		newNoItem = result.text;
	}

	function handleRemoveYes(index: number) {
		yesItems = yesItems.filter((_, i) => i !== index);
		saveChanges();
	}

	function handleRemoveNo(index: number) {
		noItems = noItems.filter((_, i) => i !== index);
		saveChanges();
	}

	function saveChanges() {
		onSave({ yes: yesItems, no: noItems });
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
		<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="palette-title">
			<div class="sheet-header">
				<h2 id="palette-title" class="sheet-title">Palette</h2>
				<p class="sheet-description">
					Things the group agrees to include or ban from the history.
				</p>
				<Button
					variant="ghost"
					size="icon"
					class="close-btn"
					onclick={handleClose}
					aria-label="Close palette"
					title="Close"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>

			<div class="sheet-content">
				<!-- Yes Section -->
				<section class="palette-section yes-section">
					<div class="section-header">
						<Check class="h-4 w-4 section-icon" />
						<h3 class="section-title">Yes (Allowed)</h3>
					</div>
					<p class="section-description">Things explicitly allowed in the history.</p>

					{#if yesItems.length > 0}
						<ul class="palette-list">
							{#each yesItems as item, index (index)}
								<li class="palette-item">
									<span class="item-text">{item}</span>
									<Button
										variant="ghost"
										size="icon"
										class="remove-btn"
										onclick={() => handleRemoveYes(index)}
										aria-label={`Remove "${item}"`}
										title="Remove"
									>
										<X class="h-3 w-3" />
									</Button>
								</li>
							{/each}
						</ul>
					{/if}

					<div class="add-item-row">
						<Input
							bind:value={newYesItem}
							placeholder="Add something allowed..."
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleAddYes();
								}
							}}
						/>
						<Button
							variant="ghost"
							size="icon"
							onclick={handleGenerateYes}
							title="Generate random suggestion"
						>
							<Dices class="h-4 w-4" />
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onclick={handleAddYes}
							disabled={!newYesItem.trim()}
							title="Add to Yes list"
						>
							<Plus class="h-4 w-4" />
						</Button>
					</div>
				</section>

				<!-- No Section -->
				<section class="palette-section no-section">
					<div class="section-header">
						<Ban class="h-4 w-4 section-icon" />
						<h3 class="section-title">No (Banned)</h3>
					</div>
					<p class="section-description">Things explicitly banned from the history.</p>

					{#if noItems.length > 0}
						<ul class="palette-list">
							{#each noItems as item, index (index)}
								<li class="palette-item">
									<span class="item-text">{item}</span>
									<Button
										variant="ghost"
										size="icon"
										class="remove-btn"
										onclick={() => handleRemoveNo(index)}
										aria-label={`Remove "${item}"`}
										title="Remove"
									>
										<X class="h-3 w-3" />
									</Button>
								</li>
							{/each}
						</ul>
					{/if}

					<div class="add-item-row">
						<Input
							bind:value={newNoItem}
							placeholder="Add something banned..."
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleAddNo();
								}
							}}
						/>
						<Button
							variant="ghost"
							size="icon"
							onclick={handleGenerateNo}
							title="Generate random suggestion"
						>
							<Dices class="h-4 w-4" />
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onclick={handleAddNo}
							disabled={!newNoItem.trim()}
							title="Add to No list"
						>
							<Plus class="h-4 w-4" />
						</Button>
					</div>
				</section>
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
		gap: 2rem;
	}

	.palette-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.yes-section :global(.section-icon) {
		color: oklch(65% 0.2 145);
	}

	.no-section :global(.section-icon) {
		color: oklch(60% 0.2 25);
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
	}

	.section-description {
		font-size: 0.8125rem;
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.palette-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.palette-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
	}

	.yes-section .palette-item {
		border-left: 3px solid oklch(65% 0.2 145);
	}

	.no-section .palette-item {
		border-left: 3px solid oklch(60% 0.2 25);
	}

	.item-text {
		font-size: 0.875rem;
		color: var(--color-foreground);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.palette-item :global(.remove-btn) {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.palette-item :global(.remove-btn:hover) {
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

	@media (max-width: 480px) {
		.sheet-panel {
			max-width: 100%;
		}
	}
</style>
