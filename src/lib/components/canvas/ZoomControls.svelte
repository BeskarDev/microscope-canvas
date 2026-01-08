<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import Minus from 'lucide-svelte/icons/minus';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import Home from 'lucide-svelte/icons/home';
	import Move from 'lucide-svelte/icons/move';

	interface Props {
		zoom: number;
		minZoom?: number;
		maxZoom?: number;
		onZoomIn?: () => void;
		onZoomOut?: () => void;
		onReset?: () => void;
		onResetPosition?: () => void;
		cardReorderEnabled?: boolean;
		onToggleCardReorder?: () => void;
	}

	let {
		zoom,
		minZoom = 0.25,
		maxZoom = 1,
		onZoomIn,
		onZoomOut,
		onReset,
		onResetPosition,
		cardReorderEnabled = false,
		onToggleCardReorder
	}: Props = $props();

	const canZoomIn = $derived(zoom < maxZoom);
	const canZoomOut = $derived(zoom > minZoom);
	const zoomPercent = $derived(Math.round(zoom * 100));
</script>

<div class="zoom-controls">
	<button
		type="button"
		class="zoom-button"
		onclick={onZoomIn}
		disabled={!canZoomIn}
		aria-label="Zoom in"
		title="Zoom in"
	>
		<Plus class="zoom-icon" />
	</button>
	<span class="zoom-level">{zoomPercent}%</span>
	<button
		type="button"
		class="zoom-button"
		onclick={onZoomOut}
		disabled={!canZoomOut}
		aria-label="Zoom out"
		title="Zoom out"
	>
		<Minus class="zoom-icon" />
	</button>
	<button
		type="button"
		class="zoom-button reset"
		onclick={onReset}
		disabled={zoom === 1}
		aria-label="Reset zoom"
		title="Reset zoom"
	>
		<RotateCcw class="zoom-icon" />
	</button>
	{#if onResetPosition}
		<button
			type="button"
			class="zoom-button home"
			onclick={onResetPosition}
			aria-label="Return to start"
			title="Return to start"
		>
			<Home class="zoom-icon" />
		</button>
	{/if}
	{#if onToggleCardReorder}
		<button
			type="button"
			class="zoom-button reorder"
			class:active={cardReorderEnabled}
			onclick={onToggleCardReorder}
			aria-label={cardReorderEnabled ? 'Disable card reordering' : 'Enable card reordering'}
			title={cardReorderEnabled ? 'Disable card reordering' : 'Enable card reordering'}
			aria-pressed={cardReorderEnabled}
		>
			<Move class="zoom-icon" />
		</button>
	{/if}
</div>

<style>
	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		background-color: oklch(from var(--color-card) l c h / 0.9);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 0.25rem;
		backdrop-filter: blur(8px);
	}

	.zoom-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background-color: transparent;
		border: none;
		border-radius: calc(var(--radius) - 2px);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
		color: var(--color-foreground);
	}

	.zoom-button:hover:not(:disabled) {
		background-color: var(--color-muted);
	}

	.zoom-button:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.zoom-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.zoom-button :global(.zoom-icon) {
		width: 1.25rem;
		height: 1.25rem;
	}

	.zoom-button.reset :global(.zoom-icon) {
		width: 1rem;
		height: 1rem;
	}

	.zoom-button.home :global(.zoom-icon) {
		width: 1rem;
		height: 1rem;
	}

	.zoom-button.reorder :global(.zoom-icon) {
		width: 1rem;
		height: 1rem;
	}

	.zoom-button.reorder.active {
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.zoom-button.reorder.active:hover {
		background-color: var(--color-primary);
		opacity: 0.9;
	}

	.zoom-level {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-muted-foreground);
		min-width: 3rem;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
</style>
