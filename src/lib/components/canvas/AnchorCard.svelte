<script lang="ts">
	import type { Anchor } from '$lib/types';
	import Anchor2 from 'lucide-svelte/icons/anchor';

	interface Props {
		anchor: Anchor;
		isActive?: boolean;
		isHovered?: boolean;
		zIndex?: number;
		leftPosition?: number; // Left position for stacking (in px, before zoom)
		onclick?: () => void;
		onmouseenter?: () => void;
		onmouseleave?: () => void;
		ontouchstart?: () => void;
		ontouchend?: () => void;
	}

	let {
		anchor,
		isActive = false,
		isHovered = false,
		zIndex = 1,
		leftPosition = 0,
		onclick,
		onmouseenter,
		onmouseleave,
		ontouchstart,
		ontouchend
	}: Props = $props();

	// Touch-and-hold handling for mobile
	let touchTimeout: ReturnType<typeof setTimeout> | null = null;
	
	function handleTouchStart() {
		// Start a timer for touch-and-hold (bring to front after 200ms)
		touchTimeout = setTimeout(() => {
			ontouchstart?.();
		}, 200);
	}
	
	function handleTouchEnd() {
		if (touchTimeout) {
			clearTimeout(touchTimeout);
			touchTimeout = null;
		}
		ontouchend?.();
	}

	// Ripple animation state
	let showRipple = $state(false);
	let rippleTimeout: ReturnType<typeof setTimeout> | null = null;

	// Handle click - show ripple and call onclick
	function handleClick(e?: MouseEvent) {
		console.log('[AnchorCard] handleClick called', {
			anchorName: anchor.name,
			event: e,
			target: e?.target,
			currentTarget: e?.currentTarget,
			eventPhase: e?.eventPhase,
			bubbles: e?.bubbles,
			cancelable: e?.cancelable,
			defaultPrevented: e?.defaultPrevented
		});
		
		// Trigger ripple animation
		showRipple = true;
		console.log('[AnchorCard] Ripple triggered');
		
		// Clear any existing timeout
		if (rippleTimeout) {
			clearTimeout(rippleTimeout);
		}
		
		// Hide ripple after animation completes
		rippleTimeout = setTimeout(() => {
			showRipple = false;
			rippleTimeout = null;
		}, 600);
		
		if (onclick) {
			console.log('[AnchorCard] Calling onclick callback');
			onclick();
		} else {
			console.log('[AnchorCard] No onclick callback provided');
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	class="anchor-card"
	class:active={isActive}
	class:hovered={isHovered}
	data-card="anchor"
	data-anchor-id={anchor.id}
	data-anchor-name={anchor.name}
	style:--card-left="{leftPosition}px"
	style:z-index={zIndex}
	onclick={(e) => {
		console.log('[AnchorCard DIV] onclick event fired', {
			anchorName: anchor.name,
			event: e,
			target: e.target,
			currentTarget: e.currentTarget
		});
		handleClick(e);
	}}
	onmousedown={(e) => {
		console.log('[AnchorCard DIV] onmousedown event fired', {
			anchorName: anchor.name,
			button: e.button,
			buttons: e.buttons,
			target: e.target
		});
	}}
	onmouseup={(e) => {
		console.log('[AnchorCard DIV] onmouseup event fired', {
			anchorName: anchor.name,
			button: e.button,
			target: e.target
		});
	}}
	{onmouseenter}
	{onmouseleave}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick?.();
		}
	}}
>
	<Anchor2 class="anchor-icon" />
	<div class="anchor-content">
		<h3 class="card-title">{anchor.name}</h3>
	</div>
	{#if isActive}
		<span class="active-dot"></span>
	{/if}
	{#if showRipple}
		<span class="ripple"></span>
	{/if}
</div>

<style>
	.anchor-card {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
		/* Compact landscape card that fits within period width */
		width: calc(120px * max(var(--canvas-zoom, 1), 1));
		height: calc(32px * max(var(--canvas-zoom, 1), 1));
		padding: calc(0.25rem * max(var(--canvas-zoom, 1), 1)) calc(0.375rem * max(var(--canvas-zoom, 1), 1));
		font-size: calc(1rem * max(var(--canvas-zoom, 1), 1));
		/* Solid background - not transparent */
		background-color: oklch(20% 0.02 50);
		/* Distinct warm/golden border for anchor cards */
		border: 1px solid oklch(65% 0.18 50 / 0.6);
		border-left: calc(2px * max(var(--canvas-zoom, 1), 1)) solid oklch(65% 0.18 50);
		border-radius: calc(0.25rem * max(var(--canvas-zoom, 1), 1));
		box-shadow:
			0 2px 4px -1px oklch(0% 0 0 / 0.3),
			0 1px 2px -1px oklch(0% 0 0 / 0.2);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
		text-align: left;
		color: var(--color-card-foreground);
		pointer-events: auto;
		position: absolute;
		/* Position using left instead of transform for stacking */
		left: calc(var(--card-left, 0px) * max(var(--canvas-zoom, 1), 1));
		top: 0;
		overflow: hidden; /* Contain ripple effect */
	}

	.anchor-card:hover,
	.anchor-card.hovered {
		transform: translateY(-2px);
		box-shadow:
			0 6px 10px -2px oklch(0% 0 0 / 0.35),
			0 3px 5px -2px oklch(0% 0 0 / 0.25);
		border-color: oklch(65% 0.18 50);
	}

	.anchor-card:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.anchor-card.active {
		background-color: oklch(25% 0.04 50);
		border-color: oklch(65% 0.18 50);
		box-shadow:
			0 0 0 1px oklch(65% 0.18 50 / 0.4),
			0 2px 4px -1px oklch(65% 0.18 50 / 0.3);
	}

	.anchor-card :global(.anchor-icon) {
		flex-shrink: 0;
		width: calc(0.75rem * max(var(--canvas-zoom, 1), 1));
		height: calc(0.75rem * max(var(--canvas-zoom, 1), 1));
		color: oklch(65% 0.18 50);
	}

	.anchor-content {
		flex: 1;
		min-width: 0; /* Allow text truncation */
		display: flex;
		align-items: center;
	}

	.card-title {
		font-size: calc(0.625rem * max(var(--canvas-zoom, 1), 1));
		font-weight: 600;
		margin: 0;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.active-dot {
		flex-shrink: 0;
		display: block;
		width: calc(0.375rem * max(var(--canvas-zoom, 1), 1));
		height: calc(0.375rem * max(var(--canvas-zoom, 1), 1));
		background-color: oklch(65% 0.18 50);
		border-radius: 50%;
		box-shadow: 0 0 0 calc(0.125rem * max(var(--canvas-zoom, 1), 1)) oklch(65% 0.18 50 / 0.3);
	}

	/* Ripple animation for click feedback */
	.ripple {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background-color: oklch(65% 0.18 50 / 0.4);
		transform: translate(-50%, -50%);
		animation: ripple-animation 0.6s ease-out;
		pointer-events: none;
	}

	@keyframes ripple-animation {
		0% {
			width: 0;
			height: 0;
			opacity: 1;
		}
		100% {
			width: 200%;
			height: 200%;
			opacity: 0;
		}
	}
</style>
