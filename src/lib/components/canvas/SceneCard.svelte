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
		width: 140px;
		min-height: 60px;
		padding: 0.5rem;
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
		border-left: 2px solid oklch(95% 0.05 90);
	}

	.scene-card.dark {
		border-left: 2px solid oklch(25% 0.05 265);
	}

	.tone-indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
	}

	.tone-indicator :global(.tone-icon) {
		width: 0.75rem;
		height: 0.75rem;
	}

	.scene-card.light .tone-indicator :global(.tone-icon) {
		color: oklch(85% 0.15 90);
	}

	.scene-card.dark .tone-indicator :global(.tone-icon) {
		color: oklch(60% 0.1 265);
	}

	.card-title {
		font-size: 0.75rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-question {
		font-size: 0.6875rem;
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
