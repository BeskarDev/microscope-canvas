# Milestone 07: Import & Export

## 1. Purpose

This milestone implements **import and export functionality**, allowing users to back up their data, transfer games between devices, and produce human-readable summaries.

This milestone exists to:
* Enable data portability and backup
* Provide a human-readable export format (Markdown)
* Allow full-fidelity technical backup (JSON)
* Support drag-and-drop import for convenience

---

## 2. Scope

### Included

* **JSON Export** (Technical Export):
  * Full-fidelity export of game data
  * Includes `schemaVersion`
  * Intended for backup and transfer
  * Download as `.json` file

* **Markdown Export** (User-Facing Export):
  * Human-readable nested list format
  * Structure: Periods → Events → Scenes
  * ASCII indicators for tone (Light/Dark)
  * Includes Focus, Legacy, and notes
  * Download as `.md` file

* **JSON Import**:
  * Import from `.json` file
  * Creates a **new local game** (no overwriting)
  * Validates schema version
  * Handles migration if needed
  * Drag-and-drop support on Home Screen
  * File picker as fallback

* **Export UI**:
  * Export button/menu in canvas view
  * Options for JSON and Markdown export

* **Import UI**:
  * Import button on Home Screen
  * Drag-and-drop zone on Home Screen
  * File picker dialog

### Not Included

* Mermaid diagram export
* Print export
* Markdown import (JSON only)
* Cloud sync or sharing

---

## 3. Dependencies

* **Milestone 01–03** — Foundation, shell, persistence
* **Milestone 04–05** — Canvas and editing (for complete game data)
* **Milestone 06** — Undo/redo (optional but useful if import fails)

---

## 4. Implementation Strategy

### High-Level Approach

1. **JSON Export**:
   * Serialize current game state to JSON
   * Include `schemaVersion` for forward compatibility
   * Trigger browser download with `application/json` MIME type
   * Filename: `{game-name}-export.json`

2. **Markdown Export**:
   * Transform game state into nested Markdown list
   * Format:
     ```markdown
     # {Game Name}
     
     **Focus:** {Focus}
     **Legacy:** {Legacy}
     
     ## Timeline
     
     - **Period: {Name}** [Light/Dark]
       - Event: {Name} [Light/Dark]
         - Scene: {Name}
           - Question: {Question}
           - Answer: {Answer}
     ```
   * Trigger browser download with `text/markdown` MIME type
   * Filename: `{game-name}-export.md`

3. **JSON Import**:
   * Accept `.json` file via file input or drag-and-drop
   * Parse and validate JSON structure
   * Check `schemaVersion` and apply migrations if needed
   * Generate new UUID for imported game (to avoid conflicts)
   * Save as new game to IndexedDB
   * Navigate to the new game's canvas view

4. **Drag-and-Drop Import**:
   * Drop zone on Home Screen
   * Visual feedback when file is dragged over
   * Process dropped `.json` files
   * Ignore non-JSON files with error message

5. **Error Handling**:
   * Invalid JSON: show error message
   * Schema mismatch: attempt migration or show error
   * Corrupted data: show error, do not import

### Architectural Considerations

* **File Handling**: Use File API for reading uploads
* **Downloads**: Use Blob and URL.createObjectURL for exports
* **Migration**: Reuse migration logic from persistence layer
* **Isolation**: Imported games are fully independent of original

### Key Risks

* **Schema Drift**: Imported files may be from older versions
* **Large Files**: Very large games may cause performance issues
* **File Corruption**: Invalid JSON must be handled gracefully

---

## 5. UX Considerations

### Loading States

* **Import**: Show loading indicator while parsing and saving
* **Export**: May show brief "Preparing export..." for large games

### Error States

* **Import Failures**:
  * Invalid file type: "Please select a JSON file"
  * Invalid JSON: "The file could not be read. It may be corrupted."
  * Schema error: "This file was created with an incompatible version"
* **Export Failures**:
  * Unlikely, but show error if download fails

### Mobile Considerations

* Drag-and-drop may not work on all mobile browsers
* File picker must work as primary import method on mobile
* Touch-friendly export button/menu

### User Experience

* Exporting feels instant and simple
* Importing a game is a clear, intentional action
* Imported game appears immediately in game list
* Clear feedback on success or failure

---

## 6. Acceptance Criteria

### JSON Export

- [ ] Export JSON button/option is available in canvas view
- [ ] Clicking export downloads a `.json` file
- [ ] Exported JSON includes all game data
- [ ] Exported JSON includes `schemaVersion`
- [ ] Filename includes game name
- [ ] Exported file can be opened in a text editor

### Markdown Export

- [ ] Export Markdown button/option is available in canvas view
- [ ] Clicking export downloads a `.md` file
- [ ] Markdown has nested list structure (Periods → Events → Scenes)
- [ ] Tone indicators are present (Light/Dark)
- [ ] Focus and Legacy are included
- [ ] Filename includes game name

### JSON Import

- [ ] Import button is available on Home Screen
- [ ] Clicking import opens a file picker
- [ ] Selecting a valid JSON file imports the game
- [ ] Imported game appears in game list as a new game
- [ ] Imported game has a new UUID (not the original's ID)
- [ ] Import does not overwrite existing games
- [ ] After import, user can navigate to the new game

### Drag-and-Drop Import

- [ ] Dropping a JSON file on Home Screen triggers import
- [ ] Drop zone provides visual feedback when file is dragged over
- [ ] Non-JSON files are rejected with error message

### Schema Handling

- [ ] `schemaVersion` is validated on import
- [ ] Older versions are migrated if possible
- [ ] Incompatible versions show clear error message

### Error Handling

- [ ] Invalid JSON shows user-friendly error
- [ ] Corrupted or incomplete data shows error
- [ ] Errors do not crash the app or affect existing games

### Mobile Support

- [ ] Import via file picker works on mobile
- [ ] Export downloads work on mobile
- [ ] UI is touch-friendly

---

## 7. Notes

Import/export is essential for data safety and portability. Users should feel confident that:
* Their data can always be backed up
* Backups can always be restored
* Exported Markdown is useful outside the app

Test with:
* Fresh exports and re-imports
* Exports from "older" schema versions (simulate migration)
* Very large games
* Invalid/corrupted files
