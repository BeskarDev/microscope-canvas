/**
 * Import/Export functionality for Microscope Canvas
 * Handles JSON, Markdown, and PDF export, and JSON import
 */

import type { Game, Period, Event, Scene, GameSnapshot } from '$lib/types';
import { SCHEMA_VERSION } from '$lib/types';
import { deepClone } from '$lib/utils/deep-clone';
import { jsPDF } from 'jspdf';

/**
 * Extended export data that includes game history (snapshots)
 */
interface GameExportData extends Game {
	schemaVersion: number;
	exportedAt: string;
	history?: GameSnapshot[];
}

/**
 * Sanitizes a filename by removing or replacing invalid characters
 */
function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
		.replace(/\s+/g, '-') // Replace spaces with dashes
		.toLowerCase()
		.slice(0, 50); // Limit length
}

/**
 * Exports a game to JSON format
 * @param game The game to export
 * @param history Optional array of snapshots to include in export
 */
export function exportGameToJSON(game: Game, history?: GameSnapshot[]): string {
	// Create a clean copy with schema version
	const exportData: GameExportData = {
		...deepClone(game),
		schemaVersion: SCHEMA_VERSION,
		exportedAt: new Date().toISOString()
	};

	// Include history if provided
	if (history && history.length > 0) {
		exportData.history = deepClone(history);
	}

	return JSON.stringify(exportData, null, 2);
}

/**
 * Downloads a file using the browser's download functionality
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Exports and downloads a game as JSON
 * @param game The game to export
 * @param history Optional array of snapshots to include in export
 */
export function downloadGameAsJSON(game: Game, history?: GameSnapshot[]): void {
	const json = exportGameToJSON(game, history);
	const filename = `${sanitizeFilename(game.name)}-export.json`;
	downloadFile(json, filename, 'application/json');
}

/**
 * Formats tone for Markdown display using circle icons for visual consistency
 * Light = ○ (hollow circle), Dark = ● (filled circle)
 */
function formatTone(tone: 'light' | 'dark'): string {
	return tone === 'light' ? '○' : '●';
}

/**
 * ZapfDingbats character codes for tone symbols
 * These are the character codes that map to circle symbols in the ZapfDingbats font
 */
const ZAPF_HOLLOW_CIRCLE = 'm'; // Character 'm' in ZapfDingbats renders as a hollow circle (❍)
const ZAPF_FILLED_CIRCLE = 'l'; // Character 'l' in ZapfDingbats renders as a filled circle (●)

/** Gap after tone symbol before text continues */
const TONE_SYMBOL_GAP = 2;

/** Width reserved for tone symbol in list items */
const TONE_SYMBOL_WIDTH = 10;

/**
 * Gets the ZapfDingbats character for the tone
 */
function getToneSymbolChar(tone: 'light' | 'dark'): string {
	return tone === 'light' ? ZAPF_HOLLOW_CIRCLE : ZAPF_FILLED_CIRCLE;
}

/**
 * Renders a tone symbol at the current position using ZapfDingbats font
 * Returns the width of the symbol so text can continue after it
 */
function renderToneSymbol(state: PDFRenderState, tone: 'light' | 'dark', x: number, y: number, fontSize: number): number {
	const char = getToneSymbolChar(tone);
	state.doc.setFont('zapfdingbats', 'normal');
	state.doc.setFontSize(fontSize);
	const symbolWidth = state.doc.getTextWidth(char);
	state.doc.text(char, x, y);
	return symbolWidth;
}

/**
 * Escapes special Markdown characters in text
 */
