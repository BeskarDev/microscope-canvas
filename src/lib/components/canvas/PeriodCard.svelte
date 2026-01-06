<script lang="ts">
	import type { Period } from '$lib/types';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	interface Props {
		period: Period;
		onclick?: () => void;
	}

	let { period, onclick }: Props = $props();
</script>

<button
	type="button"
	class="period-card"
	class:light={period.tone === 'light'}
	class:dark={period.tone === 'dark'}
	data-card="period"
	{onclick}
>
	<div class="tone-indicator">
		{#if period.tone === 'light'}
			<Sun class="tone-icon" />
		{:else}
			<Moon class="tone-icon" />
		{/if}
	</div>
	<h3 class="card-title">{period.name}</h3>
	{#if period.description}
		<p class="card-description">{period.description}</p>
	{/if}
</button>

<style>
	.period-card {
		display: flex;
		flex-direction: column;
		/* Use CSS custom property for zoom-aware sizing */
		width: calc(160px * max(var(--canvas-zoom, 1), 1));
		min-height: calc(200px * max(var(--canvas-zoom, 1), 1));
		padding: calc(1rem * max(var(--canvas-zoom, 1), 1));
		font-size: calc(1rem * max(var(--canvas-zoom, 1), 1));
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow:
			0 4px 6px -1px oklch(0% 0 0 / 0.2),
			0 2px 4px -2px oklch(0% 0 0 / 0.15);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
		text-align: left;
		color: var(--color-card-foreground);
		/* Allow drag-and-drop to work on the entire card */
		touch-action: none;
		user-select: none;
	}

	.period-card:hover {
		transform: translateY(-2px);
		box-shadow:
			0 10px 15px -3px oklch(0% 0 0 / 0.25),
			0 4px 6px -4px oklch(0% 0 0 / 0.2);
		border-color: var(--color-primary);
	}

	.period-card:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.period-card.light {
		border-left: calc(4px * max(var(--canvas-zoom, 1), 1)) solid oklch(95% 0.05 90);
	}

	.period-card.dark {
		border-left: calc(4px * max(var(--canvas-zoom, 1), 1)) solid oklch(25% 0.05 265);
	}

	.tone-indicator {
		display: flex;
		align-items: center;
		gap: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
		margin-bottom: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
	}

	.tone-indicator :global(.tone-icon) {
		width: calc(1rem * max(var(--canvas-zoom, 1), 1));
		height: calc(1rem * max(var(--canvas-zoom, 1), 1));
	}

	.period-card.light .tone-indicator :global(.tone-icon) {
		color: oklch(85% 0.15 90);
	}

	.period-card.dark .tone-indicator :global(.tone-icon) {
		color: oklch(60% 0.1 265);
	}

	.card-title {
		font-size: calc(0.9375rem * max(var(--canvas-zoom, 1), 1));
		font-weight: 600;
		margin: 0 0 calc(0.5rem * max(var(--canvas-zoom, 1), 1)) 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-description {
		font-size: calc(0.8125rem * max(var(--canvas-zoom, 1), 1));
		color: var(--color-muted-foreground);
		margin: 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex: 1;
	}
</style>
