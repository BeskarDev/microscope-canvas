<script lang="ts">
	import {
		EditItemModal,
		GameSettingsModal,
		DeleteConfirmModal,
		HistoryModal,
		PublishVersionModal
	} from '$lib/components/canvas';
	import type { Game, Period, Event as GameEvent, Scene, SnapshotMetadata } from '$lib/types';

	interface Props {
		// Edit modal
		editModalOpen: boolean;
		editItemType: 'period' | 'event' | 'scene';
		editItem: Period | GameEvent | Scene | null;
		onEditModalOpenChange: (open: boolean) => void;
		onSaveItem: (updates: Partial<Period | GameEvent | Scene>) => void;
		onDeleteClick: () => void;
		
		// Settings modal
		settingsModalOpen: boolean;
		game: Game | null;
		onSettingsModalOpenChange: (open: boolean) => void;
		onSaveGameSettings: (updates: Partial<Game>) => void;
		
		// Delete modal
		deleteModalOpen: boolean;
		deleteItemType: 'period' | 'event' | 'scene';
		deleteItemName: string;
		deleteItemHasChildren: boolean;
		onDeleteModalOpenChange: (open: boolean) => void;
		onConfirmDelete: () => void;
		
		// History modal
		historyModalOpen: boolean;
		snapshots: SnapshotMetadata[];
		snapshotsLoading: boolean;
		snapshotsError: string | null;
		onHistoryModalOpenChange: (open: boolean) => void;
		onViewSnapshot: (snapshotId: string) => void;
		onRestoreSnapshot: (snapshotId: string) => void;
		
		// Publish modal
		publishModalOpen: boolean;
		isPublishing: boolean;
		defaultVersionName: string;
		changeSummary: string;
		onPublishModalOpenChange: (open: boolean) => void;
		onPublishVersion: (versionName: string) => void;
	}

	let {
		editModalOpen,
		editItemType,
		editItem,
		onEditModalOpenChange,
		onSaveItem,
		onDeleteClick,
		settingsModalOpen,
		game,
		onSettingsModalOpenChange,
		onSaveGameSettings,
		deleteModalOpen,
		deleteItemType,
		deleteItemName,
		deleteItemHasChildren,
		onDeleteModalOpenChange,
		onConfirmDelete,
		historyModalOpen,
		snapshots,
		snapshotsLoading,
		snapshotsError,
		onHistoryModalOpenChange,
		onViewSnapshot,
		onRestoreSnapshot,
		publishModalOpen,
		isPublishing,
		defaultVersionName,
		changeSummary,
		onPublishModalOpenChange,
		onPublishVersion
	}: Props = $props();
</script>

<!-- Edit Item Modal -->
<EditItemModal
	open={editModalOpen}
	onOpenChange={onEditModalOpenChange}
	itemType={editItemType}
	item={editItem}
	onSave={onSaveItem}
	onDelete={onDeleteClick}
/>

<!-- Game Settings Modal -->
<GameSettingsModal
	open={settingsModalOpen}
	onOpenChange={onSettingsModalOpenChange}
	{game}
	onSave={onSaveGameSettings}
/>

<!-- Delete Confirmation Modal -->
<DeleteConfirmModal
	open={deleteModalOpen}
	onOpenChange={onDeleteModalOpenChange}
	itemType={deleteItemType}
	itemName={deleteItemName}
	hasChildren={deleteItemHasChildren}
	onConfirm={onConfirmDelete}
/>

<!-- History Modal -->
<HistoryModal
	open={historyModalOpen}
	onOpenChange={onHistoryModalOpenChange}
	{snapshots}
	isLoading={snapshotsLoading}
	error={snapshotsError}
	onView={onViewSnapshot}
	onRestore={onRestoreSnapshot}
/>

<!-- Publish Version Modal -->
<PublishVersionModal
	open={publishModalOpen}
	onOpenChange={onPublishModalOpenChange}
	defaultName={defaultVersionName}
	{changeSummary}
	onPublish={onPublishVersion}
	{isPublishing}
/>
