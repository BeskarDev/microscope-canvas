<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Download from 'lucide-svelte/icons/download';
	import FileJson from 'lucide-svelte/icons/file-json';
	import FileText from 'lucide-svelte/icons/file-text';
	import {
		downloadGameAsJSON,
		downloadGameAsMarkdown,
		loadAllSnapshotsForGame
	} from '$lib/services';
	import { toast } from '$lib/components/ui/sonner';
	import type { Game } from '$lib/types';

	interface Props {
		game: Game;
	}

	let { game }: Props = $props();

	let menuOpen = $state(false);

	async function handleExportJSON() {
		try {
			// Load all snapshots for complete backup
			const history = await loadAllSnapshotsForGame(game.id);
			downloadGameAsJSON(game, history);

			const historyNote =
				history.length > 0
					? ` Includes ${history.length} version${history.length > 1 ? 's' : ''} in history.`
					: '';
			toast.success('Export complete', {
				description: `Your history has been exported as JSON.${historyNote}`
			});
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Export failed', {
				description: 'Could not export the history. Please try again.'
			});
		}
		menuOpen = false;
	}

	function handleExportMarkdown() {
		try {
			downloadGameAsMarkdown(game);
			toast.success('Export complete', {
				description: 'Your history has been exported as Markdown.'
			});
		} catch (error) {
			console.error('Export failed:', error);
			toast.error('Export failed', {
				description: 'Could not export the history. Please try again.'
			});
		}
		menuOpen = false;
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.export-menu-container')) {
			menuOpen = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			menuOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeyDown} />

<div class="export-menu-container">
	<Button
		variant="ghost"
		size="sm"
		onclick={toggleMenu}
		aria-label="Export game"
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		title="Export game"
	>
		<Download class="h-4 w-4" />
	</Button>

	{#if menuOpen}
		<div class="export-dropdown animate-scale-in" role="menu">
			<button type="button" class="dropdown-item" onclick={handleExportJSON} role="menuitem">
				<FileJson class="h-4 w-4" />
				<span>Export as JSON</span>
				<span class="item-hint">For backup</span>
			</button>
			<button type="button" class="dropdown-item" onclick={handleExportMarkdown} role="menuitem">
				<FileText class="h-4 w-4" />
				<span>Export as Markdown</span>
				<span class="item-hint">For reading</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.export-menu-container {
		position: relative;
	}

	.export-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.25rem;
		min-width: 180px;
		background-color: var(--color-popover);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: 0 4px 12px oklch(0% 0 0 / 0.3);
		z-index: 50;
		overflow: hidden;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: none;
		border: none;
		text-align: left;
		color: var(--color-popover-foreground);
		font-size: 0.875rem;
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.dropdown-item:hover {
		background-color: var(--color-accent);
	}

	.dropdown-item:focus {
		outline: none;
		background-color: var(--color-accent);
	}

	.dropdown-item :global(svg) {
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.item-hint {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
	}
</style>
