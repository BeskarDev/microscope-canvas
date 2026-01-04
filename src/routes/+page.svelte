<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { toast } from '$lib/components/ui/sonner';
	import Plus from 'lucide-svelte/icons/plus';
	import Upload from 'lucide-svelte/icons/upload';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	// Placeholder games list - will be replaced with actual persistence in later milestone
	let games: { id: string; name: string; lastModified: Date }[] = $state([]);

	function handleCreateGame() {
		// For now, just navigate to a placeholder game page
		// In a later milestone, this will create a game in persistence
		const newId = crypto.randomUUID();
		toast.success('Creating new game...', {
			description: 'Game creation will be implemented in the next milestone.'
		});
		// Navigate to the new game
		goto(resolve('/game/[id]', { id: newId }));
	}

	function handleImportGame() {
		toast.info('Import Coming Soon', {
			description: 'Game import functionality will be available in a future update.'
		});
	}
</script>

<div class="home-container">
	<section class="hero-section">
		<div class="hero-icon">
			<Sparkles class="h-12 w-12" />
		</div>
		<h1 class="hero-title">Build Worlds Across Time</h1>
		<p class="hero-description">
			Create epic histories with Microscope. Define eras, explore events, and discover the stories
			that shape your world.
		</p>
	</section>

	<section class="actions-section">
		<Button onclick={handleCreateGame} size="lg" class="action-button">
			<Plus class="h-5 w-5" />
			Create New Game
		</Button>
		<Button onclick={handleImportGame} variant="secondary" size="lg" class="action-button">
			<Upload class="h-5 w-5" />
			Import Game
		</Button>
	</section>

	<section class="games-section">
		<h2 class="section-title">Your Games</h2>

		{#if games.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="h-16 w-16"
					>
						<circle cx="12" cy="12" r="10" opacity="0.3" />
						<path d="M8 12h8" />
						<path d="M12 8v8" />
					</svg>
				</div>
				<p class="empty-text">No games yet</p>
				<p class="empty-subtext">Create a new game to begin your worldbuilding journey</p>
			</div>
		{:else}
			<ul class="games-list">
				{#each games as game (game.id)}
					<li>
						<a href={resolve('/game/[id]', { id: game.id })} class="game-card">
							<span class="game-name">{game.name}</span>
							<span class="game-date">
								{game.lastModified.toLocaleDateString()}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.home-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1rem;
		max-width: 800px;
		margin: 0 auto;
		gap: 3rem;
	}

	.hero-section {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.hero-icon {
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		letter-spacing: -0.025em;
		background: linear-gradient(
			135deg,
			var(--color-foreground) 0%,
			var(--color-primary) 50%,
			var(--color-foreground) 100%
		);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		line-height: 1.2;
	}

	.hero-description {
		font-size: 1.125rem;
		color: var(--color-muted-foreground);
		max-width: 500px;
		line-height: 1.6;
	}

	.actions-section {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
	}

	.actions-section :global(.action-button) {
		min-width: 180px;
	}

	.games-section {
		width: 100%;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		text-align: center;
		color: var(--color-foreground);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem 2rem;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-card);
		text-align: center;
	}

	.empty-icon {
		color: var(--color-muted-foreground);
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.empty-subtext {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	.games-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.game-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background-color: var(--color-card);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--color-card-foreground);
		transition:
			border-color 0.2s,
			background-color 0.2s;
	}

	.game-card:hover {
		border-color: var(--color-primary);
		background-color: var(--color-accent);
	}

	.game-name {
		font-weight: 500;
	}

	.game-date {
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
	}

	@media (max-width: 640px) {
		.home-container {
			padding: 1.5rem 1rem;
			gap: 2rem;
		}

		.hero-title {
			font-size: 1.75rem;
		}

		.hero-description {
			font-size: 1rem;
		}

		.actions-section {
			flex-direction: column;
			width: 100%;
		}

		.actions-section :global(.action-button) {
			width: 100%;
		}
	}
</style>
