<script lang="ts">
	import type { Game, Period, Event as GameEvent, Scene } from '$lib/types';
	import PeriodCard from './PeriodCard.svelte';
	import EventCard from './EventCard.svelte';
	import SceneCard from './SceneCard.svelte';
	import AddButton from './AddButton.svelte';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';

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

	// Drag state
	type DragType = 'period' | 'event' | 'scene';
	let dragType = $state<DragType | null>(null);
	let dragIndex = $state(-1);
	let dragPeriodId = $state<string | null>(null);
	let dragEventId = $state<string | null>(null);
	let dropIndex = $state(-1);

	function handleDragStart(type: DragType, index: number, periodId?: string, eventId?: string) {
		return (e: DragEvent) => {
			if (!e.dataTransfer) return;
			dragType = type;
			dragIndex = index;
			dragPeriodId = periodId ?? null;
			dragEventId = eventId ?? null;
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', `${type}:${index}`);
		};
	}

	function handleDragOver(type: DragType, index: number, periodId?: string, eventId?: string) {
		return (e: DragEvent) => {
			e.preventDefault();
			if (!e.dataTransfer) return;
			// Only allow drop on same type and same parent
			if (dragType !== type) return;
			if (type === 'event' && dragPeriodId !== periodId) return;
			if (type === 'scene' && (dragPeriodId !== periodId || dragEventId !== eventId)) return;
			e.dataTransfer.dropEffect = 'move';
			dropIndex = index;
		};
	}

	function handleDragLeave() {
		dropIndex = -1;
	}

	function handleDrop(type: DragType, toIndex: number, periodId?: string, eventId?: string) {
		return (e: DragEvent) => {
			e.preventDefault();
			if (dragType !== type || dragIndex === toIndex) {
				resetDragState();
				return;
			}
			// Same parent check
			if (type === 'event' && dragPeriodId !== periodId) {
				resetDragState();
				return;
			}
			if (type === 'scene' && (dragPeriodId !== periodId || dragEventId !== eventId)) {
				resetDragState();
				return;
			}

			if (type === 'period' && onReorderPeriods) {
				onReorderPeriods(dragIndex, toIndex);
			} else if (type === 'event' && onReorderEvents && periodId) {
				onReorderEvents(periodId, dragIndex, toIndex);
			} else if (type === 'scene' && onReorderScenes && periodId && eventId) {
				onReorderScenes(periodId, eventId, dragIndex, toIndex);
			}
			resetDragState();
		};
	}

	function handleDragEnd() {
		resetDragState();
	}

	function resetDragState() {
		dragType = null;
		dragIndex = -1;
		dragPeriodId = null;
		dragEventId = null;
		dropIndex = -1;
	}
</script>

<div class="timeline">
	<!-- Add button before first period -->
	<AddButton
		label="Add period at beginning"
		orientation="horizontal"
		onclick={() => onAddPeriod(0)}
	/>

	{#each game.periods as period, periodIndex (period.id)}
		<div
			class="period-column"
			class:drag-over={dragType === 'period' &&
				dropIndex === periodIndex &&
				dragIndex !== periodIndex}
			ondragover={handleDragOver('period', periodIndex)}
			ondragleave={handleDragLeave}
			ondrop={handleDrop('period', periodIndex)}
		>
			<!-- Period card with drag handle -->
			<div
				class="period-section"
				class:dragging={dragType === 'period' && dragIndex === periodIndex}
				draggable="true"
				ondragstart={handleDragStart('period', periodIndex)}
				ondragend={handleDragEnd}
			>
				<div class="drag-handle" title="Drag to reorder">
					<GripVertical class="h-4 w-4" />
				</div>
				<PeriodCard {period} onclick={() => onSelectPeriod(period)} />
			</div>

			<!-- Events under this period -->
			<div class="events-section">
				{#each period.events as event, eventIndex (event.id)}
					<div
						class="event-column"
						class:drag-over={dragType === 'event' &&
							dropIndex === eventIndex &&
							dragIndex !== eventIndex &&
							dragPeriodId === period.id}
						ondragover={handleDragOver('event', eventIndex, period.id)}
						ondragleave={handleDragLeave}
						ondrop={handleDrop('event', eventIndex, period.id)}
					>
						<!-- Event card with drag handle -->
						<div
							class="event-wrapper"
							class:dragging={dragType === 'event' &&
								dragIndex === eventIndex &&
								dragPeriodId === period.id}
							draggable="true"
							ondragstart={handleDragStart('event', eventIndex, period.id)}
							ondragend={handleDragEnd}
						>
							<div class="drag-handle" title="Drag to reorder">
								<GripVertical class="h-3.5 w-3.5" />
							</div>
							<EventCard {event} onclick={() => onSelectEvent(period.id, event)} />
						</div>

						<!-- Scenes under this event -->
						<div class="scenes-section">
							{#each event.scenes as scene, sceneIndex (scene.id)}
								<div
									class="scene-wrapper"
									class:drag-over={dragType === 'scene' &&
										dropIndex === sceneIndex &&
										dragIndex !== sceneIndex &&
										dragPeriodId === period.id &&
										dragEventId === event.id}
									class:dragging={dragType === 'scene' &&
										dragIndex === sceneIndex &&
										dragPeriodId === period.id &&
										dragEventId === event.id}
									draggable="true"
									ondragstart={handleDragStart('scene', sceneIndex, period.id, event.id)}
									ondragover={handleDragOver('scene', sceneIndex, period.id, event.id)}
									ondragleave={handleDragLeave}
									ondrop={handleDrop('scene', sceneIndex, period.id, event.id)}
									ondragend={handleDragEnd}
								>
									<div class="drag-handle scene-handle" title="Drag to reorder">
										<GripVertical class="h-3 w-3" />
									</div>
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
		transition: transform 0.15s ease;
	}

	.period-column.drag-over {
		transform: translateX(4px);
	}

	.period-section {
		flex-shrink: 0;
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
	}

	.period-section.dragging {
		opacity: 0.5;
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
		transition: transform 0.15s ease;
	}

	.event-column.drag-over {
		transform: translateY(4px);
	}

	.event-wrapper {
		flex-shrink: 0;
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
	}

	.event-wrapper.dragging {
		opacity: 0.5;
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
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: calc(0.125rem * max(var(--canvas-zoom, 1), 1));
		transition: transform 0.15s ease;
	}

	.scene-wrapper.drag-over {
		transform: translateY(4px);
	}

	.scene-wrapper.dragging {
		opacity: 0.5;
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
		cursor: grab;
		color: var(--color-muted-foreground);
		opacity: 0.5;
		transition:
			opacity 0.15s,
			color 0.15s;
		border-radius: var(--radius);
	}

	.drag-handle:hover {
		opacity: 1;
		color: var(--color-foreground);
		background-color: var(--color-muted);
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.scene-handle {
		padding: calc(0.125rem * max(var(--canvas-zoom, 1), 1));
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
