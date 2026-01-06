<script lang="ts">
	import type { Scene } from '$lib/types';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import MessageCircle from 'lucide-svelte/icons/message-circle';

	interface Props {
		scene: Scene;
		onclick?: () => void;
	}

	let { scene, onclick }: Props = $props();
</script>

<div
	role="button"
	tabindex="0"
	class="scene-card"
	class:light={scene.tone === 'light'}
	class:dark={scene.tone === 'dark'}
	data-card="scene"
	{onclick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick?.();
		}
	}}
>
	<div class="tone-indicator">
		{#if scene.tone === 'light'}
			<Sun class="tone-icon" />
		{:else}
			<Moon class="tone-icon" />
		{/if}
	</div>
	<h5 class="card-title">{scene.name}</h5>
	{#if scene.description}
		<p class="card-description">{scene.description}</p>
	{/if}
	{#if scene.question}
		<p class="card-question">
			<HelpCircle class="field-icon" />
			<span>{scene.question}</span>
		</p>
	{/if}
	{#if scene.answer}
		<p class="card-answer">
			<MessageCircle class="field-icon" />
			<span>{scene.answer}</span>
		</p>
	{/if}
</div>

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
		/* Prevent card from blocking pointer events to parent wrapper for drag-and-drop */
		pointer-events: auto;
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

	.card-description {
		font-size: calc(0.6875rem * max(var(--canvas-zoom, 1), 1));
		color: var(--color-muted-foreground);
		margin: 0 0 calc(0.25rem * max(var(--canvas-zoom, 1), 1)) 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-question,
	.card-answer {
		font-size: calc(0.625rem * max(var(--canvas-zoom, 1), 1));
		color: var(--color-muted-foreground);
		margin: calc(0.125rem * max(var(--canvas-zoom, 1), 1)) 0 0 0;
		line-height: 1.3;
		display: flex;
		align-items: flex-start;
		gap: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
	}

	.card-question {
		font-style: italic;
	}

	.card-question span,
	.card-answer span {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-question :global(.field-icon),
	.card-answer :global(.field-icon) {
		flex-shrink: 0;
		width: calc(0.625rem * max(var(--canvas-zoom, 1), 1));
		height: calc(0.625rem * max(var(--canvas-zoom, 1), 1));
		margin-top: calc(0.0625rem * max(var(--canvas-zoom, 1), 1));
	}

	.card-question :global(.field-icon) {
		color: oklch(65% 0.12 260);
	}

	.card-answer :global(.field-icon) {
		color: oklch(65% 0.12 145);
	}
</style>
