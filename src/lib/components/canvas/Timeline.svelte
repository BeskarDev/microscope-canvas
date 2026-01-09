<script lang="ts">
	import type {
		Game,
		Period,
		Event as GameEvent,
		Scene,
		Anchor,
		AnchorPlacement
	} from '$lib/types';
	import PeriodCard from './PeriodCard.svelte';
	import EventCard from './EventCard.svelte';
	import SceneCard from './SceneCard.svelte';
	import AnchorCard from './AnchorCard.svelte';
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
		onSelectAnchor?: (anchor: Anchor) => void;
		cardReorderEnabled?: boolean;
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
		onReorderScenes,
		onSelectAnchor,
		cardReorderEnabled = false
	}: Props = $props();

	// Configuration for dnd-action
	const flipDurationMs = 200;

	// Local state for drag and drop - these are used for the preview during dragging
	let localPeriods = $state<Period[]>([]);
	let localEventsMap = new SvelteMap<string, GameEvent[]>();
	let localScenesMap = new SvelteMap<string, Scene[]>();

	// Hover state for anchor cards
	let hoveredAnchorId = $state<string | null>(null);

	// Sync local state with props
	$effect(() => {
		localPeriods = game.periods;
		// Clear maps when game changes
		localEventsMap.clear();
		localScenesMap.clear();
		// Initialize event and scene maps
		game.periods.forEach((period) => {
			localEventsMap.set(period.id, period.events);
			period.events.forEach((event) => {
				localScenesMap.set(`${period.id}-${event.id}`, event.scenes);
			});
		});
	});

	// Get anchor placements for a specific period, sorted for display:
	// 1. Active anchor always first (leftmost)
	// 2. Then newest to oldest
	function getAnchorPlacementsForPeriod(periodId: string): AnchorPlacement[] {
		if (!game.anchorPlacements) return [];
		const placements = game.anchorPlacements.filter((p) => p.periodId === periodId);

		// Sort: active anchor first, then by creation date (newest first)
		return placements.sort((a, b) => {
			const aIsActive = a.anchorId === game.currentAnchorId;
			const bIsActive = b.anchorId === game.currentAnchorId;

			// Active anchor always comes first
			if (aIsActive && !bIsActive) return -1;
			if (!aIsActive && bIsActive) return 1;

			// Otherwise sort by creation date (newest first)
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}

	// Get anchor by ID
	function getAnchor(anchorId: string): Anchor | undefined {
		if (!game.anchors) return undefined;
		return game.anchors.find((a) => a.id === anchorId);
	}

	// Calculate z-index for an anchor card based on its state
	// Hovered > Active > Left position (leftmost = highest z-index within stack)
	function getAnchorZIndex(
		anchorId: string,
		placementIndex: number,
		totalPlacements: number
	): number {
		const baseZ = 10;
		// Hovered gets highest z-index
		if (hoveredAnchorId === anchorId) {
			return baseZ + totalPlacements + 2;
		}
		// Leftmost cards (lower index) get higher z-index so they overlap cards to the right
		return baseZ + (totalPlacements - placementIndex);
	}

	// Calculate left position for stacking (in pixels before zoom)
	// Cards are distributed across the period width with overlap
	// Period width = 160px, anchor card width = 120px
	function getAnchorLeftPosition(placementIndex: number, totalPlacements: number): number {
		const periodWidth = 160;
		const cardWidth = 120;

		if (totalPlacements === 1) {
			// Single card: centered or slightly to the right
			return (periodWidth - cardWidth) / 2;
		}

		// Multiple cards: distribute across period width
		// Calculate the overlap needed to fit all cards
		const availableWidth = periodWidth - cardWidth;
		const overlapSpace = availableWidth / (totalPlacements - 1);

		return placementIndex * overlapSpace;
	}

	// Handle anchor card click
	function handleAnchorClick(anchor: Anchor) {
		console.log('[Timeline] handleAnchorClick called', {
			anchorName: anchor.name,
			anchorId: anchor.id,
			cardReorderEnabled,
			onSelectAnchor: !!onSelectAnchor
		});
		onSelectAnchor?.(anchor);
	}

	// Handle touch-and-hold for mobile (bring card to front)
	function handleAnchorTouchStart(anchorId: string) {
		hoveredAnchorId = anchorId;
	}

	function handleAnchorTouchEnd() {
		hoveredAnchorId = null;
	}

	// Period drag handlers
	function handlePeriodConsider(
		e: CustomEvent<{ items: Period[]; info: { trigger: string; id: string; source: string } }>
	) {
		const { items } = e.detail;
		// Update local state for drag preview
		localPeriods = items;
	}

	function handlePeriodFinalize(
		e: CustomEvent<{ items: Period[]; info: { trigger: string; id: string; source: string } }>
	) {
		const { items, info } = e.detail;

		// Update local state
		localPeriods = items;

		// Call reorder callback if position changed and it was a pointer drag
		if (info.source === SOURCES.POINTER && onReorderPeriods) {
			// Find the original and new positions by comparing with game.periods
			const originalIndex = game.periods.findIndex((p) => p.id === info.id);
			const newIndex = items.findIndex((p) => p.id === info.id);

			if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
				onReorderPeriods(originalIndex, newIndex);
			}
		}
	}

	// Event drag handlers
	function handleEventConsider(
		periodId: string,
		e: CustomEvent<{ items: GameEvent[]; info: { trigger: string; id: string; source: string } }>
	) {
		const { items } = e.detail;
		// Update local state for drag preview
		localEventsMap.set(periodId, items);
	}

	function handleEventFinalize(
		periodId: string,
		e: CustomEvent<{ items: GameEvent[]; info: { trigger: string; id: string; source: string } }>
	) {
		const { items, info } = e.detail;

		// Update local state
		localEventsMap.set(periodId, items);

		// Call reorder callback if position changed
		if (info.source === SOURCES.POINTER && onReorderEvents) {
			const period = game.periods.find((p) => p.id === periodId);
			if (period) {
				const originalIndex = period.events.findIndex((ev) => ev.id === info.id);
				const newIndex = items.findIndex((ev) => ev.id === info.id);

				if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
					onReorderEvents(periodId, originalIndex, newIndex);
				}
			}
		}
	}

	// Scene drag handlers
	function handleSceneConsider(
		periodId: string,
		eventId: string,
		e: CustomEvent<{ items: Scene[]; info: { trigger: string; id: string; source: string } }>
	) {
		const { items } = e.detail;
		const key = `${periodId}-${eventId}`;
		// Update local state for drag preview
		localScenesMap.set(key, items);
	}

	function handleSceneFinalize(
		periodId: string,
		eventId: string,
		e: CustomEvent<{ items: Scene[]; info: { trigger: string; id: string; source: string } }>
	) {
		const { items, info } = e.detail;
		const key = `${periodId}-${eventId}`;

		// Update local state
		localScenesMap.set(key, items);

		// Call reorder callback if position changed
		if (info.source === SOURCES.POINTER && onReorderScenes) {
			const period = game.periods.find((p) => p.id === periodId);
			const event = period?.events.find((e) => e.id === eventId);

			if (event) {
				const originalIndex = event.scenes.findIndex((s) => s.id === info.id);
				const newIndex = items.findIndex((s) => s.id === info.id);

				if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
					onReorderScenes(periodId, eventId, originalIndex, newIndex);
				}
			}
		}
	}
