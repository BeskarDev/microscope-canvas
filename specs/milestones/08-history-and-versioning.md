# Milestone 08: History & Versioning

## 1. Purpose

This milestone implements **snapshot-based version history**, allowing users to view and restore previous versions of their game. This provides long-term safety beyond the session-scoped undo system.

This milestone exists to:

- Provide a safety net for changes made across sessions
- Allow users to review how their world has evolved
- Enable recovery from unwanted changes made in past sessions
- Fulfill the "snapshot-based save history" requirement

---

## 2. Scope

### Included

- Automatic snapshot creation on each autosave
- Snapshot storage in IndexedDB (separate from current game state)
- Version list UI showing:
  - Timestamp of each version
  - Optional: summary of changes (if feasible)
- View a historical version (read-only preview)
- Restore a historical version:
  - Replaces current state
  - Creates a new snapshot of the current state before restore
- Configurable snapshot retention (e.g., last 50 snapshots per game)
- Snapshot cleanup when retention limit is exceeded
- Clear visual distinction between viewing current state and historical version

### Not Included

- Diff view between versions
- Branching or parallel timelines
- Manual save points with names
- Exporting specific historical versions

---

## 3. Dependencies

- **Milestone 01–03** — Foundation, shell, persistence
- **Milestone 04–06** — Canvas, editing, undo (snapshots capture state after these work)

---

## 4. Implementation Strategy

### High-Level Approach

1. **Snapshot Model**:
   - Define a `GameSnapshot` type:
     - `id`: unique identifier
     - `gameId`: reference to parent game
     - `timestamp`: when snapshot was taken
     - `data`: full game state at that moment
   - Store snapshots in a separate IndexedDB object store

2. **Automatic Snapshot Creation**:
   - On each autosave, also create a snapshot
   - Or: create snapshots on a debounced interval (e.g., every 30 seconds of activity)
   - Avoid creating duplicate snapshots for identical states

3. **Snapshot Storage**:
   - IndexedDB object store: `snapshots`
   - Index by `gameId` for efficient queries
   - Each game has its own snapshot history

4. **Version List UI**:
   - Accessible from canvas view (e.g., "History" button in menu)
   - Modal or sidebar listing snapshots
   - Show timestamp (formatted for readability)
   - Sorted newest-first

5. **View Historical Version**:
   - Clicking a snapshot shows that version in the canvas
   - Read-only mode: editing is disabled
   - Clear indicator that this is a historical view
   - "Return to current" button

6. **Restore Historical Version**:
   - "Restore this version" button on historical view
   - Before restoring, create a snapshot of current state (so restore is reversible)
   - Replace current game state with snapshot data
   - Update `updatedAt` timestamp
   - Return to normal editing mode

7. **Retention & Cleanup**:
   - Configurable limit (e.g., 50 snapshots per game)
   - When limit exceeded, delete oldest snapshots
   - Cleanup runs after each new snapshot

### Architectural Considerations

- **Storage Size**: Snapshots can be large; consider compression (future)
- **Performance**: Snapshot list should load quickly; paginate if needed
- **Data Integrity**: Snapshots must be complete and valid

### Key Risks

- **Storage Limits**: IndexedDB has quotas; handle gracefully
- **Performance with Many Snapshots**: Keep queries efficient
- **UX Clarity**: Users must understand they're viewing history vs. current

---

## 5. UX Considerations

### Loading States

- Show loading indicator while fetching snapshot list
- Show loading indicator while loading a historical version
- Show loading indicator during restore operation

### Error States

- **Snapshot Load Failure**: Show error, allow retry or return to current
- **Restore Failure**: Show error, do not modify current state
- **Storage Full**: Warn user, suggest exporting data

### Mobile Considerations

- History UI should be accessible and usable on mobile
- Modal/sidebar should be scrollable
- Touch-friendly restore and return buttons

### User Experience

- Accessing history is easy to find but not intrusive
- Viewing a historical version is clearly distinguished from editing
- Restoring feels intentional (confirmation may be appropriate)
- Users feel confident they can always go back

---

## 6. Acceptance Criteria

### Snapshot Creation

- [ ] Snapshots are created automatically on autosave
- [ ] Each snapshot includes full game state
- [ ] Snapshots include timestamp
- [ ] Snapshots are stored in IndexedDB
- [ ] Duplicate snapshots for identical states are avoided (optional optimization)

### Version List UI

- [ ] History button/menu item is available in canvas view
- [ ] Clicking opens a list of historical versions
- [ ] List shows timestamp for each version
- [ ] List is sorted newest-first
- [ ] List loads without significant delay

### View Historical Version

- [ ] Clicking a version shows that state in the canvas
- [ ] Canvas is in read-only mode (editing disabled)
- [ ] Clear visual indicator shows "Viewing version from {date}"
- [ ] "Return to current" button is visible and functional

### Restore Historical Version

- [ ] "Restore this version" button is available when viewing history
- [ ] Clicking restore shows confirmation (optional but recommended)
- [ ] Current state is snapshotted before restore
- [ ] Game state is replaced with historical version
- [ ] `updatedAt` is updated
- [ ] Canvas returns to normal editing mode

### Retention & Cleanup

- [ ] Snapshots are limited to configurable maximum per game
- [ ] Oldest snapshots are automatically deleted when limit is exceeded
- [ ] Cleanup does not affect current game state

### Storage Handling

- [ ] Storage quota warnings are handled gracefully
- [ ] User is informed if snapshots cannot be created

### Data Integrity

- [ ] Snapshots are complete and valid
- [ ] Restoring a snapshot produces a functional game state

---

## 7. Notes

History and versioning provide long-term data safety. Unlike undo (session-scoped), snapshots persist across sessions and give users confidence that they can always recover.

Key considerations:

- Keep the UI simple — history should feel supportive, not complex
- Snapshot creation should be invisible to the user
- Restoring should feel safe (pre-restore snapshot as safety net)

Test with:

- Games with many snapshots
- Restoring from very old snapshots
- Storage near quota limits
