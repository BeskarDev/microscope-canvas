<script lang="ts">
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';
	import {
		Canvas,
		Timeline,
		ZoomControls
	} from '$lib/components/canvas';
	import type { Game, Period, Event as GameEvent, Scene, Anchor } from '$lib/types';

	interface Props {
		isLoading: boolean;
		loadError: string | null;
		game: Game | null;
		isViewingHistory: boolean;
		historicalGame: Game | null;
		zoom: number;
		minZoom: number;
		maxZoom: number;
		cardReorderEnabled: boolean;
		onFetchGame: () => void;
		onZoomChange: (zoom: number) => void;
		onZoomIn: () => void;
		onZoomOut: () => void;
		onZoomReset: () => void;
		onResetPosition: () => void;
		onToggleCardReorder: () => void;
		onAddPeriod: (index: number) => void;
		onAddEvent: (periodId: string) => void;
		onAddScene: (periodId: string, eventId: string) => void;
		onSelectPeriod: (period: Period) => void;
		onSelectEvent: (periodId: string, event: GameEvent) => void;
		onSelectScene: (periodId: string, eventId: string, scene: Scene) => void;
		onSelectAnchor: (anchor: Anchor) => void;
		onReorderPeriods: (fromIndex: number, toIndex: number) => void;
		onReorderEvents: (periodId: string, fromIndex: number, toIndex: number) => void;
		onReorderScenes: (periodId: string, eventId: string, fromIndex: number, toIndex: number) => void;
		canvasRef?: { resetPosition: () => void } | null;
		historicalCanvasRef?: { resetPosition: () => void } | null;
	}

	let {
		isLoading,
		loadError,
		game,
		isViewingHistory,
		historicalGame,
		zoom,
		minZoom,
		maxZoom,
		cardReorderEnabled,
		onFetchGame,
		onZoomChange,
		onZoomIn,
		onZoomOut,
		onZoomReset,
		onResetPosition,
		onToggleCardReorder,
		onAddPeriod,
		onAddEvent,
		onAddScene,
		onSelectPeriod,
		onSelectEvent,
		onSelectScene,
		onSelectAnchor,
		onReorderPeriods,
		onReorderEvents,
		onReorderScenes,
		canvasRef = $bindable(null),
		historicalCanvasRef = $bindable(null)
	}: Props = $props();

	const homeUrl = resolve('/');
</script>

<div class="canvas-area" class:historical-view={isViewingHistory}>
	{#if isLoading}
		<div class="loading-state">
			<Loader2 class="h-12 w-12 animate-spin" />
			<p class="loading-text">Loading history...</p>
		</div>
	{:else if loadError}
		<div class="error-state">
			<AlertTriangle class="h-12 w-12 error-icon" />
			<h2 class="error-title">Unable to Load History</h2>
			<p class="error-text">{loadError}</p>
			<div class="error-actions">
				<Button onclick={onFetchGame} variant="secondary">Try Again</Button>
				<a href={homeUrl}>
					<Button variant="default">Return Home</Button>
				</a>
			</div>
		</div>
	{:else if isViewingHistory && historicalGame}
		<!-- Historical view (read-only) -->
		<Canvas
			bind:this={historicalCanvasRef}
			{zoom}
			onZoomChange={onZoomChange}
		>
			<Timeline
				game={historicalGame}
				onAddPeriod={() => {}}
				onAddEvent={() => {}}
				onAddScene={() => {}}
				onSelectPeriod={() => {}}
				onSelectEvent={() => {}}
				onSelectScene={() => {}}
				cardReorderEnabled={false}
			/>
		</Canvas>

		<!-- Historical view overlay -->
		<div class="historical-overlay">
			<span class="historical-label">Read-Only Historical View</span>
		</div>

		<!-- Zoom controls -->
		<div class="zoom-controls-container">
			<ZoomControls
				{zoom}
				minZoom={minZoom}
				maxZoom={maxZoom}
				onZoomIn={onZoomIn}
				onZoomOut={onZoomOut}
				onReset={onZoomReset}
				onResetPosition={onResetPosition}
			/>
		</div>
	{:else if game}
		<Canvas bind:this={canvasRef} {zoom} onZoomChange={onZoomChange}>
			<Timeline
				{game}
				onAddPeriod={onAddPeriod}
				onAddEvent={onAddEvent}
				onAddScene={onAddScene}
				onSelectPeriod={onSelectPeriod}
				onSelectEvent={onSelectEvent}
				onSelectScene={onSelectScene}
				onSelectAnchor={onSelectAnchor}
				onReorderPeriods={onReorderPeriods}
				onReorderEvents={onReorderEvents}
				onReorderScenes={onReorderScenes}
				{cardReorderEnabled}
			/>
		</Canvas>

		<!-- Zoom controls -->
		<div class="zoom-controls-container">
			<ZoomControls
				{zoom}
				minZoom={minZoom}
				maxZoom={maxZoom}
				onZoomIn={onZoomIn}
				onZoomOut={onZoomOut}
				onReset={onZoomReset}
				onResetPosition={onResetPosition}
				{cardReorderEnabled}
				onToggleCardReorder={onToggleCardReorder}
			/>
		</div>
	{/if}
</div>

<style>
	.canvas-area {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.canvas-area.historical-view {
		background-color: oklch(from var(--color-background) calc(l + 0.03) c h);
	}

	.historical-overlay {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		padding: 0.5rem 1rem;
		background-color: oklch(45% 0.15 50 / 0.9);
		color: white;
		border-radius: var(--radius);
		font-size: 0.875rem;
		font-weight: 500;
		pointer-events: none;
	}

	.historical-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.loading-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.loading-state :global(svg) {
		color: var(--color-primary);
	}

	.loading-text {
		color: var(--color-muted-foreground);
	}

	.error-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
	}

	.error-state > div {
		max-width: 400px;
		padding: 2rem;
		border: 1px solid var(--color-destructive);
		border-radius: var(--radius);
		background-color: oklch(from var(--color-destructive) l c h / 0.1);
	}

	.error-state :global(.error-icon) {
		color: var(--color-destructive);
		margin-bottom: 1rem;
	}

	.error-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-foreground);
		margin-bottom: 0.5rem;
	}

	.error-text {
		color: var(--color-muted-foreground);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.error-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.zoom-controls-container {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 10;
	}

	/* Animation for spinner */
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 640px) {
		.zoom-controls-container {
			bottom: 0.5rem;
			right: 0.5rem;
		}

		.error-actions {
			flex-direction: column;
			width: 100%;
		}

		.error-actions :global(button),
		.error-actions :global(a) {
			width: 100%;
		}
	}
</style>
