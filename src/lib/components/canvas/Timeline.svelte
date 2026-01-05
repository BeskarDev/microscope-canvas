<script lang="ts">
	import type { Game, Period, Event as GameEvent, Scene } from '$lib/types';
	import PeriodCard from './PeriodCard.svelte';
	import EventCard from './EventCard.svelte';
	import SceneCard from './SceneCard.svelte';
	import AddButton from './AddButton.svelte';

	interface Props {
		game: Game;
		onAddPeriod: (index: number) => void;
		onAddEvent: (periodId: string) => void;
		onAddScene: (periodId: string, eventId: string) => void;
		onSelectPeriod: (period: Period) => void;
		onSelectEvent: (periodId: string, event: GameEvent) => void;
		onSelectScene: (periodId: string, eventId: string, scene: Scene) => void;
	}

	let {
		game,
		onAddPeriod,
		onAddEvent,
		onAddScene,
		onSelectPeriod,
		onSelectEvent,
		onSelectScene
	}: Props = $props();
</script>

<div class="timeline">
	<!-- Add button before first period -->
	<AddButton
		label="Add period at beginning"
		orientation="horizontal"
		onclick={() => onAddPeriod(0)}
	/>

	{#each game.periods as period, periodIndex (period.id)}
		<div class="period-column">
			<!-- Period card -->
			<div class="period-section" data-card>
				<PeriodCard {period} onclick={() => onSelectPeriod(period)} />
			</div>

			<!-- Events under this period -->
			<div class="events-section">
				{#each period.events as event (event.id)}
					<div class="event-column">
						<!-- Event card -->
						<div class="event-wrapper" data-card>
							<EventCard {event} onclick={() => onSelectEvent(period.id, event)} />
						</div>

						<!-- Scenes under this event -->
						<div class="scenes-section">
							{#each event.scenes as scene (scene.id)}
								<div class="scene-wrapper" data-card>
									<SceneCard {scene} onclick={() => onSelectScene(period.id, event.id, scene)} />
								</div>
							{/each}

							<!-- Add scene button -->
							<AddButton
								label="Add scene to this event"
								orientation="vertical"
								onclick={() => onAddScene(period.id, event.id)}
							/>
						</div>
					</div>
				{/each}

				<!-- Add event button -->
				<AddButton
					label="Add event to this period"
					orientation="vertical"
					onclick={() => onAddEvent(period.id)}
				/>
			</div>
		</div>

		<!-- Add button between periods -->
		<AddButton
			label="Add period here"
			orientation="horizontal"
			onclick={() => onAddPeriod(periodIndex + 1)}
		/>
	{/each}

	{#if game.periods.length === 0}
		<!-- Show message when no periods exist -->
		<div class="empty-timeline">
			<p class="empty-text">Start building your history</p>
			<p class="empty-subtext">Click + to add your first period</p>
		</div>
	{/if}
</div>

<style>
	.timeline {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 0;
		padding: calc(2rem * max(var(--canvas-zoom, 1), 1));
		min-width: max-content;
	}

	.period-column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(1rem * max(var(--canvas-zoom, 1), 1));
	}

	.period-section {
		flex-shrink: 0;
	}

	.events-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(0.75rem * max(var(--canvas-zoom, 1), 1));
		min-width: calc(180px * max(var(--canvas-zoom, 1), 1));
	}

	.event-column {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.event-wrapper {
		flex-shrink: 0;
	}

	.scenes-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		margin-top: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		padding-left: calc(1.5rem * max(var(--canvas-zoom, 1), 1));
	}

	.scene-wrapper {
		flex-shrink: 0;
	}

	.empty-timeline {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: calc(4rem * max(var(--canvas-zoom, 1), 1)) calc(2rem * max(var(--canvas-zoom, 1), 1));
		text-align: center;
	}

	.empty-text {
		font-size: calc(1.125rem * max(var(--canvas-zoom, 1), 1));
		font-weight: 500;
		color: var(--color-foreground);
		margin: 0 0 calc(0.5rem * max(var(--canvas-zoom, 1), 1)) 0;
	}

	.empty-subtext {
		font-size: calc(0.875rem * max(var(--canvas-zoom, 1), 1));
		color: var(--color-muted-foreground);
		margin: 0;
	}
</style>
