<script lang="ts">
	import HelpCircle from 'lucide-svelte/icons/help-circle';
	import Compass from 'lucide-svelte/icons/compass';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { resolve } from '$app/paths';

	let helpOpen = $state(false);

	const homeUrl = resolve('/');
</script>

<header class="header">
	<div class="header-content">
		<a href={homeUrl} class="logo-link">
			<Compass class="logo-icon" />
			<span class="logo-text">Microscope Canvas</span>
		</a>

		<Dialog.Root bind:open={helpOpen}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="ghost" size="icon" aria-label="Help">
						<HelpCircle class="h-5 w-5" />
					</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content class="help-dialog-content">
				<Dialog.Header>
					<Dialog.Title>Help & Guide</Dialog.Title>
					<Dialog.Description>Learn about Microscope and how to use this app</Dialog.Description>
				</Dialog.Header>

				<div class="help-content">
					<section class="help-section">
						<h3>What is Microscope?</h3>
						<p>
							Microscope is a collaborative worldbuilding game where you create the epic history of
							a fictional civilization. You explore themes, eras, and key events without worrying
							about a detailed timeline—history is yours to create.
						</p>
					</section>

					<section class="help-section">
						<h3>Core Concepts</h3>
						<ul>
							<li>
								<strong>Periods</strong> — Large spans of time (eras, ages) that define major phases of
								your history. They can be Light (positive) or Dark (negative).
							</li>
							<li>
								<strong>Events</strong> — Significant occurrences within a Period. Events shape the narrative
								and can also be Light or Dark.
							</li>
							<li>
								<strong>Scenes</strong> — Specific moments within Events where you explore details, conversations,
								and turning points.
							</li>
							<li>
								<strong>Focus</strong> — A theme or element the current player wants to explore, guiding
								the direction of play.
							</li>
							<li>
								<strong>Legacy</strong> — A recurring element (character, place, organization) that persists
								through history.
							</li>
						</ul>
					</section>

					<section class="help-section">
						<h3>Using This App</h3>
						<ul>
							<li>
								<strong>Create a Game</strong> — Start a new Microscope history from the home screen.
							</li>
							<li>
								<strong>Navigate the Canvas</strong> — Pan by dragging the background. Use zoom controls
								or pinch gestures for overview.
							</li>
							<li>
								<strong>Add Content</strong> — Click (+) buttons to add Periods, Events, or Scenes at
								specific locations.
							</li>
							<li>
								<strong>Edit Cards</strong> — Click any card to view and edit its details, tone, and notes.
							</li>
							<li>
								<strong>Undo/Redo</strong> — Use the undo/redo buttons or Ctrl+Z / Ctrl+Shift+Z to revert
								changes.
							</li>
							<li>
								<strong>Publish Version</strong> — Click "Publish Version" to save a named checkpoint
								in your history.
							</li>
							<li>
								<strong>Export/Import</strong> — Save your history as JSON (for backup) or Markdown (for
								reading). Import JSON files to restore backups.
							</li>
						</ul>
					</section>

					<section class="help-section">
						<h3>Canvas Interactions</h3>
						<ul>
							<li>
								<strong>Pan</strong> — Click and drag the background to move around.
							</li>
							<li>
								<strong>Zoom</strong> — Use the (+) and (−) buttons, scroll wheel, or pinch gestures.
							</li>
							<li>
								<strong>Select</strong> — Click a card to select and view/edit it.
							</li>
							<li>
								<strong>Touch</strong> — All interactions work with touch on mobile devices.
							</li>
						</ul>
					</section>

					<section class="help-section">
						<h3>Keyboard Shortcuts</h3>
						<ul>
							<li>
								<strong>Ctrl+Z</strong> — Undo the last action.
							</li>
							<li>
								<strong>Ctrl+Shift+Z / Ctrl+Y</strong> — Redo an undone action.
							</li>
							<li>
								<strong>Escape</strong> — Close dialogs and deselect items.
							</li>
							<li>
								<strong>Tab</strong> — Navigate between interactive elements.
							</li>
						</ul>
					</section>

					<section class="help-section">
						<h3>Data & Privacy</h3>
						<p>
							All your data is stored locally in your browser. Nothing is sent to any server. You
							can export your games as JSON files for backup or to transfer between devices.
						</p>
					</section>
				</div>

				<Dialog.Footer>
					<Button onclick={() => (helpOpen = false)}>Close</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 40;
		width: 100%;
		border-bottom: 1px solid var(--color-border);
		background-color: oklch(8% 0.02 265 / 0.8);
		backdrop-filter: blur(12px);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.75rem 1rem;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--color-foreground);
		transition: opacity 0.2s;
	}

	.logo-link:hover {
		opacity: 0.8;
	}

	.logo-link :global(.logo-icon) {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--color-primary);
	}

	.logo-text {
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.025em;
	}

	.help-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem 0;
	}

	.help-section h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--color-foreground);
	}

	.help-section p {
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--color-muted-foreground);
	}

	.help-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.help-section li {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-muted-foreground);
		padding-left: 1rem;
		position: relative;
	}

	.help-section li::before {
		content: '•';
		position: absolute;
		left: 0;
		color: var(--color-primary);
	}

	.help-section li strong {
		color: var(--color-foreground);
	}

	/* Help dialog responsive sizing */
	:global(.help-dialog-content) {
		max-height: calc(100vh - 2rem);
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.help-dialog-content) .help-content {
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	@media (max-width: 640px) {
		.logo-text {
			font-size: 1rem;
		}

		.header-content {
			padding: 0.5rem 0.75rem;
		}
	}
</style>
