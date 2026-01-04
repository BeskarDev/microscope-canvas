<script lang="ts">
	import type { Tone } from '$lib/types';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	interface Props {
		value: Tone;
		onchange: (tone: Tone) => void;
	}

	let { value, onchange }: Props = $props();

	function toggle() {
		onchange(value === 'light' ? 'dark' : 'light');
	}
</script>

<button type="button" class="tone-toggle" class:light={value === 'light'} onclick={toggle}>
	<span class="toggle-option" class:active={value === 'light'}>
		<Sun class="toggle-icon" />
		<span>Light</span>
	</span>
	<span class="toggle-option" class:active={value === 'dark'}>
		<Moon class="toggle-icon" />
		<span>Dark</span>
	</span>
</button>

<style>
	.tone-toggle {
		display: flex;
		width: 100%;
		padding: 0.25rem;
		background-color: var(--color-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
	}

	.toggle-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: calc(var(--radius) - 4px);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-muted-foreground);
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.toggle-option.active {
		background-color: var(--color-background);
		color: var(--color-foreground);
	}

	.toggle-option :global(.toggle-icon) {
		width: 1rem;
		height: 1rem;
	}

	.tone-toggle.light .toggle-option.active :global(.toggle-icon) {
		color: oklch(80% 0.15 90);
	}

	.tone-toggle:not(.light) .toggle-option.active :global(.toggle-icon) {
		color: oklch(60% 0.1 265);
	}
</style>
