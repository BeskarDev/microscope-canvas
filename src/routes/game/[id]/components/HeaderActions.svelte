<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import Redo2 from 'lucide-svelte/icons/redo-2';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import History from 'lucide-svelte/icons/history';
	import Settings from 'lucide-svelte/icons/settings';
	import Menu from 'lucide-svelte/icons/menu';
	import FileJson from 'lucide-svelte/icons/file-json';
	import FileText from 'lucide-svelte/icons/file-text';
	import User from 'lucide-svelte/icons/user';
	import Target from 'lucide-svelte/icons/target';
	import Palette from 'lucide-svelte/icons/palette';
	import BookMarked from 'lucide-svelte/icons/book-marked';
	import AnchorIcon from 'lucide-svelte/icons/anchor';
	import { ExportMenu } from '$lib/components/canvas';
	import type { Game } from '$lib/types';

	interface Props {
		game: Game | null;
		canUndo: boolean;
		canRedo: boolean;
		isViewingHistory: boolean;
		currentSnapshotId: string | null;
		paletteCount: number;
		playersCount: number;
		focusesCount: number;
		legaciesCount: number;
		anchorsCount: number;
		onUndo: () => void;
		onRedo: () => void;
		onRestoreSnapshot: () => void;
		onOpenPalette: () => void;
		onOpenPlayers: () => void;
		onOpenFocuses: () => void;
		onOpenLegacies: () => void;
		onOpenAnchors: () => void;
		onOpenPublish: () => void;
		onOpenHistory: () => void;
		onOpenSettings: () => void;
		onExportJSON: () => void;
		onExportMarkdown: () => void;
	}

	let {
		game,
		canUndo,
		canRedo,
		isViewingHistory,
		currentSnapshotId,
		paletteCount,
		playersCount,
		focusesCount,
		legaciesCount,
		anchorsCount,
		onUndo,
		onRedo,
		onRestoreSnapshot,
		onOpenPalette,
		onOpenPlayers,
		onOpenFocuses,
		onOpenLegacies,
		onOpenAnchors,
		onOpenPublish,
		onOpenHistory,
		onOpenSettings,
		onExportJSON,
		onExportMarkdown
	}: Props = $props();

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function handleMobileAction(action: () => void) {
		closeMobileMenu();
		action();
	}
</script>

