<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { resolve } from '$app/paths';

	const gameId = $derived($page.params.id);
	const homeUrl = resolve('/');
</script>

<div class="canvas-placeholder">
	<div class="canvas-header">
		<a href={homeUrl}>
			<Button variant="ghost" size="sm">
				<ArrowLeft class="h-4 w-4" />
				Back to Games
			</Button>
		</a>
		<span class="game-id">Game: {gameId}</span>
	</div>

	<div class="canvas-content">
		<div class="placeholder-message">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="placeholder-icon"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" opacity="0.3" />
				<path d="M3 9h18" />
				<path d="M9 21V9" />
			</svg>
			<h2 class="placeholder-title">Game Canvas</h2>
			<p class="placeholder-text">
				The interactive timeline canvas will be implemented in a future milestone. You'll be able to
				create periods, events, and scenes to build your world's history.
			</p>
		</div>
	</div>
</div>

<style>
	.canvas-placeholder {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.canvas-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
		background-color: oklch(10% 0.02 265 / 0.5);
		backdrop-filter: blur(8px);
	}

	.game-id {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
	}

	.canvas-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.placeholder-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 400px;
		padding: 2rem;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-card);
	}

	.placeholder-icon {
		width: 4rem;
		height: 4rem;
		color: var(--color-muted-foreground);
		margin-bottom: 1.5rem;
		opacity: 0.5;
	}

	.placeholder-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: var(--color-foreground);
	}

	.placeholder-text {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
		line-height: 1.6;
	}

	@media (max-width: 640px) {
		.canvas-header {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
		}

		.game-id {
			font-size: 0.75rem;
		}
	}
</style>
