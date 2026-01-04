<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		zoom?: number;
		children: Snippet;
	}

	let { zoom = 1, children }: Props = $props();

	let containerRef = $state<HTMLDivElement | null>(null);
	let isPanning = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let startPanX = $state(0);
	let startPanY = $state(0);

	// Internal pan state - start with some offset to show content centered
	let internalPanX = $state(50);
	let internalPanY = $state(50);

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
	role="application"
	aria-label="Timeline canvas"
	tabindex="0"
>
	<div
		class="canvas-content"
		style:transform="translate({internalPanX}px, {internalPanY}px) scale({zoom})"
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
