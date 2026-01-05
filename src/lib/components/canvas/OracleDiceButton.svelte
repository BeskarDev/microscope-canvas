<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Dices from 'lucide-svelte/icons/dices';
	import { generateOracleResult, type OracleCategory } from '$lib/utils/oracle/index';

	interface Props {
		category: OracleCategory;
		onResult: (result: string) => void;
		title?: string;
	}

	let { category, onResult, title }: Props = $props();

	function handleClick() {
		const result = generateOracleResult(category);
		onResult(result);
	}

	const defaultTitle = 'Generate random suggestion';
</script>

<Button
	variant="ghost"
	size="icon"
	class="oracle-dice-btn"
	onclick={handleClick}
	title={title ?? defaultTitle}
	type="button"
>
	<Dices class="h-4 w-4" />
</Button>

<style>
	:global(.oracle-dice-btn) {
		width: 2rem;
		height: 2rem;
		color: var(--color-muted-foreground);
		flex-shrink: 0;
	}

	:global(.oracle-dice-btn:hover) {
		color: var(--color-primary);
		background-color: oklch(from var(--color-primary) l c h / 0.1);
	}
</style>
