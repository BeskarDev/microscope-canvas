<script lang="ts">
	import {
		PaletteSheet,
		PlayersSheet,
		FocusesSheet,
		LegaciesSheet,
		AnchorsSheet
	} from '$lib/components/canvas';
	import type {
		Period,
		Player,
		Focus,
		Legacy,
		Anchor,
		AnchorPlacement,
		Palette as PaletteType
	} from '$lib/types';

	interface Props {
		// Palette sheet
		paletteSheetOpen: boolean;
		palette: PaletteType;
		onPaletteSheetOpenChange: (open: boolean) => void;
		onSavePalette: (palette: PaletteType) => void;
		
		// Players sheet
		playersSheetOpen: boolean;
		players: Player[];
		activePlayerIndex: number;
		onPlayersSheetOpenChange: (open: boolean) => void;
		onSavePlayers: (players: Player[], activePlayerIndex: number) => void;
		
		// Focuses sheet
		focusesSheetOpen: boolean;
		focuses: Focus[];
		currentFocusIndex: number;
		onFocusesSheetOpenChange: (open: boolean) => void;
		onSaveFocuses: (focuses: Focus[], currentFocusIndex: number) => void;
		
		// Legacies sheet
		legaciesSheetOpen: boolean;
		legacies: Legacy[];
		onLegaciesSheetOpenChange: (open: boolean) => void;
		onSaveLegacies: (legacies: Legacy[]) => void;
		
		// Anchors sheet
		anchorsSheetOpen: boolean;
		anchors: Anchor[];
		currentAnchorId: string | null;
		anchorPlacements: AnchorPlacement[];
		periods: Period[];
		selectedAnchorId: string | null;
		onAnchorsSheetOpenChange: (open: boolean) => void;
		onCreateAnchor: (name: string, description?: string) => void;
		onEditAnchor: (anchorId: string, name: string, description?: string) => void;
		onDeleteAnchor: (anchorId: string) => void;
		onSetCurrentAnchor: (anchorId: string, periodId: string) => void;
		onClearCurrentAnchor: () => void;
	}

	let {
		paletteSheetOpen,
		palette,
		onPaletteSheetOpenChange,
		onSavePalette,
		playersSheetOpen,
		players,
		activePlayerIndex,
		onPlayersSheetOpenChange,
		onSavePlayers,
		focusesSheetOpen,
		focuses,
		currentFocusIndex,
		onFocusesSheetOpenChange,
		onSaveFocuses,
		legaciesSheetOpen,
		legacies,
		onLegaciesSheetOpenChange,
		onSaveLegacies,
		anchorsSheetOpen,
		anchors,
		currentAnchorId,
		anchorPlacements,
		periods,
		selectedAnchorId,
		onAnchorsSheetOpenChange,
		onCreateAnchor,
		onEditAnchor,
		onDeleteAnchor,
		onSetCurrentAnchor,
		onClearCurrentAnchor
	}: Props = $props();
</script>

<!-- Palette Sheet -->
<PaletteSheet
	open={paletteSheetOpen}
	onOpenChange={onPaletteSheetOpenChange}
	{palette}
	onSave={onSavePalette}
/>

<!-- Players Sheet -->
<PlayersSheet
	open={playersSheetOpen}
	onOpenChange={onPlayersSheetOpenChange}
	{players}
	{activePlayerIndex}
	onSave={onSavePlayers}
/>

<!-- Focuses Sheet -->
<FocusesSheet
	open={focusesSheetOpen}
	onOpenChange={onFocusesSheetOpenChange}
	{focuses}
	{currentFocusIndex}
	onSave={onSaveFocuses}
/>

<!-- Legacies Sheet -->
<LegaciesSheet
	open={legaciesSheetOpen}
	onOpenChange={onLegaciesSheetOpenChange}
	{legacies}
	onSave={onSaveLegacies}
/>

<!-- Anchors Sheet -->
<AnchorsSheet
	open={anchorsSheetOpen}
	onOpenChange={onAnchorsSheetOpenChange}
	{anchors}
	{currentAnchorId}
	{anchorPlacements}
	{periods}
	onCreateAnchor={onCreateAnchor}
	onEditAnchor={onEditAnchor}
	onDeleteAnchor={onDeleteAnchor}
	onSetCurrentAnchor={onSetCurrentAnchor}
	onClearCurrentAnchor={onClearCurrentAnchor}
	{selectedAnchorId}
/>
