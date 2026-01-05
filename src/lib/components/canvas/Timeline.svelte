<script lang="ts">
	import type { Game, Period, Event as GameEvent, Scene } from '$lib/types';
	import PeriodCard from './PeriodCard.svelte';
	import EventCard from './EventCard.svelte';
	import SceneCard from './SceneCard.svelte';
	import AddButton from './AddButton.svelte';
	import { dndzone, TRIGGERS } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	interface Props {
		game: Game;
		onAddPeriod: (index: number) => void;
		onAddEvent: (periodId: string) => void;
		onAddScene: (periodId: string, eventId: string) => void;
		onSelectPeriod: (period: Period) => void;
		onSelectEvent: (periodId: string, event: GameEvent) => void;
		onSelectScene: (periodId: string, eventId: string, scene: Scene) => void;
		onReorderPeriods?: (fromIndex: number, toIndex: number) => void;
		onReorderEvents?: (periodId: string, fromIndex: number, toIndex: number) => void;
		onReorderScenes?: (
			periodId: string,
			eventId: string,
			fromIndex: number,
			toIndex: number
		) => void;
	}

	let {
		game,
		onAddPeriod,
		onAddEvent,
		onAddScene,
		onSelectPeriod,
		onSelectEvent,
		onSelectScene,
		onReorderPeriods,
		onReorderEvents,
		onReorderScenes
	}: Props = $props();

	// Configuration for dnd-action
	const flipDurationMs = 200;

	// Track original indices for reorder callbacks
	let draggedEventOriginalIndex = -1;
	let draggedSceneOriginalIndex = -1;
	let currentDragPeriodId: string | null = null;
	let currentDragEventId: string | null = null;

	// Event drag handlers - svelte-dnd-action expects us to update the items array
	function handleEventConsider(periodId: string, e: CustomEvent<{ items: GameEvent[]; info: { trigger: string; id: string } }>) {
		const { items, info } = e.detail;
		const periodIndex = game.periods.findIndex(p => p.id === periodId);
		if (periodIndex === -1) return;

		// Track the original index when drag starts
		if (info.trigger === TRIGGERS.DRAG_STARTED) {
			draggedEventOriginalIndex = game.periods[periodIndex].events.findIndex(ev => ev.id === info.id);
			currentDragPeriodId = periodId;
		}

		// Update the events array for this period - use spread to trigger reactivity
		game.periods[periodIndex].events = items;
		game.periods = [...game.periods];
	}

	function handleEventFinalize(periodId: string, e: CustomEvent<{ items: GameEvent[]; info: { trigger: string; id: string } }>) {
		const { items, info } = e.detail;
		const periodIndex = game.periods.findIndex(p => p.id === periodId);
		if (periodIndex === -1) return;

		// Update the events array
		game.periods[periodIndex].events = items;
		game.periods = [...game.periods];
		
		// Call the reorder callback with original and new indices
		if (info.trigger === TRIGGERS.DROPPED_INTO_ZONE && onReorderEvents && 
			currentDragPeriodId === periodId && draggedEventOriginalIndex !== -1) {
			const newIndex = items.findIndex(ev => ev.id === info.id);
			if (newIndex !== -1 && newIndex !== draggedEventOriginalIndex) {
				onReorderEvents(periodId, draggedEventOriginalIndex, newIndex);
			}
		}

		draggedEventOriginalIndex = -1;
		currentDragPeriodId = null;
	}

	// Scene drag handlers
	function handleSceneConsider(periodId: string, eventId: string, e: CustomEvent<{ items: Scene[]; info: { trigger: string; id: string } }>) {
		const { items, info } = e.detail;
		const periodIndex = game.periods.findIndex(p => p.id === periodId);
		if (periodIndex === -1) return;
		
		const eventIndex = game.periods[periodIndex].events.findIndex(ev => ev.id === eventId);
		if (eventIndex === -1) return;

		// Track the original index when drag starts
		if (info.trigger === TRIGGERS.DRAG_STARTED) {
			draggedSceneOriginalIndex = game.periods[periodIndex].events[eventIndex].scenes.findIndex(s => s.id === info.id);
			currentDragPeriodId = periodId;
			currentDragEventId = eventId;
		}

		// Update the scenes array - use spread to trigger reactivity
		game.periods[periodIndex].events[eventIndex].scenes = items;
		game.periods = [...game.periods];
	}

	function handleSceneFinalize(periodId: string, eventId: string, e: CustomEvent<{ items: Scene[]; info: { trigger: string; id: string } }>) {
		const { items, info } = e.detail;
		const periodIndex = game.periods.findIndex(p => p.id === periodId);
		if (periodIndex === -1) return;
		
		const eventIndex = game.periods[periodIndex].events.findIndex(ev => ev.id === eventId);
		if (eventIndex === -1) return;

		// Update the scenes array
		game.periods[periodIndex].events[eventIndex].scenes = items;
		game.periods = [...game.periods];

		// Call the reorder callback
		if (info.trigger === TRIGGERS.DROPPED_INTO_ZONE && onReorderScenes && 
			currentDragPeriodId === periodId && currentDragEventId === eventId && draggedSceneOriginalIndex !== -1) {
			const newIndex = items.findIndex(s => s.id === info.id);
			if (newIndex !== -1 && newIndex !== draggedSceneOriginalIndex) {
				onReorderScenes(periodId, eventId, draggedSceneOriginalIndex, newIndex);
			}
		}

		draggedSceneOriginalIndex = -1;
		currentDragPeriodId = null;
		currentDragEventId = null;
	}
