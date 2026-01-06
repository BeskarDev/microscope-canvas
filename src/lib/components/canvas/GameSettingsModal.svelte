<script lang="ts">
import type { Game, BigPicture } from '$lib/types';
import * as Dialog from '$lib/components/ui/dialog';
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Textarea } from '$lib/components/ui/textarea';
import OracleDiceButton from './OracleDiceButton.svelte';

interface Props {
open: boolean;
onOpenChange: (open: boolean) => void;
game: Game | null;
onSave: (updates: Partial<Game>) => void;
}

let { open, onOpenChange, game, onSave }: Props = $props();

// Local form state
let name = $state('');
let bigPicture = $state('');
let nameError = $state<string | null>(null);

// Sync form state when game changes
$effect(() => {
if (game) {
name = game.name;
bigPicture = game.bigPicture?.premise ?? '';
}
});

function validateName(): boolean {
if (!name.trim()) {
nameError = 'Game name is required';
return false;
}
nameError = null;
return true;
}

function handleSave() {
if (!validateName()) return;

const updates: Partial<Game> = {
name: name.trim(),
bigPicture: bigPicture.trim() ? { premise: bigPicture.trim() } : undefined
};

onSave(updates);
onOpenChange(false);
}
</script>

<Dialog.Root {open} {onOpenChange}>
<Dialog.Content class="settings-dialog">
<Dialog.Header>
<Dialog.Title>History Settings</Dialog.Title>
<Dialog.Description>Configure your history's name and description.</Dialog.Description>
</Dialog.Header>

<form
class="edit-form"
onsubmit={(e) => {
e.preventDefault();
handleSave();
}}
>
<div class="form-field">
<label for="game-name" class="form-label">History Name</label>
<Input
id="game-name"
bind:value={name}
placeholder="Enter history name"
oninput={() => validateName()}
/>
{#if nameError}
<p class="error-message">{nameError}</p>
{/if}
</div>

<div class="form-field">
<div class="form-label-row">
<label for="big-picture" class="form-label">Big Picture</label>
<OracleDiceButton 
category="history-seed" 
onResult={(result) => { bigPicture = result; }}
title="Generate random big picture"
/>
</div>
<Textarea
id="big-picture"
bind:value={bigPicture}
placeholder="The rise and fall of a galactic civilization..."
rows={3}
/>
<p class="form-hint">What is this history about? What is the overarching theme?</p>
</div>
</form>

<Dialog.Footer>
<Button type="button" variant="secondary" onclick={() => onOpenChange(false)}>Cancel</Button>
<Button type="button" onclick={handleSave} disabled={!!nameError || !name.trim()}>
Save Changes
</Button>
</Dialog.Footer>
</Dialog.Content>
</Dialog.Root>

<style>
.edit-form {
display: flex;
flex-direction: column;
gap: 1rem;
padding: 1rem 0.75rem;
}

.form-field {
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.form-label {
font-size: 0.875rem;
font-weight: 500;
color: var(--color-foreground);
}

.form-label-row {
display: flex;
align-items: center;
justify-content: space-between;
}

.form-hint {
font-size: 0.75rem;
color: var(--color-muted-foreground);
margin: 0;
}

.error-message {
font-size: 0.75rem;
color: var(--color-destructive);
margin: 0;
}

:global(.settings-dialog) {
max-width: 500px;
}

@media (max-width: 640px) {
:global(.settings-dialog) {
max-width: calc(100vw - 2rem);
}
}
</style>
