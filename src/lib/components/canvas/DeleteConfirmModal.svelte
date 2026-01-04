<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		itemType: 'period' | 'event' | 'scene';
		itemName: string;
		hasChildren?: boolean;
		onConfirm: () => void;
	}

	let { open, onOpenChange, itemType, itemName, hasChildren = false, onConfirm }: Props = $props();

	function getWarningMessage(): string {
		if (itemType === 'period' && hasChildren) {
			return 'This will also delete all events and scenes within this period.';
		}
		if (itemType === 'event' && hasChildren) {
			return 'This will also delete all scenes within this event.';
		}
		return '';
	}

	function handleConfirm() {
		onConfirm();
		onOpenChange(false);
	}
</script>

<AlertDialog.Root {open} {onOpenChange}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete {itemType}?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete "{itemName}".
				{#if getWarningMessage()}
					<span class="warning">{getWarningMessage()}</span>
				{/if}
				This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleConfirm}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	.warning {
		display: block;
		margin-top: 0.5rem;
		font-weight: 500;
		color: var(--color-destructive);
	}
</style>
