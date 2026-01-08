<script lang="ts">
	import type { Anchor } from '$lib/types';
	import Anchor2 from 'lucide-svelte/icons/anchor';

	interface Props {
		anchor: Anchor;
		isActive?: boolean;
		isHovered?: boolean;
		zIndex?: number;
		offset?: number; // Horizontal offset for stacking (in px, before zoom)
		onclick?: () => void;
		onmouseenter?: () => void;
		onmouseleave?: () => void;
	}

	let {
		anchor,
		isActive = false,
		isHovered = false,
		zIndex = 1,
		offset = 0,
		onclick,
		onmouseenter,
		onmouseleave
	}: Props = $props();
</script>

<div
	role="button"
	tabindex="0"
	class="anchor-card"
	class:active={isActive}
	class:hovered={isHovered}
	data-card="anchor"
	style:--card-offset="{offset}px"
	style:z-index={zIndex}
	{onclick}
	{onmouseenter}
	{onmouseleave}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick?.();
		}
	}}
>
	<div class="anchor-icon-container">
		<Anchor2 class="anchor-icon" />
	</div>
	<div class="anchor-content">
		<h3 class="card-title">{anchor.name}</h3>
		{#if anchor.description}
			<p class="card-description">{anchor.description}</p>
		{/if}
	</div>
	{#if isActive}
		<div class="active-indicator">
			<span class="active-dot"></span>
		</div>
	{/if}
</div>

<style>
	.anchor-card {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		/* Landscape-oriented card: wider than tall */
		width: calc(180px * max(var(--canvas-zoom, 1), 1));
		height: calc(60px * max(var(--canvas-zoom, 1), 1));
		padding: calc(0.5rem * max(var(--canvas-zoom, 1), 1)) calc(0.75rem * max(var(--canvas-zoom, 1), 1));
		font-size: calc(1rem * max(var(--canvas-zoom, 1), 1));
		background-color: var(--color-card);
		/* Distinct warm/golden border for anchor cards */
		border: 1px solid oklch(65% 0.18 50 / 0.4);
		border-left: calc(3px * max(var(--canvas-zoom, 1), 1)) solid oklch(65% 0.18 50);
		border-radius: var(--radius);
		box-shadow:
			0 2px 4px -1px oklch(0% 0 0 / 0.15),
			0 1px 2px -1px oklch(0% 0 0 / 0.1);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease,
			z-index 0s;
		text-align: left;
		color: var(--color-card-foreground);
		pointer-events: auto;
		position: relative;
		/* Apply horizontal offset for stacking */
		transform: translateX(calc(var(--card-offset, 0px) * max(var(--canvas-zoom, 1), 1)));
	}

	.anchor-card:hover,
	.anchor-card.hovered {
		transform: translateX(calc(var(--card-offset, 0px) * max(var(--canvas-zoom, 1), 1))) translateY(-2px);
		box-shadow:
			0 8px 12px -3px oklch(0% 0 0 / 0.2),
			0 3px 5px -2px oklch(0% 0 0 / 0.15);
		border-color: oklch(65% 0.18 50);
		/* Hover brings to top temporarily */
	}

	.anchor-card:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.anchor-card.active {
		background-color: oklch(65% 0.18 50 / 0.1);
		border-color: oklch(65% 0.18 50);
		box-shadow:
			0 4px 8px -2px oklch(65% 0.18 50 / 0.3),
			0 2px 4px -2px oklch(0% 0 0 / 0.15);
	}

	.anchor-icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: calc(2rem * max(var(--canvas-zoom, 1), 1));
		height: calc(2rem * max(var(--canvas-zoom, 1), 1));
		background-color: oklch(65% 0.18 50 / 0.15);
		border-radius: calc(0.375rem * max(var(--canvas-zoom, 1), 1));
	}

	.anchor-icon-container :global(.anchor-icon) {
		width: calc(1.125rem * max(var(--canvas-zoom, 1), 1));
		height: calc(1.125rem * max(var(--canvas-zoom, 1), 1));
		color: oklch(65% 0.18 50);
	}

	.anchor-card.active .anchor-icon-container {
		background-color: oklch(65% 0.18 50 / 0.25);
	}

	.anchor-content {
		flex: 1;
		min-width: 0; /* Allow text truncation */
		display: flex;
		flex-direction: column;
		gap: calc(0.125rem * max(var(--canvas-zoom, 1), 1));
	}

	.card-title {
		font-size: calc(0.8125rem * max(var(--canvas-zoom, 1), 1));
		font-weight: 600;
		margin: 0;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-description {
		font-size: calc(0.6875rem * max(var(--canvas-zoom, 1), 1));
		color: var(--color-muted-foreground);
		margin: 0;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.active-indicator {
		position: absolute;
		top: calc(0.375rem * max(var(--canvas-zoom, 1), 1));
		right: calc(0.375rem * max(var(--canvas-zoom, 1), 1));
	}

	.active-dot {
		display: block;
		width: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		height: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		background-color: oklch(65% 0.18 50);
		border-radius: 50%;
		box-shadow: 0 0 0 calc(0.125rem * max(var(--canvas-zoom, 1), 1)) oklch(65% 0.18 50 / 0.3);
	}
</style>