</script>

<div class="timeline">
	<!-- Add button before first period -->
	<AddButton
		label="Add period at beginning"
		orientation="horizontal"
		onclick={() => onAddPeriod(0)}
	/>

	<!-- Periods - each column with period + events + scenes -->
	{#each game.periods as period, periodIndex (period.id)}
		<div class="period-column">
			<!-- Period card (not draggable for now - focus on fixing events/scenes first) -->
			<div class="period-section">
				<PeriodCard {period} onclick={() => onSelectPeriod(period)} />
			</div>

			<!-- Events under this period -->
			<div 
				class="events-section"
				use:dndzone={{
					items: period.events,
					flipDurationMs,
					type: `events-${period.id}`,
					dropTargetStyle: {},
					dropTargetClasses: ['drop-target'],
					dragDisabled: false,
					centreDraggedOnCursor: true
				}}
				onconsider={(e) => handleEventConsider(period.id, e)}
				onfinalize={(e) => handleEventFinalize(period.id, e)}
			>
				{#each period.events as event (event.id)}
					<div class="event-column" animate:flip={{ duration: flipDurationMs }}>
						<!-- Event card -->
						<div class="event-wrapper">
							<EventCard {event} onclick={() => onSelectEvent(period.id, event)} />
						</div>

						<!-- Scenes under this event -->
						<div 
							class="scenes-section"
							use:dndzone={{
								items: event.scenes,
								flipDurationMs,
								type: `scenes-${period.id}-${event.id}`,
								dropTargetStyle: {},
								dropTargetClasses: ['drop-target'],
								dragDisabled: false,
								centreDraggedOnCursor: true
							}}
							onconsider={(e) => handleSceneConsider(period.id, event.id, e)}
							onfinalize={(e) => handleSceneFinalize(period.id, event.id, e)}
						>
							{#each event.scenes as scene (scene.id)}
								<div class="scene-wrapper" animate:flip={{ duration: flipDurationMs }}>
									<SceneCard {scene} onclick={() => onSelectScene(period.id, event.id, scene)} />
								</div>
							{/each}
						</div>

						<!-- Add scene button -->
						<AddButton
							label="Add scene to this event"
							orientation="vertical"
							onclick={() => onAddScene(period.id, event.id)}
						/>
					</div>
				{/each}
			</div>

			<!-- Add event button -->
			<AddButton
				label="Add event to this period"
				orientation="vertical"
				onclick={() => onAddEvent(period.id)}
			/>
		</div>

		<!-- Add button between periods (outside period-column) -->
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
		position: relative;
	}

	.events-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(0.75rem * max(var(--canvas-zoom, 1), 1));
		min-width: calc(180px * max(var(--canvas-zoom, 1), 1));
		min-height: calc(50px * max(var(--canvas-zoom, 1), 1));
	}

	.event-column {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.event-wrapper {
		flex-shrink: 0;
		position: relative;
		cursor: grab;
	}

	.event-wrapper:active {
		cursor: grabbing;
	}

	.scenes-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		margin-top: calc(0.5rem * max(var(--canvas-zoom, 1), 1));
		padding-left: calc(1.5rem * max(var(--canvas-zoom, 1), 1));
		min-height: calc(30px * max(var(--canvas-zoom, 1), 1));
	}

	.scene-wrapper {
		flex-shrink: 0;
		position: relative;
		cursor: grab;
	}

	.scene-wrapper:active {
		cursor: grabbing;
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

	/* Drag and drop styles */
	:global(.drop-target) {
		outline: 2px dashed var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius);
	}

	/* Shadow placeholder styling */
	:global([data-is-dnd-shadow-item-hint]) {
		opacity: 0.5;
	}
</style>
