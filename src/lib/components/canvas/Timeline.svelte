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

	// Drag state for touch/pointer-based reordering
	type DragType = 'period' | 'event' | 'scene';
	let isDragging = $state(false);
	let dragType = $state<DragType | null>(null);
	let dragIndex = $state(-1);
	let dragPeriodId = $state<string | null>(null);
	let dragEventId = $state<string | null>(null);
	let dropIndex = $state(-1);
	let dragStartPos = $state({ x: 0, y: 0 });
	let dragElement = $state<HTMLElement | null>(null);
	const DRAG_THRESHOLD = 5; // pixels before drag starts

	// Long press detection for mobile
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;
	const LONG_PRESS_DURATION = 300; // ms

	function handlePointerDown(
		type: DragType,
		index: number,
		periodId?: string,
		eventId?: string
	) {
		return (e: PointerEvent) => {
			// Don't start drag on buttons or interactive elements
			const target = e.target as HTMLElement;
			if (target.closest('button') || target.closest('[data-no-drag]')) return;

			dragStartPos = { x: e.clientX, y: e.clientY };
			dragElement = e.currentTarget as HTMLElement;

			// For touch devices, use long press to initiate drag
			if (e.pointerType === 'touch') {
				longPressTimer = setTimeout(() => {
					startDrag(type, index, periodId, eventId, e.currentTarget as HTMLElement);
				}, LONG_PRESS_DURATION);
			}
		};
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragElement) return;

		const dx = Math.abs(e.clientX - dragStartPos.x);
		const dy = Math.abs(e.clientY - dragStartPos.y);

		// For mouse, start drag after threshold
		// For mouse, use native HTML5 drag-and-drop (handled by ondragstart)
		// For touch, cancel long press if moved too much
		if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}
		}

		// Update drop target during drag
		if (isDragging) {
			updateDropTarget(e);
		}
	}

	function handlePointerUp() {
		// Clear long press timer
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}

		// Complete drag if active
		if (isDragging) {
			completeDrag();
		}

		// Reset pointer tracking
		dragElement = null;
	}

	function handlePointerCancel() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
		if (isDragging) {
			resetDragState();
		}
		dragElement = null;
	}

	function startDrag(
		type: DragType,
		index: number,
		periodId: string | undefined,
		eventId: string | undefined,
		element: HTMLElement
	) {
		isDragging = true;
		dragType = type;
		dragIndex = index;
		dragPeriodId = periodId ?? null;
		dragEventId = eventId ?? null;
		element.classList.add('dragging');

		// Add haptic feedback on mobile if available
		try {
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}
		} catch {
			// Vibration API not supported or blocked
		}
	}

	function updateDropTarget(e: PointerEvent) {
		const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

		// Find the nearest drop target
		for (const el of elementsAtPoint) {
			const dropTarget = el.closest('[data-drop-target]') as HTMLElement | null;
			if (dropTarget) {
				const targetType = dropTarget.dataset.dropType;
				const targetIndex = parseInt(dropTarget.dataset.dropIndex || '-1', 10);
				const targetPeriodId = dropTarget.dataset.dropPeriodId;
				const targetEventId = dropTarget.dataset.dropEventId;

				// Check if valid drop target (same type and parent)
				if (targetType === dragType) {
					if (dragType === 'period') {
						dropIndex = targetIndex;
						return;
					}
					if (dragType === 'event' && targetPeriodId === dragPeriodId) {
						dropIndex = targetIndex;
						return;
					}
					if (
						dragType === 'scene' &&
						targetPeriodId === dragPeriodId &&
						targetEventId === dragEventId
					) {
						dropIndex = targetIndex;
						return;
					}
				}
			}
		}
		dropIndex = -1;
	}

	function completeDrag() {
		if (dragIndex !== -1 && dropIndex !== -1 && dragIndex !== dropIndex) {
			if (dragType === 'period' && onReorderPeriods) {
				onReorderPeriods(dragIndex, dropIndex);
			} else if (dragType === 'event' && onReorderEvents && dragPeriodId) {
				onReorderEvents(dragPeriodId, dragIndex, dropIndex);
			} else if (dragType === 'scene' && onReorderScenes && dragPeriodId && dragEventId) {
				onReorderScenes(dragPeriodId, dragEventId, dragIndex, dropIndex);
			}
		}
		resetDragState();
	}

	function resetDragState() {
		// Remove dragging class from element
		document.querySelectorAll('.dragging').forEach((el) => el.classList.remove('dragging'));

		isDragging = false;
		dragType = null;
		dragIndex = -1;
		dragPeriodId = null;
		dragEventId = null;
		dropIndex = -1;
	}

	// Native drag events for desktop (mouse)
	function handleDragStart(type: DragType, index: number, periodId?: string, eventId?: string) {
		return (e: DragEvent) => {
			if (!e.dataTransfer) return;
			isDragging = true;
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
</script>

<svelte:window
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerCancel}
/>

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
			data-drop-target
			data-drop-type="period"
			data-drop-index={periodIndex}
			ondragover={handleDragOver('period', periodIndex)}
			ondragleave={handleDragLeave}
			ondrop={handleDrop('period', periodIndex)}
			role="listitem"
		>
			<!-- Period card - draggable -->
			<div
				class="period-section"
				class:dragging={dragType === 'period' && dragIndex === periodIndex}
				draggable="true"
				ondragstart={handleDragStart('period', periodIndex)}
				ondragend={handleDragEnd}
				onpointerdown={handlePointerDown('period', periodIndex)}
				role="button"
				tabindex="0"
				aria-grabbed={dragType === 'period' && dragIndex === periodIndex}
			>
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
						data-drop-target
						data-drop-type="event"
						data-drop-index={eventIndex}
						data-drop-period-id={period.id}
						ondragover={handleDragOver('event', eventIndex, period.id)}
						ondragleave={handleDragLeave}
						ondrop={handleDrop('event', eventIndex, period.id)}
						role="listitem"
					>
						<!-- Event card - draggable -->
						<div
							class="event-wrapper"
							class:dragging={dragType === 'event' &&
								dragIndex === eventIndex &&
								dragPeriodId === period.id}
							draggable="true"
							ondragstart={handleDragStart('event', eventIndex, period.id)}
							ondragend={handleDragEnd}
							onpointerdown={handlePointerDown('event', eventIndex, period.id)}
							role="button"
							tabindex="0"
							aria-grabbed={dragType === 'event' && dragIndex === eventIndex && dragPeriodId === period.id}
						>
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
									data-drop-target
									data-drop-type="scene"
									data-drop-index={sceneIndex}
									data-drop-period-id={period.id}
									data-drop-event-id={event.id}
									draggable="true"
									ondragstart={handleDragStart('scene', sceneIndex, period.id, event.id)}
									ondragover={handleDragOver('scene', sceneIndex, period.id, event.id)}
									ondragleave={handleDragLeave}
									ondrop={handleDrop('scene', sceneIndex, period.id, event.id)}
									ondragend={handleDragEnd}
									onpointerdown={handlePointerDown('scene', sceneIndex, period.id, event.id)}
									role="button"
									tabindex="0"
									aria-grabbed={dragType === 'scene' && dragIndex === sceneIndex && dragPeriodId === period.id && dragEventId === event.id}
								>
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
		cursor: grab;
		touch-action: none;
	}

	.period-section:active {
		cursor: grabbing;
	}

	.period-section.dragging,
	:global(.period-section.dragging) {
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
		cursor: grab;
		touch-action: none;
	}

	.event-wrapper:active {
		cursor: grabbing;
	}

	.event-wrapper.dragging,
	:global(.event-wrapper.dragging) {
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
		cursor: grab;
		touch-action: none;
		transition: transform 0.15s ease;
	}

	.scene-wrapper:active {
		cursor: grabbing;
	}

	.scene-wrapper.drag-over {
		transform: translateY(4px);
	}

	.scene-wrapper.dragging,
	:global(.scene-wrapper.dragging) {
		opacity: 0.5;
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
