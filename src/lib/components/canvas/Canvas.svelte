<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		zoom?: number;
		onZoomChange?: (newZoom: number) => void;
		onResetPosition?: () => void;
		children: Snippet;
	}

	let { zoom = 1, onZoomChange, children }: Props = $props();

	let containerRef = $state<HTMLDivElement | null>(null);
	let isPanning = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let startPanX = $state(0);
	let startPanY = $state(0);

	// Internal pan state - start with some offset to show content centered
	let internalPanX = $state(50);
	let internalPanY = $state(50);

	// Default position values
	const DEFAULT_PAN_X = 50;
	const DEFAULT_PAN_Y = 50;

	// Export method to reset position
	export function resetPosition() {
		internalPanX = DEFAULT_PAN_X;
		internalPanY = DEFAULT_PAN_Y;
	}

	// For zooming, we use CSS custom property --canvas-zoom for all sizing.
	// This avoids blurry text/elements when scaling above 100%.
	// At 100% zoom, --canvas-zoom = 1, and all card sizes use this as a multiplier.
	// CSS scale() is only used for values <1 (zoom out), keeping content crisp at larger sizes.
	// For zoom >1, we use --canvas-zoom to increase actual element sizes (no scale transform).
	const effectiveScale = $derived(zoom <= 1 ? zoom : 1);

	function handlePointerDown(e: PointerEvent) {
		// Only pan if it's a left click
		if (e.button !== 0) return;

		const target = e.target as HTMLElement;
		// Don't pan if clicking on a button or card
		if (target.closest('button') || target.closest('[data-card]')) {
			return;
		}

		isPanning = true;
		startX = e.clientX;
		startY = e.clientY;
		startPanX = internalPanX;
		startPanY = internalPanY;

		containerRef?.setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isPanning) return;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		internalPanX = startPanX + dx;
		internalPanY = startPanY + dy;
	}

	function handlePointerUp(e: PointerEvent) {
		if (isPanning) {
			isPanning = false;
			containerRef?.releasePointerCapture(e.pointerId);
		}
	}

	// Handle escape to stop panning
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isPanning) {
			isPanning = false;
			internalPanX = startPanX;
			internalPanY = startPanY;
		}
	}

	// Handle wheel zoom
	function handleWheel(e: WheelEvent) {
		// Only handle vertical scroll for zoom
		if (e.deltaY === 0) return;

		e.preventDefault();

		if (!onZoomChange) return;

		// Determine zoom direction
		const zoomIn = e.deltaY < 0;
		const ZOOM_LEVELS = [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25];
		const currentIndex = ZOOM_LEVELS.indexOf(zoom);

		if (currentIndex === -1) return;

		if (zoomIn && currentIndex > 0) {
			onZoomChange(ZOOM_LEVELS[currentIndex - 1]);
		} else if (!zoomIn && currentIndex < ZOOM_LEVELS.length - 1) {
			onZoomChange(ZOOM_LEVELS[currentIndex + 1]);
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={containerRef}
	class="canvas-viewport"
	class:panning={isPanning}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onwheel={handleWheel}
	role="application"
	aria-label="Timeline canvas"
	tabindex="0"
>
	<div
		class="canvas-content"
		style:--canvas-zoom={zoom}
		style:transform="translate({internalPanX}px, {internalPanY}px) scale({effectiveScale})"
	>
		{@render children()}
	</div>
</div>

<style>
	.canvas-viewport {
		position: absolute;
		inset: 0;
		overflow: hidden;
		cursor: grab;
		touch-action: none;
	}

	.canvas-viewport.panning {
		cursor: grabbing;
		user-select: none;
	}

	.canvas-viewport:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: -2px;
	}

	.canvas-content {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: 0 0;
		will-change: transform;
	}
</style>
