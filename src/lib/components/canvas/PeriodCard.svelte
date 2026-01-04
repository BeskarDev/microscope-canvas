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
		width: 160px;
		min-height: 200px;
		padding: 1rem;
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
		border-left: 4px solid oklch(95% 0.05 90);
	}

	.period-card.dark {
		border-left: 4px solid oklch(25% 0.05 265);
	}

	.tone-indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.5rem;
	}

	.tone-indicator :global(.tone-icon) {
		width: 1rem;
		height: 1rem;
	}

	.period-card.light .tone-indicator :global(.tone-icon) {
		color: oklch(85% 0.15 90);
	}

	.period-card.dark .tone-indicator :global(.tone-icon) {
		color: oklch(60% 0.1 265);
	}

	.card-title {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-description {
		font-size: 0.8125rem;
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
