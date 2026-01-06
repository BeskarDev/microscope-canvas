<script lang="ts">
	import type { Game, Period, Event as GameEvent, Scene } from '$lib/types';
	import PeriodCard from './PeriodCard.svelte';
	import EventCard from './EventCard.svelte';
	import SceneCard from './SceneCard.svelte';
	import AddButton from './AddButton.svelte';
	import { dndzone, SOURCES } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { SvelteMap } from 'svelte/reactivity';

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
	
	// Local state for drag and drop - these are used for the preview during dragging
	let localPeriods = $state<Period[]>([]);
	let localEventsMap = new SvelteMap<string, GameEvent[]>();
	let localScenesMap = new SvelteMap<string, Scene[]>();

	// Sync local state with props
	$effect(() => {
		localPeriods = game.periods;
		// Clear maps when game changes
		localEventsMap.clear();
		localScenesMap.clear();
		// Initialize event and scene maps
		game.periods.forEach(period => {
			localEventsMap.set(period.id, period.events);
			period.events.forEach(event => {
				localScenesMap.set(`${period.id}-${event.id}`, event.scenes);
			});
		});
	});

	// Period drag handlers
	function handlePeriodConsider(e: CustomEvent<{ items: Period[]; info: { trigger: string; id: string; source: string } }>) {
		const { items } = e.detail;
		// Update local state for drag preview
		localPeriods = items;
	}

	function handlePeriodFinalize(e: CustomEvent<{ items: Period[]; info: { trigger: string; id: string; source: string } }>) {
		const { items, info } = e.detail;
		
		// Update local state
		localPeriods = items;
		
		// Call reorder callback if position changed and it was a pointer drag
		if (info.source === SOURCES.POINTER && onReorderPeriods) {
			// Find the original and new positions by comparing with game.periods
			const originalIndex = game.periods.findIndex(p => p.id === info.id);
			const newIndex = items.findIndex(p => p.id === info.id);
			
			if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
				onReorderPeriods(originalIndex, newIndex);
			}
		}
	}

	// Event drag handlers
	function handleEventConsider(periodId: string, e: CustomEvent<{ items: GameEvent[]; info: { trigger: string; id: string; source: string } }>) {
		const { items } = e.detail;
		// Update local state for drag preview
		localEventsMap.set(periodId, items);
		localEventsMap = new SvelteMap(localEventsMap);
	}

	function handleEventFinalize(periodId: string, e: CustomEvent<{ items: GameEvent[]; info: { trigger: string; id: string; source: string } }>) {
		const { items, info } = e.detail;
		
		// Check if the dragged item belongs to this period
		const period = game.periods.find(p => p.id === periodId);
		if (!period) return;
		
		const draggedItemBelongsToThisPeriod = period.events.some(ev => ev.id === info.id);
		
		// If item doesn't belong to this period, reject the drag by restoring original state
		if (!draggedItemBelongsToThisPeriod && info.source === SOURCES.POINTER) {
			// Restore original state for this period
			localEventsMap.set(periodId, period.events);
			localEventsMap = new SvelteMap(localEventsMap);
			return;
		}
		
		// Update local state
		localEventsMap.set(periodId, items);
		localEventsMap = new SvelteMap(localEventsMap);
		
		// Call reorder callback if position changed
		if (info.source === SOURCES.POINTER && onReorderEvents && draggedItemBelongsToThisPeriod) {
			const originalIndex = period.events.findIndex(ev => ev.id === info.id);
			const newIndex = items.findIndex(ev => ev.id === info.id);
			
			if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
				onReorderEvents(periodId, originalIndex, newIndex);
			}
		}
	}

	// Scene drag handlers
	function handleSceneConsider(periodId: string, eventId: string, e: CustomEvent<{ items: Scene[]; info: { trigger: string; id: string; source: string } }>) {
		const { items } = e.detail;
		const key = `${periodId}-${eventId}`;
		// Update local state for drag preview
		localScenesMap.set(key, items);
		localScenesMap = new SvelteMap(localScenesMap);
	}

	function handleSceneFinalize(periodId: string, eventId: string, e: CustomEvent<{ items: Scene[]; info: { trigger: string; id: string; source: string } }>) {
		const { items, info } = e.detail;
		const key = `${periodId}-${eventId}`;
		
		// Check if the dragged item belongs to this event
		const period = game.periods.find(p => p.id === periodId);
		const event = period?.events.find(e => e.id === eventId);
		
		if (!event) return;
		
		const draggedItemBelongsToThisEvent = event.scenes.some(s => s.id === info.id);
		
		// If item doesn't belong to this event, reject the drag by restoring original state
		if (!draggedItemBelongsToThisEvent && info.source === SOURCES.POINTER) {
			// Restore original state for this event
			localScenesMap.set(key, event.scenes);
			localScenesMap = new SvelteMap(localScenesMap);
			return;
		}
		
		// Update local state
		localScenesMap.set(key, items);
		localScenesMap = new SvelteMap(localScenesMap);
		
		// Call reorder callback if position changed
		if (info.source === SOURCES.POINTER && onReorderScenes && draggedItemBelongsToThisEvent) {
			const originalIndex = event.scenes.findIndex(s => s.id === info.id);
			const newIndex = items.findIndex(s => s.id === info.id);
			
			if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
				onReorderScenes(periodId, eventId, originalIndex, newIndex);
			}
		}
	}
