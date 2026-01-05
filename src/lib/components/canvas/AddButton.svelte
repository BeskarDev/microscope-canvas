<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';

	interface Props {
		label: string;
		onclick: () => void;
		orientation?: 'horizontal' | 'vertical';
	}

	let { label, onclick, orientation = 'vertical' }: Props = $props();
</script>

<button
	type="button"
	class="add-button"
	class:horizontal={orientation === 'horizontal'}
	class:vertical={orientation === 'vertical'}
	{onclick}
	aria-label={label}
	title={label}
>
	<Plus class="add-icon" />
</button>

<style>
	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
		border: 2px dashed var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			transform 0.15s ease;
		color: var(--color-muted-foreground);
		flex-shrink: 0;
	}

	.add-button.horizontal {
		width: calc(40px * max(var(--canvas-zoom, 1), 1));
		height: calc(100px * max(var(--canvas-zoom, 1), 1));
		margin: 0 calc(0.5rem * max(var(--canvas-zoom, 1), 1));
	}

	.add-button.vertical {
		width: 100%;
		height: calc(32px * max(var(--canvas-zoom, 1), 1));
		margin: calc(0.5rem * max(var(--canvas-zoom, 1), 1)) 0;
	}

	.add-button:hover {
		background-color: oklch(from var(--color-primary) l c h / 0.1);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.add-button:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.add-button:active {
		transform: scale(0.95);
	}

	.add-button :global(.add-icon) {
		width: calc(1.25rem * max(var(--canvas-zoom, 1), 1));
		height: calc(1.25rem * max(var(--canvas-zoom, 1), 1));
	}
</style>
