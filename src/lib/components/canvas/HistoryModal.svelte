<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import History from 'lucide-svelte/icons/history';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import Eye from 'lucide-svelte/icons/eye';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import type { SnapshotMetadata } from '$lib/types';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		snapshots: SnapshotMetadata[];
		isLoading: boolean;
		error: string | null;
		onView: (snapshotId: string) => void;
		onRestore: (snapshotId: string) => void;
	}

	let { open, onOpenChange, snapshots, isLoading, error, onView, onRestore }: Props = $props();

	function formatDate(isoString: string): string {
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		// Relative time for recent snapshots
		if (diffMins < 1) {
			return 'Just now';
		} else if (diffMins < 60) {
			return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
		} else if (diffDays < 7) {
			return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
		}

		// Absolute date for older snapshots
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent class="history-modal">
		<DialogHeader>
			<DialogTitle class="history-title">
				<History class="h-5 w-5" />
				Version History
			</DialogTitle>
		</DialogHeader>

		<div class="history-content">
			{#if isLoading}
				<div class="loading-state">
					<Loader2 class="h-8 w-8 animate-spin" />
					<p>Loading history...</p>
				</div>
			{:else if error}
				<div class="error-state">
					<AlertTriangle class="h-8 w-8" />
					<p>{error}</p>
				</div>
			{:else if snapshots.length === 0}
				<div class="empty-state">
					<Bookmark class="h-12 w-12" />
					<p>No published versions yet</p>
					<span class="empty-hint"
						>Click "Publish Version" to save a checkpoint of your current world state.</span
					>
				</div>
			{:else}
				<ul class="snapshot-list">
					{#each snapshots as snapshot, index (snapshot.id)}
						<li class="snapshot-item animate-slide-in-up" style="animation-delay: {index * 30}ms">
							<div class="snapshot-info">
								<div class="snapshot-header">
									{#if snapshot.versionName}
										<span class="snapshot-version-name">{snapshot.versionName}</span>
									{:else}
										<span class="snapshot-date-primary">{formatDate(snapshot.timestamp)}</span>
									{/if}
								</div>
								{#if snapshot.versionName}
									<span class="snapshot-date">{formatDate(snapshot.timestamp)}</span>
								{/if}
								{#if snapshot.changeSummary}
									<span class="snapshot-changes">{snapshot.changeSummary}</span>
								{/if}
							</div>
							<div class="snapshot-actions">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onView(snapshot.id)}
									aria-label="View this version"
									title="View this version"
								>
									<Eye class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => onRestore(snapshot.id)}
									aria-label="Restore this version"
									title="Restore this version"
								>
									<RotateCcw class="h-4 w-4" />
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</DialogContent>
</Dialog>

<style>
	:global(.history-modal) {
		max-width: 600px;
		max-height: calc(100vh - 2rem);
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.history-modal) .history-content {
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	@media (max-width: 640px) {
		:global(.history-modal) {
			max-width: calc(100vw - 2rem);
		}
	}

	:global(.history-title) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.history-content {
		display: flex;
		flex-direction: column;
		min-height: 200px;
		max-height: 400px;
		overflow-y: auto;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		gap: 0.5rem;
		flex: 1;
	}

	.loading-state :global(svg) {
		color: var(--color-primary);
	}

	.error-state :global(svg) {
		color: var(--color-destructive);
	}

	.empty-state :global(svg) {
		color: var(--color-muted-foreground);
		opacity: 0.5;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.snapshot-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.snapshot-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border-bottom: 1px solid var(--color-border);
		opacity: 0;
	}

	.snapshot-item:last-child {
		border-bottom: none;
	}

	.snapshot-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.snapshot-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.snapshot-version-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-foreground);
	}

	.snapshot-date-primary {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
	}

	.snapshot-date {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
	}

	.snapshot-changes {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 280px;
	}

	.snapshot-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
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
