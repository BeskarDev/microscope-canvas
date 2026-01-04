# Milestone 06: Undo/Redo System

## 1. Purpose

This milestone implements the **undo/redo functionality** for game actions. Users can reverse and replay creative decisions, providing a safety net for experimentation.

This milestone exists to:

- Allow users to undo mistakes
- Enable fearless experimentation (knowing changes can be reversed)
- Implement action-based history tracking
- Fulfill the "Undoable creative actions" core principle

---

## 2. Scope

### Included

- Action-based undo/redo system
- Covered actions:
  - Create item (Period, Event, Scene)
  - Delete item (and cascade deletes)
  - Edit item (name, description, tone)
  - Reorder items
  - Edit game metadata (name, Focus, Legacy)
- Undo/redo buttons in UI (visible in canvas header or toolbar)
- Keyboard shortcuts:
  - Ctrl/Cmd+Z for Undo
  - Ctrl/Cmd+Shift+Z (or Ctrl/Cmd+Y) for Redo
- Configurable history limit (e.g., last 50 actions)
- Session-only history (cleared on page refresh)
- History does not affect autosave (autosave always saves current state)

### Not Included

- Persistent undo history across sessions
- Undo for navigation actions
- Undo for import/export operations
- Snapshot-based version history (separate milestone)

---

## 3. Dependencies

- **Milestone 01–04** — Foundation, shell, persistence, canvas
- **Milestone 05: Game Editing & Interactions** — All editable actions implemented

---

## 4. Implementation Strategy

### High-Level Approach

1. **Action Definition**:
   - Define an `Action` type representing undoable operations
   - Each action stores:
     - Action type (create, delete, edit, reorder)
     - Target item(s)
     - Previous state (for undo)
     - New state (for redo)

2. **History Stack**:
   - Maintain an undo stack (past actions)
   - Maintain a redo stack (undone actions)
   - Clear redo stack when a new action is performed
   - Limit stack size to configurable constant

3. **Undo Operation**:
   - Pop action from undo stack
   - Reverse the action (restore previous state)
   - Push action to redo stack
   - Trigger autosave with reverted state

4. **Redo Operation**:
   - Pop action from redo stack
   - Re-apply the action (restore new state)
   - Push action to undo stack
   - Trigger autosave with re-applied state

5. **UI Integration**:
   - Undo/Redo buttons in canvas toolbar
   - Buttons disabled when stacks are empty
   - Visual indication of available undo/redo

6. **Keyboard Shortcuts**:
   - Global listener for Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
   - Shortcuts should not conflict with browser undo in text fields
   - Consider focusing: only trigger game undo when not in a text input

### Architectural Considerations

- **Immutable State**: Actions should store immutable snapshots of affected data
- **Granularity**: Each user-perceived action should be one undoable unit
- **Cascade Deletes**: Undoing delete should restore item and all children
- **Reorder**: Store original positions for undo

### Key Risks

- **Memory Usage**: Large history can consume memory; enforce limits
- **Complex Actions**: Cascade deletes require storing all deleted items
- **Input Focus**: Keyboard shortcuts must not interfere with text editing

---

## 5. UX Considerations

### Loading States

- Undo/redo operations should feel instant
- No loading indicators needed for these operations

### Error States

- If undo/redo fails, show error notification
- State should remain consistent after error

### Mobile Considerations

- Undo/Redo buttons must be touch-accessible
- Consider gesture support (shake to undo) as a future enhancement
- Keyboard shortcuts not available on mobile — buttons are primary interface

### User Experience

- Undo feels safe — encourages experimentation
- Users can undo a deletion immediately
- Clear visual feedback when undo/redo is performed
- Disabled buttons clearly indicate when no undo/redo is available

---

## 6. Acceptance Criteria

### Undo Functionality

- [ ] Undo button is visible in the canvas UI
- [ ] Undo button is disabled when history is empty
- [ ] Clicking Undo reverses the last action
- [ ] Undoing a create removes the created item
- [ ] Undoing a delete restores the deleted item(s)
- [ ] Undoing an edit restores the previous values
- [ ] Undoing a reorder restores the previous order
- [ ] Undo triggers autosave

### Redo Functionality

- [ ] Redo button is visible in the canvas UI
- [ ] Redo button is disabled when redo history is empty
- [ ] Clicking Redo re-applies the undone action
- [ ] Redo triggers autosave

### Keyboard Shortcuts

- [ ] Ctrl/Cmd+Z triggers Undo
- [ ] Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y triggers Redo
- [ ] Shortcuts do not interfere with text input undo
- [ ] Shortcuts work when canvas is focused

### History Management

- [ ] New actions clear the redo stack
- [ ] History is limited to configurable number of actions
- [ ] Oldest actions are discarded when limit is exceeded
- [ ] History is session-only (cleared on page refresh)

### Actions Covered

- [ ] Create Period is undoable
- [ ] Create Event is undoable
- [ ] Create Scene is undoable
- [ ] Delete Period is undoable (restores children)
- [ ] Delete Event is undoable (restores children)
- [ ] Delete Scene is undoable
- [ ] Edit name is undoable
- [ ] Edit description is undoable
- [ ] Edit tone is undoable
- [ ] Reorder is undoable
- [ ] Edit game metadata is undoable

### UI Feedback

- [ ] Undo/Redo buttons show enabled/disabled state clearly
- [ ] Some indication is given when undo/redo is performed (optional toast or visual flash)

---

## 7. Notes

Undo/redo is a key safety feature. It should:

- Just work — no edge cases where it fails silently
- Feel instant — no delay between click and result
- Be discoverable — buttons should be prominent enough to find

Test thoroughly:

- Undo immediately after creating an item
- Undo immediately after deleting an item
- Multiple undos in a row
- Undo, then make a new change, then try to redo (should be disabled)