</script>

<div class="timeline">
	<!-- Add button before first period -->
	<AddButton
		label="Add period at beginning"
		orientation="horizontal"
		onclick={() => onAddPeriod(0)}
	/>

	<!-- Periods container with dnd zone -->
	<div 
		class="periods-container"
		use:dndzone={{
			items: localPeriods,
			flipDurationMs,
			type: 'periods',
			dropTargetStyle: {},
			dropTargetClasses: ['drop-target-period'],
			centreDraggedOnCursor: true,
			dropFromOthersDisabled: true,
			morphDisabled: false
		}}
		onconsider={handlePeriodConsider}
		onfinalize={handlePeriodFinalize}
	>
		{#each localPeriods as period, periodIndex (period.id)}
			<div class="period-wrapper" animate:flip={{ duration: flipDurationMs }}>
				<div class="period-column">
					<!-- Period card -->
					<div class="period-section">
						<PeriodCard {period} onclick={() => onSelectPeriod(period)} />
					</div>

					<!-- Events under this period - only show container if there are events -->
					{#if (localEventsMap.get(period.id) ?? period.events).length > 0}
						{@const periodEvents = localEventsMap.get(period.id) ?? period.events}
						<div 
							class="events-section"
							use:dndzone={{
								items: periodEvents,
								flipDurationMs,
								type: `events-${period.id}`,
								dropTargetStyle: {},
								dropTargetClasses: ['drop-target-event'],
								centreDraggedOnCursor: true
							}}
							onconsider={(e) => handleEventConsider(period.id, e)}
							onfinalize={(e) => handleEventFinalize(period.id, e)}
						>
							{#each periodEvents as event (event.id)}
								<div class="event-column" animate:flip={{ duration: flipDurationMs }}>
									<!-- Event card -->
									<div class="event-wrapper">
										<EventCard {event} onclick={() => onSelectEvent(period.id, event)} />
									</div>

									<!-- Scenes under this event -->
									{#if (localScenesMap.get(`${period.id}-${event.id}`) ?? event.scenes).length > 0}
										{@const eventScenes = localScenesMap.get(`${period.id}-${event.id}`) ?? event.scenes}
										<div 
											class="scenes-section"
											use:dndzone={{
												items: eventScenes,
												flipDurationMs,
												type: `scenes-${period.id}-${event.id}`,
												dropTargetStyle: {},
												dropTargetClasses: ['drop-target-scene'],
												centreDraggedOnCursor: true
											}}
											onconsider={(e) => handleSceneConsider(period.id, event.id, e)}
											onfinalize={(e) => handleSceneFinalize(period.id, event.id, e)}
										>
											{#each eventScenes as scene (scene.id)}
												<div class="scene-wrapper" animate:flip={{ duration: flipDurationMs }}>
													<SceneCard {scene} onclick={() => onSelectScene(period.id, event.id, scene)} />
												</div>
											{/each}
										</div>
									{/if}

									<!-- Add scene button - smaller size -->
									<AddButton
										label="Add scene to this event"
										orientation="vertical"
										size="small"
										onclick={() => onAddScene(period.id, event.id)}
									/>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Add event button - larger size -->
					<AddButton
						label="Add event to this period"
						orientation="vertical"
						size="medium"
						onclick={() => onAddEvent(period.id)}
					/>
				</div>

				<!-- Add button between periods (inside period-wrapper for proper spacing) -->
				<AddButton
					label="Add period here"
					orientation="horizontal"
					onclick={() => onAddPeriod(periodIndex + 1)}
				/>
			</div>
		{/each}
	</div>

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

	.periods-container {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 0;
	}

	.period-wrapper {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		/* Allow drag-and-drop to work from anywhere on the card */
		touch-action: none;
		user-select: none;
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
		cursor: grab;
	}

	.period-section:active {
		cursor: grabbing;
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
		/* Allow drag-and-drop to work from anywhere on the card */
		touch-action: none;
		user-select: none;
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
	}

	.scene-wrapper {
		flex-shrink: 0;
		position: relative;
		cursor: grab;
		/* Allow drag-and-drop to work from anywhere on the card */
		touch-action: none;
		user-select: none;
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
	:global(.drop-target-period) {
		outline: 2px dashed var(--color-primary);
		outline-offset: 4px;
		border-radius: var(--radius);
	}

	:global(.drop-target-event) {
		outline: 2px dashed var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius);
	}

	:global(.drop-target-scene) {
		outline: 2px dashed var(--color-primary);
		outline-offset: 2px;
		border-radius: var(--radius);
	}

	/* Shadow placeholder styling */
	:global([data-is-dnd-shadow-item-hint]) {
		opacity: 0.5;
	}

	/* Ensure dragged items don't get stuck in dragging state */
	:global([aria-grabbed="true"]) {
		opacity: 0.5;
		cursor: grabbing;
	}

	/* Ensure items being dragged reset properly */
	:global(.event-column:not([aria-grabbed="true"])) {
		opacity: 1;
		transform: none;
	}

	:global(.period-wrapper:not([aria-grabbed="true"])) {
		opacity: 1;
		transform: none;
	}

	:global(.scene-wrapper:not([aria-grabbed="true"])) {
		opacity: 1;
		transform: none;
	}
</style>