function escapeMarkdown(text: string | undefined): string {
	if (!text) return '';
	return text.replace(/([*_`#])/g, '\\$1');
}

/**
 * Formats a scene for Markdown output with improved visual hierarchy
 */
function formatScene(scene: Scene, indent: string): string[] {
	const lines: string[] = [];
	// Scene header with tone icon and italicized name
	lines.push(`${indent}- ${formatTone(scene.tone)} *${escapeMarkdown(scene.name)}*`);

	if (scene.description) {
		lines.push(`${indent}  ${escapeMarkdown(scene.description)}`);
	}
	if (scene.question) {
		lines.push(`${indent}  > **Question:** ${escapeMarkdown(scene.question)}`);
	}
	if (scene.answer) {
		lines.push(`${indent}  > **Answer:** ${escapeMarkdown(scene.answer)}`);
	}
	if (scene.notes) {
		lines.push(`${indent}  *Notes: ${escapeMarkdown(scene.notes)}*`);
	}

	return lines;
}

/**
 * Formats an event for Markdown output with improved visual hierarchy
 */
function formatEvent(event: Event, indent: string): string[] {
	const lines: string[] = [];
	// Event header with tone icon and bold name
	lines.push(`${indent}- ${formatTone(event.tone)} **${escapeMarkdown(event.name)}**`);

	if (event.description) {
		lines.push(`${indent}  ${escapeMarkdown(event.description)}`);
	}
	if (event.notes) {
		lines.push(`${indent}  *Notes: ${escapeMarkdown(event.notes)}*`);
	}

	// Add scenes with clear nesting
	if (event.scenes.length > 0) {
		lines.push(`${indent}  **Scenes:**`);
		for (const scene of event.scenes) {
			lines.push(...formatScene(scene, `${indent}  `));
		}
	}

	return lines;
}

/**
 * Formats a period for Markdown output with improved structure
 */
function formatPeriod(period: Period): string[] {
	const lines: string[] = [];
	// Period header with tone icon
	lines.push(`### ${formatTone(period.tone)} ${escapeMarkdown(period.name)}`);
	lines.push('');

	if (period.description) {
		lines.push(escapeMarkdown(period.description));
		lines.push('');
	}
	if (period.notes) {
		lines.push(`*Notes: ${escapeMarkdown(period.notes)}*`);
		lines.push('');
	}

	// Add events with clear hierarchy
	if (period.events.length > 0) {
		lines.push('**Events:**');
		lines.push('');
		for (const event of period.events) {
			lines.push(...formatEvent(event, ''));
		}
		lines.push('');
	}

	return lines;
}

/**
 * Exports a game to Markdown format with improved structure and organization
 */
export function exportGameToMarkdown(game: Game): string {
	const lines: string[] = [];

	// Title
	lines.push(`# ${escapeMarkdown(game.name)}`);
	lines.push('');

	// Big Picture as subtitle (right after title)
	if (game.bigPicture?.premise) {
		lines.push(`> ${escapeMarkdown(game.bigPicture.premise)}`);
		lines.push('');
		if (game.bigPicture.bookendStart || game.bigPicture.bookendEnd) {
			const bookends: string[] = [];
			if (game.bigPicture.bookendStart) {
				bookends.push(`**Start:** ${escapeMarkdown(game.bigPicture.bookendStart)}`);
			}
			if (game.bigPicture.bookendEnd) {
				bookends.push(`**End:** ${escapeMarkdown(game.bigPicture.bookendEnd)}`);
			}
			lines.push(bookends.join(' | '));
			lines.push('');
		}
	}

	// Check if we have any overview content
	const hasPlayers = game.players && game.players.length > 0;
	const hasFocuses = (game.focuses && game.focuses.length > 0) || game.focus;
	const hasLegacies = game.legacies.length > 0;
	const hasAnchors = game.anchors && game.anchors.length > 0;
	const hasPalette = game.palette && (game.palette.yes.length > 0 || game.palette.no.length > 0);

	if (hasPlayers || hasFocuses || hasLegacies || hasAnchors || hasPalette) {
		lines.push('## Overview');
		lines.push('');

		// Players as compact table
		if (hasPlayers) {
			lines.push('### Players');
			lines.push('');
			lines.push('| # | Name | Status |');
			lines.push('|---|------|--------|');
			game.players!.forEach((player, idx) => {
				const status = idx === game.activePlayerIndex ? 'Active' : '';
				lines.push(`| ${idx + 1} | ${escapeMarkdown(player.name)} | ${status} |`);
			});
			lines.push('');
		}

		// Focuses as compact list
		if (game.focuses && game.focuses.length > 0) {
			lines.push('### Focuses');
			lines.push('');
			game.focuses.forEach((focus, idx) => {
				const isCurrent = idx === game.currentFocusIndex;
				const marker = isCurrent ? '**→**' : '•';
				let line = `${marker} **${escapeMarkdown(focus.name)}**`;
				if (focus.description) {
					line += ` — ${escapeMarkdown(focus.description)}`;
				}
				lines.push(line);
			});
			lines.push('');
		} else if (game.focus) {
			lines.push('### Focuses');
			lines.push('');
			let line = `**→** **${escapeMarkdown(game.focus.name)}**`;
			if (game.focus.description) {
				line += ` — ${escapeMarkdown(game.focus.description)}`;
			}
			lines.push(line);
			lines.push('');
		}

		// Legacies as compact list
		if (hasLegacies) {
			lines.push('### Legacies');
			lines.push('');
			for (const legacy of game.legacies) {
				let line = `• **${escapeMarkdown(legacy.name)}**`;
				if (legacy.description) {
					line += ` — ${escapeMarkdown(legacy.description)}`;
				}
				lines.push(line);
			}
			lines.push('');
		}

		// Anchors as compact list
		if (hasAnchors) {
			lines.push('### Anchors');
			lines.push('');
			for (const anchor of game.anchors!) {
				const isActive = game.currentAnchorId === anchor.id;
				const marker = isActive ? '**→**' : '•';
				let line = `${marker} **${escapeMarkdown(anchor.name)}**`;
				if (anchor.description) {
					line += ` — ${escapeMarkdown(anchor.description)}`;
				}
				// Show placements inline
				const placements = (game.anchorPlacements || []).filter((p) => p.anchorId === anchor.id);
				if (placements.length > 0) {
					const placementNames = placements
						.map((p) => {
							const period = game.periods.find((per) => per.id === p.periodId);
							return period ? escapeMarkdown(period.name) : null;
						})
						.filter(Boolean);
					if (placementNames.length > 0) {
						line += ` *(placed: ${placementNames.join(', ')})*`;
					}
				}
				lines.push(line);
			}
			lines.push('');
		}

		// Palette as two-column table
		if (hasPalette) {
			lines.push('### Palette');
			lines.push('');
			lines.push('| ✓ Yes (Allowed) | ✗ No (Banned) |');
			lines.push('|-----------------|---------------|');
			const maxLen = Math.max(game.palette!.yes.length, game.palette!.no.length);
			for (let i = 0; i < maxLen; i++) {
				const yesItem = game.palette!.yes[i] ? escapeMarkdown(game.palette!.yes[i]) : '';
				const noItem = game.palette!.no[i] ? escapeMarkdown(game.palette!.no[i]) : '';
				lines.push(`| ${yesItem} | ${noItem} |`);
			}
			lines.push('');
		}
	}

	// Timeline
	if (game.periods.length > 0) {
		lines.push('---');
		lines.push('');
		lines.push('## Timeline');
		lines.push('');

		for (let i = 0; i < game.periods.length; i++) {
			const period = game.periods[i];
			lines.push(...formatPeriod(period));

			// Add separator between periods (except after the last one)
			if (i < game.periods.length - 1) {
				lines.push('---');
				lines.push('');
			}
		}
	}

	// Footer
	lines.push('---');
	lines.push('');
	lines.push(`*Exported from Microscope Canvas on ${new Date().toLocaleDateString()}*`);

	return lines.join('\n');
}

/**
 * Exports and downloads a game as Markdown
 */
export function downloadGameAsMarkdown(game: Game): void {
	const markdown = exportGameToMarkdown(game);
	const filename = `${sanitizeFilename(game.name)}-export.md`;
	downloadFile(markdown, filename, 'text/markdown');
}

// ============================================================================
// PDF Export Functions
// ============================================================================

/**
 * PDF rendering state and helper types
 */
interface PDFRenderState {
	doc: jsPDF;
	y: number;
	pageHeight: number;
	marginBottom: number;
	marginLeft: number;
	marginRight: number;
	lineHeight: number;
	contentWidth: number;
}

/**
 * Creates a new PDF render state
 */
function createPDFState(): PDFRenderState {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const marginLeft = 15;
	const marginRight = 15;
	const marginBottom = 20;

	return {
		doc,
		y: 20, // Starting Y position (top margin)
		pageHeight,
		marginBottom,
		marginLeft,
		marginRight,
		lineHeight: 6,
		contentWidth: pageWidth - marginLeft - marginRight
	};
}

/**
 * Checks if content needs a new page and adds one if necessary
 */
function checkPageBreak(state: PDFRenderState, additionalHeight: number = 0): void {
	if (state.y + additionalHeight > state.pageHeight - state.marginBottom) {
		state.doc.addPage();
		state.y = 20;
	}
}

/**
 * Adds a title to the PDF
 */
function addPDFTitle(state: PDFRenderState, title: string): void {
	checkPageBreak(state, 15);
	state.doc.setFontSize(22);
	state.doc.setFont('helvetica', 'bold');
	state.doc.text(title, state.marginLeft, state.y);
	state.y += 12;
}

/**
 * Adds a section header (H2) to the PDF
 */
function addPDFSectionHeader(state: PDFRenderState, header: string): void {
	checkPageBreak(state, 15);
	state.y += 4;
	state.doc.setFontSize(16);
	state.doc.setFont('helvetica', 'bold');
	state.doc.text(header, state.marginLeft, state.y);
	state.y += 8;
}

/**
 * Adds a subsection header (H3) to the PDF with optional tone symbol
 */
function addPDFSubsectionHeader(state: PDFRenderState, header: string, tone?: 'light' | 'dark'): void {
	checkPageBreak(state, 12);
	state.y += 3;
	const fontSize = 13;
	
	let xPos = state.marginLeft;
	
	// Render tone symbol first if provided
	if (tone) {
		const symbolWidth = renderToneSymbol(state, tone, xPos, state.y, fontSize);
		xPos += symbolWidth + TONE_SYMBOL_GAP;
	}
	
	// Render the header text
	state.doc.setFontSize(fontSize);
	state.doc.setFont('helvetica', 'bold');
	state.doc.text(header, xPos, state.y);
	state.y += 7;
}

/**
 * Adds wrapped paragraph text to the PDF
 */
function addPDFParagraph(
	state: PDFRenderState,
	text: string,
	options: {
		bold?: boolean;
		italic?: boolean;
		indent?: number;
		fontSize?: number;
	} = {}
): void {
	const { bold = false, italic = false, indent = 0, fontSize = 10 } = options;

	state.doc.setFontSize(fontSize);
	const fontStyle = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
	state.doc.setFont('helvetica', fontStyle);

	const effectiveWidth = state.contentWidth - indent;
	const lines = state.doc.splitTextToSize(text, effectiveWidth);

	for (const line of lines) {
		checkPageBreak(state, state.lineHeight);
		state.doc.text(line, state.marginLeft + indent, state.y);
		state.y += state.lineHeight;
	}
}

/**
 * Adds a labeled field (e.g., "Premise: Some text")
 */
function addPDFLabeledField(state: PDFRenderState, label: string, value: string, indent: number = 0): void {
	state.doc.setFontSize(10);
	state.doc.setFont('helvetica', 'bold');
	const labelWidth = state.doc.getTextWidth(`${label}: `);

	checkPageBreak(state, state.lineHeight);
	state.doc.text(`${label}: `, state.marginLeft + indent, state.y);

	state.doc.setFont('helvetica', 'normal');
	const remainingWidth = state.contentWidth - indent - labelWidth;
	const valueLines = state.doc.splitTextToSize(value, remainingWidth);

	// First line continues after label
	if (valueLines.length > 0) {
		state.doc.text(valueLines[0], state.marginLeft + indent + labelWidth, state.y);
		state.y += state.lineHeight;
	}

	// Additional lines are indented
	for (let i = 1; i < valueLines.length; i++) {
		checkPageBreak(state, state.lineHeight);
		state.doc.text(valueLines[i], state.marginLeft + indent + labelWidth, state.y);
		state.y += state.lineHeight;
	}
}

/**
 * Adds a list item to the PDF with optional tone symbol
 */
function addPDFListItem(
	state: PDFRenderState,
	text: string,
	options: { bullet?: string; indent?: number; bold?: boolean; tone?: 'light' | 'dark' } = {}
): void {
	const { bullet = '•', indent = 0, bold = false, tone } = options;

	checkPageBreak(state, state.lineHeight);
	const fontSize = 10;
	let xPos = state.marginLeft + indent;
	
	// Render bullet (if not empty)
	if (bullet) {
		state.doc.setFontSize(fontSize);
		state.doc.setFont('helvetica', 'normal');
		state.doc.text(bullet, xPos, state.y);
	}
	
	const bulletWidth = bullet ? 5 : 0;
	xPos += bulletWidth;
	
	// Render tone symbol if provided
	if (tone) {
		const symbolWidth = renderToneSymbol(state, tone, xPos, state.y, fontSize);
		xPos += symbolWidth + TONE_SYMBOL_GAP;
	}

	// Render the text
	state.doc.setFontSize(fontSize);
	state.doc.setFont('helvetica', bold ? 'bold' : 'normal');
	const textStartX = state.marginLeft + indent + bulletWidth + (tone ? TONE_SYMBOL_WIDTH : 0);
	const textLines = state.doc.splitTextToSize(text, state.contentWidth - indent - bulletWidth - (tone ? TONE_SYMBOL_WIDTH : 0));

	for (let i = 0; i < textLines.length; i++) {
		if (i > 0) {
			checkPageBreak(state, state.lineHeight);
		}
		state.doc.text(textLines[i], i === 0 ? xPos : textStartX, state.y);
		state.y += state.lineHeight;
	}
}

/**
 * Adds a horizontal separator line to the PDF
 */
function addPDFSeparator(state: PDFRenderState): void {
	state.y += 3;
	checkPageBreak(state, 5);
	state.doc.setDrawColor(200, 200, 200);
	state.doc.setLineWidth(0.3);
	state.doc.line(state.marginLeft, state.y, state.marginLeft + state.contentWidth, state.y);
	state.y += 5;
}

/**
 * Adds a scene to the PDF
 */
function addPDFScene(state: PDFRenderState, scene: Scene, indent: number): void {
	// Scene name with tone symbol
	addPDFListItem(state, scene.name, { indent, bullet: '', tone: scene.tone });

	if (scene.description) {
		addPDFParagraph(state, scene.description, { indent: indent + 10, italic: true });
	}
	if (scene.question) {
		addPDFLabeledField(state, 'Question', scene.question, indent + 10);
	}
	if (scene.answer) {
		addPDFLabeledField(state, 'Answer', scene.answer, indent + 10);
	}
	if (scene.notes) {
		addPDFParagraph(state, `Notes: ${scene.notes}`, { indent: indent + 10, italic: true, fontSize: 9 });
	}
}

/**
 * Adds an event to the PDF
 */
function addPDFEvent(state: PDFRenderState, event: Event, indent: number): void {
	// Event name with tone symbol
	addPDFListItem(state, event.name, { indent, bold: true, bullet: '•', tone: event.tone });

	if (event.description) {
		addPDFParagraph(state, event.description, { indent: indent + 5 });
	}
	if (event.notes) {
		addPDFParagraph(state, `Notes: ${event.notes}`, { indent: indent + 5, italic: true, fontSize: 9 });
	}

	// Add scenes
	if (event.scenes.length > 0) {
		state.y += 2;
		state.doc.setFontSize(10);
		state.doc.setFont('helvetica', 'bold');
		state.doc.text('Scenes:', state.marginLeft + indent + 5, state.y);
		state.y += state.lineHeight;

		for (const scene of event.scenes) {
			addPDFScene(state, scene, indent + 10);
		}
	}
}

/**
 * Adds a period to the PDF
 */
function addPDFPeriod(state: PDFRenderState, period: Period): void {
	addPDFSubsectionHeader(state, period.name, period.tone);

	if (period.description) {
		addPDFParagraph(state, period.description);
	}
	if (period.notes) {
		addPDFParagraph(state, `Notes: ${period.notes}`, { italic: true, fontSize: 9 });
	}

	// Add events
	if (period.events.length > 0) {
		state.y += 2;
		state.doc.setFontSize(11);
		state.doc.setFont('helvetica', 'bold');
		state.doc.text('Events:', state.marginLeft, state.y);
		state.y += state.lineHeight;

		for (const event of period.events) {
			addPDFEvent(state, event, 5);
			state.y += 2;
		}
	}
}

/**
 * Exports a game to PDF format
 */
export function exportGameToPDF(game: Game): jsPDF {
	const state = createPDFState();

	// Title
	addPDFTitle(state, game.name);

	// Big Picture as subtitle (right after title)
	if (game.bigPicture?.premise) {
		state.doc.setFontSize(11);
		state.doc.setFont('helvetica', 'italic');
		const premiseLines = state.doc.splitTextToSize(game.bigPicture.premise, state.contentWidth);
		for (const line of premiseLines) {
			checkPageBreak(state, state.lineHeight);
			state.doc.text(line, state.marginLeft, state.y);
			state.y += state.lineHeight;
		}
		state.y += 2;
		if (game.bigPicture.bookendStart || game.bigPicture.bookendEnd) {
			state.doc.setFontSize(9);
			state.doc.setFont('helvetica', 'normal');
			const bookends: string[] = [];
			if (game.bigPicture.bookendStart) {
				bookends.push(`Start: ${game.bigPicture.bookendStart}`);
			}
			if (game.bigPicture.bookendEnd) {
				bookends.push(`End: ${game.bigPicture.bookendEnd}`);
			}
			const bookendText = bookends.join(' | ');
			const bookendLines = state.doc.splitTextToSize(bookendText, state.contentWidth);
			for (const line of bookendLines) {
				checkPageBreak(state, state.lineHeight);
				state.doc.text(line, state.marginLeft, state.y);
				state.y += state.lineHeight;
			}
		}
		state.y += 4;
	}

	// Check if we have any overview content
	const hasPlayers = game.players && game.players.length > 0;
	const hasFocuses = (game.focuses && game.focuses.length > 0) || game.focus;
	const hasLegacies = game.legacies.length > 0;
	const hasAnchors = game.anchors && game.anchors.length > 0;
	const hasPalette = game.palette && (game.palette.yes.length > 0 || game.palette.no.length > 0);

	if (hasPlayers || hasFocuses || hasLegacies || hasAnchors || hasPalette) {
		addPDFSectionHeader(state, 'Overview');

		// Players
		if (hasPlayers) {
			state.doc.setFontSize(11);
			state.doc.setFont('helvetica', 'bold');
			state.doc.text('Players', state.marginLeft, state.y);
			state.y += state.lineHeight;
			game.players!.forEach((player, idx) => {
				const isActive = idx === game.activePlayerIndex;
				const activeText = isActive ? ' (active)' : '';
				addPDFListItem(state, `${player.name}${activeText}`, { bullet: `${idx + 1}.`, indent: 5 });
			});
			state.y += 3;
		}

		// Focuses
		if (game.focuses && game.focuses.length > 0) {
			state.doc.setFontSize(11);
			state.doc.setFont('helvetica', 'bold');
			state.doc.text('Focuses', state.marginLeft, state.y);
			state.y += state.lineHeight;
			game.focuses.forEach((focus, idx) => {
				const isCurrent = idx === game.currentFocusIndex;
				const marker = isCurrent ? '→' : '•';
				let focusText = focus.name;
				if (focus.description) {
					focusText += ` — ${focus.description}`;
				}
				addPDFListItem(state, focusText, { bold: isCurrent, bullet: marker, indent: 5 });
			});
			state.y += 3;
		} else if (game.focus) {
			state.doc.setFontSize(11);
			state.doc.setFont('helvetica', 'bold');
			state.doc.text('Focuses', state.marginLeft, state.y);
			state.y += state.lineHeight;
			let focusText = game.focus.name;
			if (game.focus.description) {
				focusText += ` — ${game.focus.description}`;
			}
			addPDFListItem(state, focusText, { bold: true, bullet: '→', indent: 5 });
			state.y += 3;
		}

		// Legacies
		if (hasLegacies) {
			state.doc.setFontSize(11);
			state.doc.setFont('helvetica', 'bold');
			state.doc.text('Legacies', state.marginLeft, state.y);
			state.y += state.lineHeight;
			for (const legacy of game.legacies) {
				let legacyText = legacy.name;
				if (legacy.description) {
					legacyText += ` — ${legacy.description}`;
				}
				addPDFListItem(state, legacyText, { indent: 5 });
			}
			state.y += 3;
		}

		// Anchors
		if (hasAnchors) {
			state.doc.setFontSize(11);
			state.doc.setFont('helvetica', 'bold');
			state.doc.text('Anchors', state.marginLeft, state.y);
			state.y += state.lineHeight;
			for (const anchor of game.anchors!) {
				const isActive = game.currentAnchorId === anchor.id;
				const marker = isActive ? '→' : '•';
				let anchorText = anchor.name;
				if (anchor.description) {
					anchorText += ` — ${anchor.description}`;
				}
				// Show placements inline
				const placements = (game.anchorPlacements || []).filter((p) => p.anchorId === anchor.id);
				if (placements.length > 0) {
					const placementNames = placements
						.map((p) => {
							const period = game.periods.find((per) => per.id === p.periodId);
							return period ? period.name : null;
						})
						.filter(Boolean);
					if (placementNames.length > 0) {
						anchorText += ` (placed: ${placementNames.join(', ')})`;
					}
				}
				addPDFListItem(state, anchorText, { bold: isActive, bullet: marker, indent: 5 });
			}
			state.y += 3;
		}

		// Palette
		if (hasPalette) {
			state.doc.setFontSize(11);
			state.doc.setFont('helvetica', 'bold');
			state.doc.text('Palette', state.marginLeft, state.y);
			state.y += state.lineHeight;
			if (game.palette!.yes.length > 0) {
				state.doc.setFontSize(10);
				state.doc.setFont('helvetica', 'bold');
				state.doc.text('Yes:', state.marginLeft + 5, state.y);
				state.doc.setFont('helvetica', 'normal');
				const yesText = game.palette!.yes.join(', ');
				const yesWidth = state.doc.getTextWidth('Yes: ');
				const yesLines = state.doc.splitTextToSize(yesText, state.contentWidth - 5 - yesWidth);
				state.doc.text(yesLines[0], state.marginLeft + 5 + yesWidth, state.y);
				state.y += state.lineHeight;
				for (let i = 1; i < yesLines.length; i++) {
					state.doc.text(yesLines[i], state.marginLeft + 5 + yesWidth, state.y);
					state.y += state.lineHeight;
				}
			}
			if (game.palette!.no.length > 0) {
				state.doc.setFontSize(10);
				state.doc.setFont('helvetica', 'bold');
				state.doc.text('No:', state.marginLeft + 5, state.y);
				state.doc.setFont('helvetica', 'normal');
				const noText = game.palette!.no.join(', ');
				const noWidth = state.doc.getTextWidth('No: ');
				const noLines = state.doc.splitTextToSize(noText, state.contentWidth - 5 - noWidth);
				state.doc.text(noLines[0], state.marginLeft + 5 + noWidth, state.y);
				state.y += state.lineHeight;
				for (let i = 1; i < noLines.length; i++) {
					state.doc.text(noLines[i], state.marginLeft + 5 + noWidth, state.y);
					state.y += state.lineHeight;
				}
			}
			state.y += 3;
		}
	}

	// Timeline
	if (game.periods.length > 0) {
		addPDFSeparator(state);
		addPDFSectionHeader(state, 'Timeline');

		for (let i = 0; i < game.periods.length; i++) {
			const period = game.periods[i];
			addPDFPeriod(state, period);

			// Add separator between periods
			if (i < game.periods.length - 1) {
				addPDFSeparator(state);
			}
		}
	}

	// Footer
	addPDFSeparator(state);
	state.doc.setFontSize(9);
	state.doc.setFont('helvetica', 'italic');
	state.doc.text(`Exported from Microscope Canvas on ${new Date().toLocaleDateString()}`, state.marginLeft, state.y);

	return state.doc;
}

/**
 * Exports and downloads a game as PDF
 */
export function downloadGameAsPDF(game: Game): void {
	const doc = exportGameToPDF(game);
	const filename = `${sanitizeFilename(game.name)}-export.pdf`;
	doc.save(filename);
}

/**
 * Import error types
 */
export class ImportError extends Error {
	constructor(
		message: string,
		public readonly code: 'INVALID_JSON' | 'INVALID_SCHEMA' | 'MISSING_FIELDS' | 'UNKNOWN'
	) {
		super(message);
		this.name = 'ImportError';
	}
}

/**
 * Validates a game object has all required fields
 */
function validateGameStructure(data: unknown): data is Game {
	if (!data || typeof data !== 'object') return false;

	const obj = data as Record<string, unknown>;

	// Check required fields
	const requiredFields = ['id', 'name', 'periods', 'legacies', 'createdAt', 'updatedAt'];
	for (const field of requiredFields) {
		if (!(field in obj)) return false;
	}

	// Check arrays
	if (!Array.isArray(obj.periods)) return false;
	if (!Array.isArray(obj.legacies)) return false;

	return true;
}

/**
 * Result of parsing a game export JSON, including both game and history
 */
export interface ParsedGameExport {
	game: Game;
	history: GameSnapshot[];
}

/**
 * Parses and validates a JSON string as a game export
 */
export function parseGameJSON(jsonString: string): Game {
	return parseGameExportJSON(jsonString).game;
}

/**
 * Parses and validates a JSON string as a game export, including history
 */
export function parseGameExportJSON(jsonString: string): ParsedGameExport {
	let data: unknown;

	// Parse JSON
	try {
		data = JSON.parse(jsonString);
	} catch {
		throw new ImportError('The file contains invalid JSON. It may be corrupted.', 'INVALID_JSON');
	}

	// Validate structure
	if (!validateGameStructure(data)) {
		throw new ImportError(
			'The file is missing required game data. It may not be a valid Microscope Canvas export.',
			'MISSING_FIELDS'
		);
	}

	// Check schema version - data is now validated as Game type
	const gameData = data as GameExportData;

	// Validate schema version if present
	if (gameData.schemaVersion !== undefined && typeof gameData.schemaVersion === 'number') {
		if (gameData.schemaVersion > SCHEMA_VERSION) {
			throw new ImportError(
				`This file was created with a newer version of Microscope Canvas (schema v${gameData.schemaVersion}). Please update the app to import this file.`,
				'INVALID_SCHEMA'
			);
		}
		// Handle migrations for older schema versions
		if (gameData.schemaVersion < 2) {
			// Migrate from v1 to v2: Add anchor support
			migrateToV2(gameData);
		}
	} else {
		// If no schema version, assume it's version 1
		// This handles exports from before schemaVersion was added
		gameData.schemaVersion = 1;
		migrateToV2(gameData);
	}

	// Extract history if present
	const history = Array.isArray(gameData.history) ? gameData.history : [];

	// Create clean game object without export-only fields using destructuring
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { history: _history, exportedAt: _exportedAt, ...game } = gameData as GameExportData;

	return { game: game as Game, history };
}

/**
 * Migrate game data from schema v1 to v2
 * Adds anchor support fields
 */
function migrateToV2(game: GameExportData): void {
	if (!game.anchors) {
		game.anchors = [];
	}
	if (game.currentAnchorId === undefined) {
		game.currentAnchorId = null;
	}
	if (!game.anchorPlacements) {
		game.anchorPlacements = [];
	}
	game.schemaVersion = SCHEMA_VERSION;
}

/**
 * Creates a new game from imported data with a fresh ID
 */
export function createGameFromImport(importedGame: Game): Game {
	const now = new Date().toISOString();

	// Generate new IDs for everything to avoid conflicts
	const newId = crypto.randomUUID();

	// Deep clone and update IDs
	const newGame: Game = {
		...deepClone(importedGame),
		id: newId,
		schemaVersion: SCHEMA_VERSION,
		createdAt: now,
		updatedAt: now
	};

	// Note: We preserve the internal IDs for periods/events/scenes
	// as they're only used within this game and don't conflict

	return newGame;
}

/**
 * Result of creating a game and its history from import
 */
export interface ImportedGameWithHistory {
	game: Game;
	history: GameSnapshot[];
}

/**
 * Creates a new game and remapped history from imported data
 * All IDs are regenerated to avoid conflicts, and history snapshots
 * are updated to reference the new game ID
 */
export function createGameAndHistoryFromImport(
	importedGame: Game,
	importedHistory: GameSnapshot[]
): ImportedGameWithHistory {
	const now = new Date().toISOString();

	// Generate new game ID
	const newGameId = crypto.randomUUID();

	// Deep clone and update game
	const newGame: Game = {
		...deepClone(importedGame),
		id: newGameId,
		schemaVersion: SCHEMA_VERSION,
		createdAt: now,
		updatedAt: now
	};

	// Remap history to use the new game ID and generate new snapshot IDs
	const newHistory: GameSnapshot[] = importedHistory.map((snapshot) => {
		const newSnapshot: GameSnapshot = {
			...deepClone(snapshot),
			id: crypto.randomUUID(),
			gameId: newGameId
		};
		// Also update the gameId inside the snapshot's data
		if (newSnapshot.data) {
			newSnapshot.data.id = newGameId;
		}
		return newSnapshot;
	});

	return { game: newGame, history: newHistory };
}

/**
 * Reads a file as text
 */
export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file as text'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
}

/**
 * Validates that a file is a JSON file
 */
export function isJSONFile(file: File): boolean {
	// Check by extension
	if (file.name.toLowerCase().endsWith('.json')) return true;

	// Check by MIME type
	if (file.type === 'application/json') return true;

	return false;
}