<div class="header-actions">
	{#if isViewingHistory && currentSnapshotId}
		<Button variant="default" size="sm" onclick={onRestoreSnapshot}>
			Restore This Version
		</Button>
	{:else if game}
		<!-- Undo/Redo buttons (always visible) -->
		<div class="undo-redo-controls">
			<Button
				variant="ghost"
				size="sm"
				onclick={onUndo}
				disabled={!canUndo}
				aria-label="Undo"
				title="Undo (Ctrl+Z)"
			>
				<Undo2 class="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onRedo}
				disabled={!canRedo}
				aria-label="Redo"
				title="Redo (Ctrl+Shift+Z)"
			>
				<Redo2 class="h-4 w-4" />
			</Button>
		</div>

		<!-- Desktop controls (hidden on mobile) -->
		<div class="desktop-controls">
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenPalette}
				aria-label="Palette"
				title="Palette - Yes/No list"
				class="icon-button-with-badge"
			>
				<Palette class="h-4 w-4" />
				{#if paletteCount > 0}
					<span class="count-badge">{paletteCount}</span>
				{/if}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenPlayers}
				aria-label="Players"
				title="Players - Turn order"
				class="icon-button-with-badge"
			>
				<User class="h-4 w-4" />
				{#if playersCount > 0}
					<span class="count-badge">{playersCount}</span>
				{/if}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenFocuses}
				aria-label="Focuses"
				title="Focuses - Themes to explore"
				class="icon-button-with-badge"
			>
				<Target class="h-4 w-4" />
				{#if focusesCount > 0}
					<span class="count-badge">{focusesCount}</span>
				{/if}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenLegacies}
				aria-label="Legacies"
				title="Legacies - Recurring elements"
				class="icon-button-with-badge"
			>
				<BookMarked class="h-4 w-4" />
				{#if legaciesCount > 0}
					<span class="count-badge">{legaciesCount}</span>
				{/if}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenAnchors}
				aria-label="Anchors"
				title="Anchors - Chronicle characters"
				class="icon-button-with-badge"
			>
				<AnchorIcon class="h-4 w-4" />
				{#if anchorsCount > 0}
					<span class="count-badge">{anchorsCount}</span>
				{/if}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenPublish}
				aria-label="Publish version"
				title="Publish version"
			>
				<Bookmark class="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenHistory}
				aria-label="Version history"
				title="Version history"
			>
				<History class="h-4 w-4" />
			</Button>
			<ExportMenu {game} />
			<Button
				variant="ghost"
				size="sm"
				onclick={onOpenSettings}
				aria-label="History settings"
				title="History settings"
			>
				<Settings class="h-4 w-4" />
			</Button>
		</div>

		<!-- Mobile menu button (hidden on desktop) -->
		<div class="mobile-menu-container">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Menu"
				aria-haspopup="menu"
				aria-expanded={mobileMenuOpen}
			>
				<Menu class="h-4 w-4" />
			</Button>

			{#if mobileMenuOpen}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="mobile-menu-backdrop"
					onclick={closeMobileMenu}
					onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}
				></div>
				<div class="mobile-dropdown" role="menu">
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenPalette)}
						role="menuitem"
					>
						<Palette class="h-4 w-4" />
						<span>Palette</span>
						{#if paletteCount > 0}
							<span class="count-badge">{paletteCount}</span>
						{/if}
					</button>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenPlayers)}
						role="menuitem"
					>
						<User class="h-4 w-4" />
						<span>Players</span>
						{#if playersCount > 0}
							<span class="count-badge">{playersCount}</span>
						{/if}
					</button>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenFocuses)}
						role="menuitem"
					>
						<Target class="h-4 w-4" />
						<span>Focuses</span>
						{#if focusesCount > 0}
							<span class="count-badge">{focusesCount}</span>
						{/if}
					</button>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenLegacies)}
						role="menuitem"
					>
						<BookMarked class="h-4 w-4" />
						<span>Legacies</span>
						{#if legaciesCount > 0}
							<span class="count-badge">{legaciesCount}</span>
						{/if}
					</button>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenAnchors)}
						role="menuitem"
					>
						<AnchorIcon class="h-4 w-4" />
						<span>Anchors</span>
						{#if anchorsCount > 0}
							<span class="count-badge">{anchorsCount}</span>
						{/if}
					</button>
					<div class="mobile-menu-divider"></div>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenPublish)}
						role="menuitem"
					>
						<Bookmark class="h-4 w-4" />
						<span>Publish Version</span>
					</button>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenHistory)}
						role="menuitem"
					>
						<History class="h-4 w-4" />
						<span>Version History</span>
					</button>
					<div class="mobile-menu-divider"></div>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onExportJSON)}
						role="menuitem"
					>
						<FileJson class="h-4 w-4" />
						<span>Export as JSON</span>
					</button>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onExportMarkdown)}
						role="menuitem"
					>
						<FileText class="h-4 w-4" />
						<span>Export as Markdown</span>
					</button>
					<div class="mobile-menu-divider"></div>
					<button
						type="button"
						class="mobile-menu-item"
						onclick={() => handleMobileAction(onOpenSettings)}
						role="menuitem"
					>
						<Settings class="h-4 w-4" />
						<span>History Settings</span>
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.undo-redo-controls {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding-right: 0.5rem;
		border-right: 1px solid var(--color-border);
		margin-right: 0.25rem;
	}

	.desktop-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-menu-container {
		display: none;
		position: relative;
	}

	.mobile-menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
	}

	.mobile-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.25rem;
		min-width: 200px;
		background-color: var(--color-popover);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: 0 4px 12px oklch(0% 0 0 / 0.3);
		z-index: 50;
		overflow: hidden;
	}

	.mobile-menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		text-align: left;
		color: var(--color-popover-foreground);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.mobile-menu-item:hover {
		background-color: var(--color-accent);
	}

	.mobile-menu-item :global(svg) {
		flex-shrink: 0;
		color: var(--color-muted-foreground);
	}

	.mobile-menu-divider {
		height: 1px;
		background-color: var(--color-border);
		margin: 0.25rem 0;
	}

	/* Count badges for icon buttons */
	:global(.icon-button-with-badge) {
		position: relative;
	}

	.count-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-muted);
		color: var(--color-muted-foreground);
		border-radius: 8px;
		font-size: 0.625rem;
		font-weight: 600;
		line-height: 1;
		pointer-events: none;
		border: 1px solid var(--color-border);
	}

	.mobile-menu-item .count-badge {
		position: static;
		margin-left: auto;
	}

	@media (max-width: 640px) {
		.desktop-controls {
			display: none;
		}

		.mobile-menu-container {
			display: block;
		}
	}
</style>
