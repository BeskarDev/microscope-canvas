<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import {
		generateHistorySeed,
		generateFocus,
		generatePaletteElement,
		generateSceneQuestion,
		generateLegacy,
		generateNameInspiration
	} from '$lib/utils/oracle';
	import Dices from 'lucide-svelte/icons/dices';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import { toast } from 'svelte-sonner';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}

	let { open, onOpenChange }: Props = $props();

	type OracleTab = 'seed' | 'focus' | 'palette' | 'scene' | 'legacy' | 'name';
	let activeTab = $state<OracleTab>('seed');
	let result = $state('');
	let resultTone = $state<'light' | 'dark' | null>(null);
	let copiedIndex = $state<number | null>(null);
	let history = $state<Array<{ text: string; tone?: 'light' | 'dark' }>>([]);

	function generateResult() {
		let newResult: string;
		let tone: 'light' | 'dark' | null = null;

		switch (activeTab) {
			case 'seed':
				newResult = generateHistorySeed();
				break;
			case 'focus':
				newResult = generateFocus();
				break;
			case 'palette': {
				const paletteResult = generatePaletteElement();
				newResult = paletteResult.text;
				tone = paletteResult.tone;
				break;
			}
			case 'scene':
				newResult = generateSceneQuestion();
				break;
			case 'legacy':
				newResult = generateLegacy();
				break;
			case 'name':
				newResult = generateNameInspiration();
				break;
			default:
				newResult = generateHistorySeed();
		}

		result = newResult;
		resultTone = tone;

		// Add to history (most recent first, limit to 10)
		history = [{ text: newResult, tone: tone ?? undefined }, ...history.slice(0, 9)];
	}

	function handleTabChange(tab: OracleTab) {
		activeTab = tab;
		result = '';
		resultTone = null;
	}

	async function copyToClipboard(text: string, index?: number) {
		try {
			await navigator.clipboard.writeText(text);
			if (index !== undefined) {
				copiedIndex = index;
				setTimeout(() => {
					copiedIndex = null;
				}, 1500);
			}
			toast.success('Copied to clipboard');
		} catch {
			toast.error('Failed to copy');
		}
	}

	// Generate initial result when tab changes or dialog opens
	$effect(() => {
		if (open && !result) {
			generateResult();
		}
	});

	// Reset when dialog closes
	$effect(() => {
		if (!open) {
			result = '';
			resultTone = null;
			history = [];
			activeTab = 'seed';
		}
	});

	const tabs: { id: OracleTab; label: string; description: string }[] = [
		{ id: 'seed', label: 'History Seed', description: 'Get inspiration for your next period or event' },
		{ id: 'name', label: 'Name', description: 'Generate evocative names' },
		{ id: 'focus', label: 'Focus', description: 'Suggest a theme to explore' },
		{ id: 'palette', label: 'Palette', description: 'Generate Yes/No palette elements' },
		{ id: 'scene', label: 'Scene Question', description: 'Get a question for your scene' },
		{ id: 'legacy', label: 'Legacy', description: 'Suggest a recurring element' }
	];
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="oracle-dialog">
		<Dialog.Header>
			<Dialog.Title class="oracle-title">
				<Dices class="h-5 w-5" />
				<span>Oracle</span>
			</Dialog.Title>
			<Dialog.Description>
				Generate random prompts to inspire your solo Microscope game
			</Dialog.Description>
		</Dialog.Header>

		<div class="oracle-content">
			<!-- Tab navigation -->
			<div class="tab-list" role="tablist">
				{#each tabs as tab (tab.id)}
					<button
						role="tab"
						class="tab-button"
						class:active={activeTab === tab.id}
						aria-selected={activeTab === tab.id}
						onclick={() => handleTabChange(tab.id)}
					>
						{tab.label}
					</button>
				{/each}
			</div>

			<!-- Result display -->
			<div class="result-section">
				<p class="tab-description">{tabs.find((t) => t.id === activeTab)?.description}</p>

				{#if result}
					<div class="result-card" class:light={resultTone === 'light'} class:dark={resultTone === 'dark'}>
						{#if resultTone}
							<span class="tone-indicator" title={resultTone === 'light' ? 'Light tone' : 'Dark tone'}>
								{#if resultTone === 'light'}
									<Sun class="h-4 w-4" />
								{:else}
									<Moon class="h-4 w-4" />
								{/if}
							</span>
						{/if}
						<p class="result-text">{result}</p>
						<Button
							variant="ghost"
							size="icon"
							class="copy-btn"
							onclick={() => copyToClipboard(result)}
							title="Copy to clipboard"
						>
							<Copy class="h-4 w-4" />
						</Button>
					</div>
				{/if}

				<Button onclick={generateResult} class="generate-btn">
					<RefreshCw class="h-4 w-4" />
					Generate Another
				</Button>
			</div>

			<!-- History -->
			{#if history.length > 1}
				<div class="history-section">
					<h4 class="history-title">Previous Results</h4>
					<div class="history-list">
						{#each history.slice(1) as item, index (index)}
							<div class="history-item" class:light={item.tone === 'light'} class:dark={item.tone === 'dark'}>
								{#if item.tone}
									<span class="tone-indicator small" title={item.tone === 'light' ? 'Light' : 'Dark'}>
										{#if item.tone === 'light'}
											<Sun class="h-3 w-3" />
										{:else}
											<Moon class="h-3 w-3" />
										{/if}
									</span>
								{/if}
								<span class="history-text">{item.text}</span>
								<Button
									variant="ghost"
									size="icon"
									class="copy-btn small"
									onclick={() => copyToClipboard(item.text, index)}
									title="Copy to clipboard"
								>
									{#if copiedIndex === index}
										<Check class="h-3 w-3" />
									{:else}
										<Copy class="h-3 w-3" />
									{/if}
								</Button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="secondary" onclick={() => onOpenChange(false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.oracle-dialog) {
		max-width: 550px;
		max-height: calc(100vh - 2rem);
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
	}

	:global(.oracle-title) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.oracle-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem 0;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
		padding-right: 0.75rem;
	}

	.tab-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.tab-button {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-muted-foreground);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	.tab-button:hover {
		background-color: var(--color-muted);
		color: var(--color-foreground);
	}

	.tab-button.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.result-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tab-description {
		font-size: 0.8125rem;
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.result-card {
		position: relative;
		padding: 1rem;
		padding-right: 2.5rem;
		background-color: var(--color-muted);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}

	.result-card.light {
		border-left: 3px solid var(--color-light);
	}

	.result-card.dark {
		border-left: 3px solid var(--color-dark);
	}

	.result-text {
		font-size: 1rem;
		line-height: 1.5;
		margin: 0;
		color: var(--color-foreground);
	}

	.tone-indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-right: 0.5rem;
		color: var(--color-muted-foreground);
	}

	.tone-indicator.small {
		margin-right: 0.25rem;
	}

	.result-card :global(.copy-btn) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 1.75rem;
		height: 1.75rem;
		color: var(--color-muted-foreground);
	}

	.result-card :global(.copy-btn:hover) {
		color: var(--color-foreground);
	}

	:global(.generate-btn) {
		align-self: flex-start;
	}

	.history-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
	}

	.history-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.history-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background-color: oklch(from var(--color-muted) l c h / 0.5);
		border-radius: var(--radius);
		font-size: 0.8125rem;
	}

	.history-item.light {
		border-left: 2px solid var(--color-light);
	}

	.history-item.dark {
		border-left: 2px solid var(--color-dark);
	}

	.history-text {
		flex: 1;
		color: var(--color-muted-foreground);
	}

	.history-item :global(.copy-btn.small) {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--color-muted-foreground);
	}

	@media (max-width: 640px) {
		:global(.oracle-dialog) {
			max-width: calc(100vw - 2rem);
		}

		.tab-button {
			font-size: 0.75rem;
			padding: 0.25rem 0.5rem;
		}
	}
</style>
