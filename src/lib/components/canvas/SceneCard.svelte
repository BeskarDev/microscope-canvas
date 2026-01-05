<script lang="ts">
	import type { Scene } from '$lib/types';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	interface Props {
		scene: Scene;
		onclick?: () => void;
	}

	let { scene, onclick }: Props = $props();
</script>

<button
	type="button"
	class="scene-card"
	class:light={scene.tone === 'light'}
	class:dark={scene.tone === 'dark'}
	{onclick}
>
	<div class="tone-indicator">
		{#if scene.tone === 'light'}
			<Sun class="tone-icon" />
		{:else}
			<Moon class="tone-icon" />
		{/if}
	</div>
	<h5 class="card-title">{scene.name}</h5>
	{#if scene.question}
		<p class="card-question">{scene.question}</p>
	{/if}
</button>

<style>
	.scene-card {
		display: flex;
		flex-direction: column;
		/* Use CSS custom property for zoom-aware sizing */
		width: calc(140px * max(var(--canvas-zoom, 1), 1));
		min-height: calc(60px * max(var(--canvas-zoom, 1), 1));
		padding: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		font-size: calc(1rem * max(var(--canvas-zoom, 1), 1));
		background-color: oklch(from var(--color-card) calc(l + 0.02) c h);
		border: 1px solid var(--color-border);
		border-radius: calc(var(--radius) * 0.75);
		box-shadow: 0 1px 2px oklch(0% 0 0 / 0.1);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
		text-align: left;
		color: var(--color-card-foreground);
	}

	.scene-card:hover {
		transform: translateY(-1px);
		box-shadow:
			0 4px 6px -1px oklch(0% 0 0 / 0.15),
			0 2px 4px -2px oklch(0% 0 0 / 0.1);
		border-color: var(--color-primary);
	}

	.scene-card:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.scene-card.light {
		border-left: calc(2px * max(var(--canvas-zoom, 1), 1)) solid oklch(95% 0.05 90);
	}

	.scene-card.dark {
		border-left: calc(2px * max(var(--canvas-zoom, 1), 1)) solid oklch(25% 0.05 265);
	}

	.tone-indicator {
		display: flex;
		align-items: center;
		gap: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
		margin-bottom: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
	}

	.tone-indicator :global(.tone-icon) {
		width: calc(0.75rem * max(var(--canvas-zoom, 1), 1));
		height: calc(0.75rem * max(var(--canvas-zoom, 1), 1));
	}

	.scene-card.light .tone-indicator :global(.tone-icon) {
		color: oklch(85% 0.15 90);
	}

	.scene-card.dark .tone-indicator :global(.tone-icon) {
		color: oklch(60% 0.1 265);
	}

	.card-title {
		font-size: calc(0.75rem * max(var(--canvas-zoom, 1), 1));
		font-weight: 600;
		margin: 0 0 calc(0.25rem * max(var(--canvas-zoom, 1), 1)) 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-question {
		font-size: calc(0.6875rem * max(var(--canvas-zoom, 1), 1));
		color: var(--color-muted-foreground);
		margin: 0;
		line-height: 1.3;
		font-style: italic;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
