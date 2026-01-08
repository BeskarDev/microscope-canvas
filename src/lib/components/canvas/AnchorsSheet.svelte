<script lang="ts">
	import type { Anchor, AnchorPlacement, Period } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import X from 'lucide-svelte/icons/x';
	import Plus from 'lucide-svelte/icons/plus';
	import Anchor2 from 'lucide-svelte/icons/anchor';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import MapPin from 'lucide-svelte/icons/map-pin';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		anchors: Anchor[];
		currentAnchorId: string | null;
		anchorPlacements: AnchorPlacement[];
		periods: Period[];
		onCreateAnchor: (name: string, description?: string) => void;
		onEditAnchor: (anchorId: string, name: string, description?: string) => void;
		onDeleteAnchor: (anchorId: string) => void;
		onSetCurrentAnchor: (anchorId: string, periodId: string) => void;
		onClearCurrentAnchor: () => void;
	}

	let {
		open,
		onOpenChange,
		anchors,
		currentAnchorId,
		anchorPlacements,
		periods,
		onCreateAnchor,
		onEditAnchor,
		onDeleteAnchor,
		onSetCurrentAnchor,
		onClearCurrentAnchor
	}: Props = $props();

	// Local state
	let newAnchorName = $state('');
	let newAnchorDescription = $state('');
	let editingAnchorId = $state<string | null>(null);
	let editAnchorName = $state('');
	let editAnchorDescription = $state('');
	let placingAnchorId = $state<string | null>(null);

	// Reset local state when sheet opens
	$effect(() => {
		if (open) {
			newAnchorName = '';
			newAnchorDescription = '';
			editingAnchorId = null;
			placingAnchorId = null;
		}
	});

	function handleAddAnchor() {
		const trimmed = newAnchorName.trim();
		if (!trimmed) return;
		onCreateAnchor(trimmed, newAnchorDescription.trim() || undefined);
		newAnchorName = '';
		newAnchorDescription = '';
	}

	function startEditing(anchor: Anchor) {
		editingAnchorId = anchor.id;
		editAnchorName = anchor.name;
		editAnchorDescription = anchor.description || '';
	}

	function cancelEditing() {
		editingAnchorId = null;
		editAnchorName = '';
		editAnchorDescription = '';
	}

	function saveEditing() {
		if (!editingAnchorId) return;
		const trimmed = editAnchorName.trim();
		if (!trimmed) return;
		onEditAnchor(editingAnchorId, trimmed, editAnchorDescription.trim() || undefined);
		cancelEditing();
	}

	function handleDeleteAnchor(anchorId: string) {
		onDeleteAnchor(anchorId);
		if (editingAnchorId === anchorId) {
			cancelEditing();
		}
	}

	function startPlacing(anchorId: string) {
		placingAnchorId = anchorId;
	}

	function cancelPlacing() {
		placingAnchorId = null;
	}

	function selectPeriodForPlacement(periodId: string) {
		if (!placingAnchorId) return;
		onSetCurrentAnchor(placingAnchorId, periodId);
		placingAnchorId = null;
	}

	function handleClearActive() {
		onClearCurrentAnchor();
	}

	function getPlacementsForAnchor(anchorId: string): AnchorPlacement[] {
		return anchorPlacements.filter(p => p.anchorId === anchorId);
	}

	function getPeriodName(periodId: string): string {
		const period = periods.find(p => p.id === periodId);
		return period?.name || 'Unknown Period';
	}

	function handleClose() {
		onOpenChange(false);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (editingAnchorId) {
				cancelEditing();
			} else if (placingAnchorId) {
				cancelPlacing();
			} else {
				handleClose();
			}
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
		<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="anchors-title">
			<div class="sheet-header">
				<h2 id="anchors-title" class="sheet-title">Anchors</h2>
				<p class="sheet-description">
					Characters to focus gameplay around. Place anchors on periods to guide the story.
				</p>
				<p class="sheet-caption">
					This is a new mechanic from the Microscope Chronicle playtest.
				</p>
				<Button
					variant="ghost"
					size="icon"
					class="close-btn"
					onclick={handleClose}
					aria-label="Close anchors"
					title="Close"
				>
					<X class="h-4 w-4" />
				</Button>
			</div>

			<div class="sheet-content">
				<!-- Period Selection Mode -->
				{#if placingAnchorId}
					{@const placingAnchor = anchors.find(a => a.id === placingAnchorId)}
					<div class="placement-mode">
						<div class="placement-header">
							<h3 class="placement-title">Place "{placingAnchor?.name}" on a Period</h3>
							<Button
								variant="ghost"
								size="sm"
								onclick={cancelPlacing}
							>
								Cancel
							</Button>
						</div>
						{#if periods.length > 0}
							<ul class="period-list">
								{#each periods as period (period.id)}
									<li>
										<button
											type="button"
											class="period-option"
											onclick={() => selectPeriodForPlacement(period.id)}
										>
											<MapPin class="h-4 w-4" />
											<span>{period.name}</span>
										</button>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="no-periods">Create a period first to place anchors.</p>
						{/if}
					</div>
				{:else}
					<!-- Add New Anchor Section -->
					<div class="add-anchor-section">
						<div class="add-anchor-inputs">
							<Input
								bind:value={newAnchorName}
								placeholder="Character name..."
								onkeydown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleAddAnchor();
									}
								}}
							/>
							<Textarea
								bind:value={newAnchorDescription}
								placeholder="Description (optional)"
								rows={2}
							/>
						</div>
						<Button
							variant="secondary"
							size="sm"
							onclick={handleAddAnchor}
							disabled={!newAnchorName.trim()}
							title="Add anchor"
							class="add-btn"
						>
							<Plus class="h-4 w-4" />
							<span>Add Anchor</span>
						</Button>
					</div>

					<!-- Current Anchor Indicator -->
					{#if currentAnchorId}
						{@const currentAnchor = anchors.find(a => a.id === currentAnchorId)}
						{#if currentAnchor}
							<div class="current-anchor-banner">
								<div class="banner-content">
									<span class="banner-label">Active Anchor:</span>
									<span class="banner-name">{currentAnchor.name}</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onclick={handleClearActive}
									title="Clear active anchor"
								>
									Clear
								</Button>
							</div>
						{/if}
					{/if}

					<!-- Anchors List -->
					{#if anchors.length > 0}
						<ul class="anchors-list">
							{#each anchors as anchor (anchor.id)}
								<li class="anchor-item" class:active={anchor.id === currentAnchorId}>
									{#if editingAnchorId === anchor.id}
										<!-- Edit Mode -->
										<div class="edit-form">
											<Input
												bind:value={editAnchorName}
												placeholder="Character name..."
												onkeydown={(e) => {
													if (e.key === 'Enter' && !e.shiftKey) {
														e.preventDefault();
														saveEditing();
													}
													if (e.key === 'Escape') {
														cancelEditing();
													}
												}}
											/>
											<Textarea
												bind:value={editAnchorDescription}
												placeholder="Description (optional)"
												rows={2}
											/>
											<div class="edit-actions">
												<Button
													variant="ghost"
													size="sm"
													onclick={cancelEditing}
												>
													Cancel
												</Button>
												<Button
													variant="secondary"
													size="sm"
													onclick={saveEditing}
													disabled={!editAnchorName.trim()}
												>
													Save
												</Button>
											</div>
										</div>
									{:else}
										<!-- View Mode -->
										<button
											type="button"
											class="anchor-content"
											onclick={() => startEditing(anchor)}
											title="Click to edit"
										>
											<div class="anchor-header">
												<Anchor2 class="h-4 w-4 anchor-icon" />
												<span class="anchor-name">{anchor.name}</span>
												{#if anchor.id === currentAnchorId}
													<span class="active-badge">Active</span>
												{/if}
											</div>
											{#if anchor.description}
												<p class="anchor-description">{anchor.description}</p>
											{/if}
											<!-- Show placements -->
											{#if getPlacementsForAnchor(anchor.id).length > 0}
												<div class="placements-list">
													{#each getPlacementsForAnchor(anchor.id) as placement (placement.id)}
														<span class="placement-tag">
															<MapPin class="h-3 w-3" />
															{getPeriodName(placement.periodId)}
														</span>
													{/each}
												</div>
											{/if}
										</button>
										<div class="anchor-actions">
											<Button
												variant="ghost"
												size="icon"
												onclick={() => startPlacing(anchor.id)}
												aria-label={`Place ${anchor.name} on a period`}
												title="Place on period"
												disabled={periods.length === 0}
											>
												<MapPin class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												class="delete-btn"
												onclick={() => handleDeleteAnchor(anchor.id)}
												aria-label={`Delete ${anchor.name}`}
												title="Delete"
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<div class="empty-state">
							<Anchor2 class="h-12 w-12" />
							<p>No anchors yet</p>
							<span class="empty-hint">Add characters to focus your Chronicle game</span>
						</div>
					{/if}
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

	.sheet-caption {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		margin: 0.5rem 0 0 0;
		font-style: italic;
		opacity: 0.8;
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

	/* Add anchor section */
	.add-anchor-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.add-anchor-inputs {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.add-anchor-section :global(.add-btn) {
		align-self: flex-end;
	}

	/* Current anchor banner */
	.current-anchor-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background-color: oklch(65% 0.18 50 / 0.15);
		border: 1px solid oklch(65% 0.18 50 / 0.3);
		border-radius: var(--radius);
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.banner-label {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
	}

	.banner-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: oklch(70% 0.18 50);
	}

	/* Anchors list */
	.anchors-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.anchor-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.75rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		border: 1px solid transparent;
		transition: border-color 0.15s;
	}

	.anchor-item:hover {
		border-color: var(--color-border);
	}

	.anchor-item.active {
		background-color: oklch(65% 0.18 50 / 0.1);
		border-color: oklch(65% 0.18 50 / 0.3);
	}

	.anchor-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: inherit;
	}

	.anchor-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.anchor-header :global(.anchor-icon) {
		color: oklch(65% 0.18 50);
		flex-shrink: 0;
	}

	.anchor-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.active-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		background-color: oklch(65% 0.18 50);
		color: white;
		border-radius: 9999px;
	}

	.anchor-description {
		font-size: 0.8125rem;
		color: var(--color-muted-foreground);
		margin: 0;
		line-height: 1.4;
	}

	.placements-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	.placement-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875rem;
		padding: 0.125rem 0.375rem;
		background-color: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-muted-foreground);
	}

	.anchor-actions {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.anchor-actions :global(.delete-btn:hover) {
		color: var(--color-destructive);
	}

	/* Edit form */
	.edit-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	/* Placement mode */
	.placement-mode {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.placement-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.placement-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin: 0;
	}

	.period-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.period-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
		background-color: var(--color-muted);
		border: 1px solid transparent;
		border-radius: var(--radius);
		cursor: pointer;
		text-align: left;
		color: var(--color-foreground);
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.period-option:hover {
		border-color: var(--color-primary);
		background-color: oklch(from var(--color-primary) l c h / 0.1);
	}

	.no-periods {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		text-align: center;
		padding: 2rem;
	}

	/* Empty state */
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
		color: oklch(65% 0.18 50);
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
