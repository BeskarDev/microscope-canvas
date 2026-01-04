# Milestone 03: Game State & Persistence

## 1. Purpose

This milestone implements the **core data layer**: how games are stored, loaded, and managed. It establishes IndexedDB as the persistence mechanism and defines the canonical data model for Microscope games.

This milestone exists to:
* Enable games to survive browser sessions
* Define a stable, versioned data schema
* Implement autosave so users never lose work
* Provide the foundation for all game operations

---

## 2. Scope

### Included

* Define the **canonical game data schema** (JSON structure)
* Implement `schemaVersion` for forward-compatible migrations
* IndexedDB setup and abstraction layer
* Game CRUD operations (persistence layer only):
  * Create new game
  * Load existing game
  * Save game (autosave)
  * Delete game
  * List all games
* Autosave on every game action (debounced appropriately)
* Game metadata (name, created date, last modified date)
* Home Screen integration:
  * Display list of saved games
  * Create new game (actually persisted)
  * Delete game (with confirmation)
* Game Canvas View:
  * Load game state from IndexedDB
  * Display game title
* Soft caps on data (configurable constants):
  * Periods per game (e.g., 1024)
  * Events per period
  * Scenes per event

### Not Included

* Game canvas rendering (items not displayed yet)
* Editing game items
* Undo/redo history
* Import/export
* Snapshot history for versions

---

## 3. Dependencies

* **Milestone 01: Project Foundation** — Build system, TypeScript
* **Milestone 02: App Shell & Navigation** — Home Screen, routing, global layout

---

## 4. Implementation Strategy

### High-Level Approach

1. **Data Schema Definition**:
   * Define TypeScript types for:
     * `Game` (root object)
     * `Period`, `Event`, `Scene`
     * `Tone` (Light/Dark enum)
     * `Focus`, `Legacy`, notes/flavor text
   * Include `schemaVersion` in every game object
   * Include `id` (UUID), `name`, `createdAt`, `updatedAt`

2. **IndexedDB Abstraction**:
   * Create a thin wrapper over IndexedDB (or use idb library)
   * Database name: application-specific
   * Object stores:
     * `games` — stores full game objects keyed by ID
   * Version handling for schema migrations

3. **Persistence Service**:
   * `createGame(name: string): Promise<Game>`
   * `loadGame(id: string): Promise<Game | null>`
   * `saveGame(game: Game): Promise<void>`
   * `deleteGame(id: string): Promise<void>`
   * `listGames(): Promise<GameMetadata[]>`

4. **Autosave Mechanism**:
   * Debounced save after each mutation
   * Update `updatedAt` timestamp
   * No manual save button

5. **Home Screen Enhancements**:
   * Fetch and display game list on mount
   * Show loading state while fetching
   * "Create New Game" opens name input, then creates and navigates
   * Each game shows name and last modified date
   * Click game to navigate to canvas
   * Delete button per game (with confirmation dialog)

6. **Game Canvas View Setup**:
   * Load game by ID from URL parameter
   * Show loading state while fetching
   * Show error if game not found
   * Display game title in header or canvas area

### Architectural Considerations

* **Immutability**: Game state should be treated as immutable; produce new copies on mutation
* **Schema Versioning**: Every save includes `schemaVersion`; implement migration logic skeleton
* **Error Handling**: All persistence operations must handle errors gracefully

### Key Risks

* **IndexedDB Complexity**: Abstract away browser inconsistencies
* **Data Loss**: Ensure autosave is reliable; test edge cases
* **Migration Strategy**: Plan for future schema changes now

---

## 5. UX Considerations

### Loading States

* **Home Screen**: Show skeleton or spinner while loading game list
* **Game Canvas View**: Show loading indicator while fetching game data
* **Create Game**: Show brief loading state during creation

### Error States

* **IndexedDB Unavailable**: Show clear error message explaining the limitation
* **Game Not Found**: Show friendly message with link back to Home Screen
* **Save Failed**: Show error notification; do not silently fail
* **Delete Failed**: Show error notification; do not remove from list until confirmed

### Mobile Considerations

* Game list should be scrollable on small screens
* Touch-friendly delete confirmation dialog
* Loading states should not block interaction unnecessarily

### User Experience

* Creating a game feels instant
* Navigating to a game shows content quickly
* Autosave is invisible to the user (no "Saved" indicator needed, but optional)

---

## 6. Acceptance Criteria

### Data Schema

- [ ] TypeScript types exist for Game, Period, Event, Scene
- [ ] Game type includes `schemaVersion`, `id`, `name`, `createdAt`, `updatedAt`
- [ ] Period, Event, Scene types include `id`, `name`, `tone`, and relevant fields
- [ ] Types include Focus, Legacy, and notes/flavor text fields

### IndexedDB

- [ ] IndexedDB database is created on first app load
- [ ] Games object store exists and accepts game objects
- [ ] Database version is tracked for future migrations

### Persistence Operations

- [ ] `createGame` creates a new game and returns it
- [ ] `loadGame` retrieves a game by ID
- [ ] `saveGame` persists the full game object
- [ ] `deleteGame` removes a game permanently
- [ ] `listGames` returns metadata for all games

### Home Screen Integration

- [ ] Game list is populated from IndexedDB
- [ ] Loading state is shown while fetching games
- [ ] Empty state is shown when no games exist
- [ ] "Create New Game" prompts for name and creates a persisted game
- [ ] New game appears in the list immediately after creation
- [ ] Clicking a game navigates to its canvas view
- [ ] Delete button exists per game
- [ ] Delete shows confirmation dialog before removing
- [ ] Deleted game is removed from list and IndexedDB

### Game Canvas View

- [ ] Game is loaded from IndexedDB based on URL parameter
- [ ] Loading state is shown while fetching
- [ ] Error state is shown if game does not exist
- [ ] Game title is displayed somewhere in the view

### Autosave

- [ ] Changes to game state trigger autosave
- [ ] Autosave is debounced (not on every keystroke)
- [ ] `updatedAt` is updated on each save

### Soft Caps

- [ ] Soft cap constants are defined for periods, events, scenes
- [ ] Exceeding caps is allowed but logged as a warning

### Error Handling

- [ ] IndexedDB initialization failure shows user-friendly error
- [ ] Failed save shows error notification
- [ ] Failed load shows error message with recovery guidance

---

## 7. Notes

This milestone is **critical**. The persistence layer is the foundation for data safety — the core product promise.

Test thoroughly:
* What happens if IndexedDB is unavailable?
* What happens if the browser storage is full?
* What happens if a save fails mid-operation?

No game data should ever be silently lost.
