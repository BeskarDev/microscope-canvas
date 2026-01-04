<script lang="ts">
	import type { Event } from '$lib/types';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	interface Props {
		event: Event;
		onclick?: () => void;
	}

	let { event, onclick }: Props = $props();
</script>

<button
	type="button"
	class="event-card"
	class:light={event.tone === 'light'}
	class:dark={event.tone === 'dark'}
	{onclick}
>
	<div class="tone-indicator">
		{#if event.tone === 'light'}
			<Sun class="tone-icon" />
		{:else}
			<Moon class="tone-icon" />
		{/if}
	</div>
	<h4 class="card-title">{event.name}</h4>
	{#if event.description}
		<p class="card-description">{event.description}</p>
	{/if}
</button>

<style>
	.event-card {
		display: flex;
		flex-direction: column;
		width: 180px;
		min-height: 80px;
		padding: 0.75rem;
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow:
			0 2px 4px -1px oklch(0% 0 0 / 0.15),
			0 1px 2px -1px oklch(0% 0 0 / 0.1);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
		text-align: left;
		color: var(--color-card-foreground);
	}

	.event-card:hover {
		transform: translateY(-1px);
		box-shadow:
			0 6px 10px -2px oklch(0% 0 0 / 0.2),
			0 2px 4px -2px oklch(0% 0 0 / 0.15);
		border-color: var(--color-primary);
	}

	.event-card:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.event-card.light {
		border-left: 3px solid oklch(95% 0.05 90);
	}

	.event-card.dark {
		border-left: 3px solid oklch(25% 0.05 265);
	}

	.tone-indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.25rem;
	}

	.tone-indicator :global(.tone-icon) {
		width: 0.875rem;
		height: 0.875rem;
	}

	.event-card.light .tone-indicator :global(.tone-icon) {
		color: oklch(85% 0.15 90);
	}

	.event-card.dark .tone-indicator :global(.tone-icon) {
		color: oklch(60% 0.1 265);
	}

	.card-title {
		font-size: 0.8125rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-description {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		margin: 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