</script>

<div
	class="timeline"
	style:--card-cursor={cardReorderEnabled ? 'grab' : 'default'}
	style:--card-cursor-active={cardReorderEnabled ? 'grabbing' : 'default'}
>
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
			morphDisabled: false,
			dragDisabled: !cardReorderEnabled
		}}
		onconsider={handlePeriodConsider}
		onfinalize={handlePeriodFinalize}
	>
		{#each localPeriods as period, periodIndex (period.id)}
			{@const periodPlacements = getAnchorPlacementsForPeriod(period.id)}
			<div 
				class="period-wrapper" 
				class:drag-enabled={cardReorderEnabled}
				data-period-id={period.id}
				animate:flip={{ duration: flipDurationMs }}
				onclick={(e) => {
					console.log('[Timeline] period-wrapper onclick', {
						periodId: period.id,
						cardReorderEnabled,
						target: e.target,
						currentTarget: e.currentTarget,
						eventPhase: e.eventPhase
					});
				}}
				onmousedown={(e) => {
					console.log('[Timeline] period-wrapper onmousedown', {
						periodId: period.id,
						cardReorderEnabled,
						button: e.button,
						target: e.target
					});
				}}
				onmouseup={(e) => {
					console.log('[Timeline] period-wrapper onmouseup', {
						periodId: period.id,
						cardReorderEnabled,
						button: e.button,
						target: e.target
					});
				}}
			>
				<div class="period-column">
					<!-- Period card with anchor cards positioned above -->
					<div class="period-section">
						<PeriodCard {period} onclick={() => onSelectPeriod(period)} />

						<!-- Anchor cards stacked above the period card, overlapping top edge -->
						{#if periodPlacements.length > 0}
							<div class="anchor-cards-stack">
								{#each periodPlacements as placement, placementIndex (placement.id)}
									{@const anchor = getAnchor(placement.anchorId)}
									{#if anchor}
										<AnchorCard
											{anchor}
											isActive={game.currentAnchorId === anchor.id}
											isHovered={hoveredAnchorId === anchor.id}
											zIndex={getAnchorZIndex(anchor.id, placementIndex, periodPlacements.length)}
											leftPosition={getAnchorLeftPosition(placementIndex, periodPlacements.length)}
											onclick={() => handleAnchorClick(anchor)}
											onmouseenter={() => (hoveredAnchorId = anchor.id)}
											onmouseleave={() => (hoveredAnchorId = null)}
											ontouchstart={() => handleAnchorTouchStart(anchor.id)}
											ontouchend={handleAnchorTouchEnd}
										/>
									{/if}
								{/each}
							</div>
						{/if}
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
								centreDraggedOnCursor: true,
								dropFromOthersDisabled: true,
								dragDisabled: !cardReorderEnabled
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
										{@const eventScenes =
											localScenesMap.get(`${period.id}-${event.id}`) ?? event.scenes}
										<div
											class="scenes-section"
											use:dndzone={{
												items: eventScenes,
												flipDurationMs,
												type: `scenes-${period.id}-${event.id}`,
												dropTargetStyle: {},
												dropTargetClasses: ['drop-target-scene'],
												centreDraggedOnCursor: true,
												dropFromOthersDisabled: true,
												dragDisabled: !cardReorderEnabled
											}}
											onconsider={(e) => handleSceneConsider(period.id, event.id, e)}
											onfinalize={(e) => handleSceneFinalize(period.id, event.id, e)}
										>
											{#each eventScenes as scene (scene.id)}
												<div class="scene-wrapper" animate:flip={{ duration: flipDurationMs }}>
													<SceneCard
														{scene}
														onclick={() => onSelectScene(period.id, event.id, scene)}
													/>
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
	}

	/* Only apply drag-and-drop restrictions when reordering is enabled */
	.period-wrapper.drag-enabled {
		touch-action: none;
		user-select: none;
	}
	
	/* When drag is disabled, make period wrapper transparent to pointer events
	   but anchor cards will still be clickable via pointer-events: auto */
	.period-wrapper:not(.drag-enabled) {
		pointer-events: none;
	}
	
	/* Re-enable pointer events on child elements when drag is disabled */
	.period-wrapper:not(.drag-enabled) > .period-column {
		pointer-events: auto;
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
		cursor: var(--card-cursor, default);
	}

	.period-section:active {
		cursor: var(--card-cursor-active, default);
	}

	/* Anchor cards positioned ABOVE the period card, overlapping the top edge */
	.anchor-cards-stack {
		position: absolute;
		/* Position above period card - anchor cards overlap top edge by ~30% */
		top: calc(-24px * max(var(--canvas-zoom, 1), 1));
		left: 0;
		/* Match period card width (160px) */
		width: calc(160px * max(var(--canvas-zoom, 1), 1));
		height: calc(32px * max(var(--canvas-zoom, 1), 1));
		pointer-events: none;
	}

	/* Anchor cards are positioned absolutely within the stack */
	.anchor-cards-stack :global([data-card='anchor']) {
		pointer-events: auto;
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
		cursor: var(--card-cursor, default);
	}

	.event-wrapper:active {
		cursor: var(--card-cursor-active, default);
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
		cursor: var(--card-cursor, default);
		/* Allow drag-and-drop to work from anywhere on the card */
		touch-action: none;
		user-select: none;
	}

	.scene-wrapper:active {
		cursor: var(--card-cursor-active, default);
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
	:global([aria-grabbed='true']) {
		opacity: 0.5;
		cursor: grabbing;
	}

	/* Ensure items being dragged reset properly */
	:global(.event-column:not([aria-grabbed='true'])) {
		opacity: 1;
		transform: none;
	}

	:global(.period-wrapper:not([aria-grabbed='true'])) {
		opacity: 1;
		transform: none;
	}

	:global(.scene-wrapper:not([aria-grabbed='true'])) {
		opacity: 1;
		transform: none;
	}
</style>
