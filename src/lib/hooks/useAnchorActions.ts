/**
 * Anchor Actions Hook
 * 
 * Extracts all anchor-related handlers from the game page.
 * Handles creating, editing, deleting, and placing anchors
 * with undo/redo support via the history state.
 */

import {
	createNewAnchor,
	createAnchorPlacement,
	type Game,
	type GameAction,
	type CreateAnchorAction,
	type DeleteAnchorAction,
	type EditAnchorAction,
	type SetCurrentAnchorAction,
	type ClearCurrentAnchorAction
} from '$lib/types';
import { deepClone } from '$lib/utils/deep-clone';

export interface AnchorActionHandlers {
	createAnchor: (name: string, description?: string) => void;
	editAnchor: (anchorId: string, name: string, description?: string) => void;
	deleteAnchor: (anchorId: string) => void;
	setCurrentAnchor: (anchorId: string, periodId: string) => void;
	clearCurrentAnchor: () => void;
}

export interface UseAnchorActionsOptions {
	game: Game | null;
	onGameChange: (game: Game) => void;
	onRecordAction: (action: GameAction) => void;
	onToast: (type: 'success' | 'info' | 'error', message: string) => void;
}

/**
 * Helper to ensure anchor arrays are initialized (migration support)
 */
function ensureAnchorsInitialized(game: Game) {
	if (!game.anchors) game.anchors = [];
	if (!game.anchorPlacements) game.anchorPlacements = [];
	if (game.currentAnchorId === undefined) game.currentAnchorId = null;
}

/**
 * Creates anchor action handlers
 */
export function createAnchorActionHandlers(options: UseAnchorActionsOptions): AnchorActionHandlers {
	const { game, onGameChange, onRecordAction, onToast } = options;

	function triggerUpdate() {
		if (game) {
			onGameChange(game);
		}
	}

	function createAnchor(name: string, description?: string) {
		if (!game) return;
		ensureAnchorsInitialized(game);

		const anchor = createNewAnchor(name, description);
		const index = game.anchors!.length;

		const action: CreateAnchorAction = {
			type: 'CREATE_ANCHOR',
			timestamp: new Date().toISOString(),
			anchor: deepClone(anchor),
			index
		};

		game.anchors!.push(anchor);
		triggerUpdate();
		onRecordAction(action);
	}

	function editAnchor(anchorId: string, name: string, description?: string) {
		if (!game) return;
		ensureAnchorsInitialized(game);
		if (!game.anchors?.length) return;

		const anchor = game.anchors.find((a) => a.id === anchorId);
		if (!anchor) return;

		const previousValues = { name: anchor.name, description: anchor.description };
		const newValues = { name, description };

		const action: EditAnchorAction = {
			type: 'EDIT_ANCHOR',
			timestamp: new Date().toISOString(),
			anchorId,
			previousValues,
			newValues
		};

		anchor.name = name;
		anchor.description = description;
		anchor.updatedAt = new Date().toISOString();
		triggerUpdate();
		onRecordAction(action);
	}

	function deleteAnchor(anchorId: string) {
		if (!game) return;
		ensureAnchorsInitialized(game);
		if (!game.anchors?.length) return;

		const index = game.anchors.findIndex((a) => a.id === anchorId);
		if (index === -1) return;

		const anchor = game.anchors[index];
		const associatedPlacements = game.anchorPlacements!.filter((p) => p.anchorId === anchorId);
		const wasCurrentAnchor = game.currentAnchorId === anchorId;

		const action: DeleteAnchorAction = {
			type: 'DELETE_ANCHOR',
			timestamp: new Date().toISOString(),
			anchorId,
			index,
			anchor: deepClone(anchor),
			associatedPlacements: deepClone(associatedPlacements),
			wasCurrentAnchor
		};

		game.anchors = game.anchors.filter((a) => a.id !== anchorId);
		game.anchorPlacements = game.anchorPlacements!.filter((p) => p.anchorId !== anchorId);
		if (wasCurrentAnchor) {
			game.currentAnchorId = null;
		}
		triggerUpdate();
		onRecordAction(action);
		onToast('success', 'Anchor deleted');
	}

	function setCurrentAnchor(anchorId: string, periodId: string) {
		if (!game) return;
		ensureAnchorsInitialized(game);

		// Check if this anchor is already placed on this period
		const existingPlacement = game.anchorPlacements!.find(
			(p) => p.anchorId === anchorId && p.periodId === periodId
		);
		if (existingPlacement) {
			// Just set this anchor as active without creating a new placement
			if (game.currentAnchorId !== anchorId) {
				const previousAnchorId = game.currentAnchorId;
				const action: SetCurrentAnchorAction = {
					type: 'SET_CURRENT_ANCHOR',
					timestamp: new Date().toISOString(),
					anchorId,
					periodId,
					placement: deepClone(existingPlacement),
					previousAnchorId,
					removedPlacements: []
				};
				game.currentAnchorId = anchorId;
				triggerUpdate();
				onRecordAction(action);

				const anchor = game.anchors?.find((a) => a.id === anchorId);
				if (anchor) {
					onToast('success', `Set "${anchor.name}" as active anchor`);
				}
			} else {
				onToast('info', 'This anchor is already placed on this period');
			}
			return;
		}

		// Remove any existing placements for this anchor (1-to-1 relationship)
		const removedPlacements = game.anchorPlacements!.filter((p) => p.anchorId === anchorId);
		game.anchorPlacements = game.anchorPlacements!.filter((p) => p.anchorId !== anchorId);

		const placement = createAnchorPlacement(anchorId, periodId);
		const previousAnchorId = game.currentAnchorId;

		const action: SetCurrentAnchorAction = {
			type: 'SET_CURRENT_ANCHOR',
			timestamp: new Date().toISOString(),
			anchorId,
			periodId,
			placement: deepClone(placement),
			previousAnchorId,
			removedPlacements: deepClone(removedPlacements)
		};

		game.currentAnchorId = anchorId;
		game.anchorPlacements!.push(placement);
		triggerUpdate();
		onRecordAction(action);

		const anchor = game.anchors?.find((a) => a.id === anchorId);
		const period = game.periods.find((p) => p.id === periodId);
		if (anchor && period) {
			onToast('success', `Set "${anchor.name}" as active anchor on "${period.name}"`);
		}
	}

	function clearCurrentAnchor() {
		if (!game) return;

		const previousAnchorId = game.currentAnchorId;
		if (!previousAnchorId) return;

		const action: ClearCurrentAnchorAction = {
			type: 'CLEAR_CURRENT_ANCHOR',
			timestamp: new Date().toISOString(),
			previousAnchorId
		};

		game.currentAnchorId = null;
		triggerUpdate();
		onRecordAction(action);
		onToast('success', 'Active anchor cleared');
	}

	return {
		createAnchor,
		editAnchor,
		deleteAnchor,
		setCurrentAnchor,
		clearCurrentAnchor
	};
}
