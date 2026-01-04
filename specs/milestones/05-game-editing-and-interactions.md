# Milestone 05: Game Editing & Interactions

## 1. Purpose

This milestone implements the **editing capabilities** for Microscope items. Users can modify Periods, Events, and Scenes — including their names, descriptions, tone, and all canonical Microscope data fields.

This milestone exists to:
* Enable full CRUD operations on game items
* Allow editing of all Microscope data (Focus, Legacy, tone, notes)
* Implement drag-to-reorder functionality
* Make the app fully usable for creating and managing a Microscope world

---

## 2. Scope

### Included

* **Edit Item UI** (modal or inline):
  * Edit name/title
  * Edit description/notes/flavor text
  * Set tone (Light/Dark toggle)
  * Set Focus (for game-level or period-level)
  * Set Legacy (for game-level or period-level)
* **Game-level metadata editing**:
  * Edit game name
  * Edit game-level Focus
  * Edit game-level Legacy
  * Game description/notes
* **Delete Item** functionality:
  * Delete Period (and its Events/Scenes)
  * Delete Event (and its Scenes)
  * Delete Scene
  * Confirmation dialog before deletion
* **Drag-to-Reorder**:
  * Reorder Periods horizontally
  * Reorder Events within a Period
  * Reorder Scenes within an Event
  * Structural constraints enforced (can't move Event to different Period via drag)
* All edits trigger autosave
* All edits update `updatedAt` timestamp

### Not Included

* Undo/redo functionality
* Snapshot history
* Import/export
* Moving items between parents (e.g., Event from Period A to Period B)

---

## 3. Dependencies

* **Milestone 01–03** — Foundation, shell, persistence
* **Milestone 04: Canvas Layout System** — Cards rendered, add buttons functional

---

## 4. Implementation Strategy

### High-Level Approach

1. **Edit Modal Component**:
   * Generic modal for editing any item type
   * Form fields adapt based on item type:
     * Period: name, tone, description
     * Event: name, tone, description
     * Scene: name, description, question/answer (if applicable)
   * Game metadata editor (accessible from canvas header or menu)

2. **Tone Toggle**:
   * Visual toggle for Light/Dark
   * Updates immediately on change
   * Reflects in card appearance

3. **Focus & Legacy**:
   * Text fields for Focus and Legacy
   * Can be set at game level
   * Display somewhere visible (header or dedicated area)

4. **Delete Functionality**:
   * Delete button in edit modal or card context menu
   * Confirmation dialog with item name
   * Cascade delete: removing Period removes its Events and Scenes
   * Deleted items removed from state and persisted immediately

5. **Drag-to-Reorder**:
   * Use drag-and-drop library or native HTML5 drag
   * Visual feedback during drag (placeholder, opacity change)
   * Drop zones clearly indicated
   * Structural constraints:
     * Periods reorder among Periods only
     * Events reorder within their Period only
     * Scenes reorder within their Event only
   * Reorder persisted on drop

6. **Form Validation**:
   * Name required (non-empty)
   * Description optional
   * No strict length limits, but soft warnings for very long text

### Architectural Considerations

* **Form State**: Local form state, commit on save
* **Optimistic Updates**: Update UI immediately, persist async
* **Drag State**: Track dragging item, drop target, and provide visual cues
* **Event Handling**: Prevent drag from triggering pan

### Key Risks

* **Drag/Pan Conflict**: Ensure dragging a card doesn't pan the canvas
* **Form Accessibility**: Ensure modals are fully accessible
* **Data Integrity**: Cascade deletes must be atomic

---

## 5. UX Considerations

### Loading States

* Save operations should feel instant (optimistic UI)
* If save fails, show error and offer retry

### Error States

* Failed save: show notification, do not close modal
* Validation errors: inline error messages in form
* Delete failure: show error, item remains in list

### Mobile Considerations

* Edit modal should be full-screen on mobile
* Touch-friendly form controls
* Drag-to-reorder must work with touch (may require touch-hold to initiate)
* Consider reorder via buttons as fallback on mobile

### User Experience

* Editing feels lightweight and fast
* Changes save automatically — no "Save" button anxiety
* Deleting is intentional (requires confirmation)
* Reordering is intuitive and provides clear feedback

---

## 6. Acceptance Criteria

### Edit UI

- [ ] Clicking a card opens an edit interface (modal or inline)
- [ ] Name/title field is editable
- [ ] Description/notes field is editable
- [ ] Tone can be toggled between Light and Dark
- [ ] Edit interface can be closed/dismissed
- [ ] Changes are saved automatically on close or on field blur

### Game Metadata

- [ ] Game name is editable
- [ ] Game-level Focus is editable
- [ ] Game-level Legacy is editable
- [ ] Game metadata changes are persisted

### All Microscope Fields

- [ ] All canonical Microscope data fields are editable:
  - [ ] Period: name, tone, description
  - [ ] Event: name, tone, description
  - [ ] Scene: name, description, question, answer (if tracked)
  - [ ] Focus and Legacy at appropriate levels

### Delete Functionality

- [ ] Delete button exists for each item type
- [ ] Deleting shows a confirmation dialog
- [ ] Confirming delete removes the item and its children
- [ ] Deleted items are removed from UI immediately
- [ ] Deletions are persisted to IndexedDB

### Drag-to-Reorder

- [ ] Periods can be reordered by dragging
- [ ] Events can be reordered within their Period
- [ ] Scenes can be reordered within their Event
- [ ] Drag provides visual feedback (placeholder, opacity)
- [ ] Drop zones are clearly indicated
- [ ] Reorder is persisted on drop
- [ ] Drag does not trigger canvas pan

### Autosave Integration

- [ ] All edits trigger autosave
- [ ] `updatedAt` is updated on each save
- [ ] Autosave is debounced appropriately

### Form Validation

- [ ] Empty name shows validation error
- [ ] Validation errors prevent save until resolved

### Accessibility

- [ ] Edit modal is keyboard navigable
- [ ] Focus management follows modal best practices
- [ ] Form fields have proper labels
- [ ] Error messages are announced to screen readers

---

## 7. Notes

This milestone makes the app **fully functional** for creating and managing a Microscope world. After this, a user can:

* Create games
* Add Periods, Events, and Scenes
* Edit all content
* Reorder the timeline
* Delete items

Undo/redo and export come next, but the core creative workflow is complete.
