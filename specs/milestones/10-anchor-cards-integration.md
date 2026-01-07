# Milestone 10: Anchor Cards Integration (Microscope Chronicle)

## 1. Purpose

This milestone implements **Anchor Cards** from _Microscope: Chronicle_, a playtest expansion that adds a new mechanic to focus gameplay around recurring characters.

This milestone exists to:

- Add support for Chronicle's anchor card mechanic
- Enable character-focused play sessions
- Integrate anchor cards seamlessly into the existing canvas layout
- Maintain data integrity and backward compatibility with classic Microscope

---

## 2. Scope

### Included

- **Anchor Character Management**:
  - Create new anchor characters
  - Edit anchor character details (name, description)
  - Delete anchor characters
  - Reuse existing anchors across multiple rounds

- **Anchor Data Model**:
  - Anchor character entity in game state
  - Anchor placement tracking (which Period is currently anchored)
  - Round-based anchor history
  - Optional: notes/context for each anchor usage

- **Anchor Card UI**:
  - Visual anchor card component
  - Distinct visual design from Period/Event/Scene cards
  - Character-focused aesthetic (portrait-oriented, name-prominent)
  - Indicator for "current anchor" vs. historical anchors

- **Anchor Placement & Management**:
  - Place anchor on a Period card (visual attachment/association)
  - Only one "active" anchor per round
  - Clear visual indication of which Period has the current anchor
  - View all anchor placements in game history

- **Canvas Integration**:
  - Anchor cards displayed near/on their associated Period
  - Non-intrusive placement that doesn't break existing layout
  - Mobile-friendly positioning
  - Zoom-aware sizing and positioning

- **Anchor Selection Workflow**:
  - UI to select an anchor for the current round
  - Choose from existing anchors or create new one
  - Associate selected anchor with a specific Period
  - Clear current anchor to end round focus

- **Anchor List/Library**:
  - View all created anchors in the game
  - Access via header menu or canvas UI
  - Quick selection of existing anchors
  - Edit anchor details from library

- **Export Support**:
  - Include anchor data in JSON export
  - Include anchor information in Markdown export
  - Schema versioning for anchor data

### Not Included

- Enforcement of Chronicle-specific game rules
- Automatic round tracking
- Player turn management
- Anchor card templates or presets
- Visual character portraits/images
- Multi-anchor selection (only one anchor active per round)

---

## 3. Dependencies

- **Milestone 01–05** — Foundation, canvas, editing
- **Milestone 07: Import & Export** — Export format extension
- Assumes core canvas layout and editing system is stable

---

## 4. Implementation Strategy

### High-Level Approach

1. **Data Model Extension**:
   - Add `Anchor` interface to game types
   - Add `anchors: Anchor[]` to Game interface
   - Add `currentAnchorId: string | null` to Game interface
   - Add `anchorPlacements: AnchorPlacement[]` to track placement history
   - Update schema version when anchor data is added

2. **Anchor Entity Design**:
   ```typescript
   interface Anchor {
     id: string;
     name: string;
     description?: string;
     createdAt: string;
     updatedAt: string;
   }
   
   interface AnchorPlacement {
     id: string;
     anchorId: string; // Reference to Anchor
     periodId: string; // Period this anchor is placed on
     roundNumber?: number; // Optional round tracking
     notes?: string;
     createdAt: string;
   }
   ```

3. **Visual Design**:
   - **Card Shape**: Small, portrait-oriented card (similar to Scene cards in size)
   - **Color Scheme**: Distinct from tone colors (e.g., accent color, gold/amber border)
   - **Icon**: Character/person icon to distinguish from timeline items
   - **Typography**: Prominent character name, smaller description
   - **Placement**: Positioned near top-right or overlapping the Period card edge
   - **Active Indicator**: Visual badge or glow for the current anchor

4. **Canvas Placement Strategy**:
   - Option A: **Overlay on Period Card** — Anchor card overlays the top-right corner of Period card
   - Option B: **Adjacent to Period Card** — Anchor card floats beside the Period card
   - **Recommended**: Option A (overlay) for space efficiency and clear association
   - Use CSS `position: absolute` within Period card container
   - Ensure anchor card doesn't obscure critical Period information
   - Z-index management to keep anchor visible

5. **Anchor Management UI**:
   - Header button/menu item: "Anchors" or "Chronicle"
   - Opens sheet/modal showing all anchors in the game
   - From anchor library, user can:
     - View all existing anchors
     - Create new anchor
     - Edit anchor details
     - Delete anchor (with confirmation if currently in use)
     - Select anchor for current round

6. **Anchor Selection Workflow**:
   - "Set Anchor" button in canvas UI or anchor library
   - Opens dialog to:
     - Select existing anchor from list OR create new one
     - Select which Period to anchor to
     - Add optional round notes
   - Once set, anchor card appears on selected Period
   - Only one anchor can be "current" at a time
   - Setting a new anchor automatically clears the previous current anchor

7. **Current Anchor Indicator**:
   - Active anchor has visual distinction (border glow, badge, or color)
   - Inactive/historical anchors shown with muted styling
   - Option to toggle visibility of historical anchor placements

8. **Action System Integration**:
   - Create anchor action
   - Edit anchor action
   - Delete anchor action
   - Set current anchor action
   - Clear current anchor action
   - All actions support undo/redo

9. **Export Format**:
   - JSON: Include `anchors` array and `anchorPlacements` array
   - Markdown: Add "Anchors" section listing all anchors with their descriptions
   - Markdown: Indicate anchor placements in Period descriptions (e.g., "⚓ Anchor: [Character Name]")

10. **Migration Strategy**:
    - Increment schema version when anchor data is introduced
    - Older games without anchors remain valid (empty arrays)
    - Anchor data is optional and non-breaking

### Architectural Considerations

- **Separation of Concerns**: Anchor cards are distinct from timeline items (Period/Event/Scene)
- **Reusability**: Same anchor character can be used multiple times across the game
- **Temporal Tracking**: Anchor placements track when and where an anchor was used
- **Visual Hierarchy**: Anchor cards should be visible but not dominate the timeline
- **Performance**: Minimize re-renders when toggling anchor visibility
- **Accessibility**: Anchor cards must be keyboard navigable and screen-reader friendly

### Key Risks

- **Layout Complexity**: Adding anchor cards to Period cards may complicate layout
- **Visual Clutter**: Multiple anchor placements could clutter the timeline
- **Confusion with Legacies**: Anchors are similar to Legacies; must differentiate clearly
- **Backward Compatibility**: Must not break existing games or exports

---

## 5. UX Considerations

### Loading States

- Anchor library loads with game state
- No separate loading state needed (part of game data)

### Error States

- Cannot set anchor if no Periods exist (show message: "Create a Period first")
- Cannot delete anchor if it's the current anchor (require clearing first or show confirmation)
- Invalid anchor placement data should not crash; show error and skip rendering

### Mobile Considerations

- Anchor cards must be touch-friendly (minimum 44x44px tap target)
- Anchor overlay must not obscure Period card text on small screens
- Anchor library sheet must be full-screen on mobile
- Consider collapsible view of historical anchors on mobile

### User Experience

- **Discoverability**: Anchor feature should be easy to find for Chronicle users
- **Optional**: Classic Microscope users should not be confused by anchor UI
- **Clarity**: Clearly communicate what an anchor is and how it works
- **Flexibility**: Support both Chronicle (anchor-focused) and classic Microscope play
- **Visual Feedback**: Current anchor should be immediately obvious on the timeline

### Differentiation from Legacies

Anchors and Legacies serve different purposes:

- **Legacy**: A recurring element (character, place, organization) that persists through history
- **Anchor**: A specific character chosen to focus the current round of play

Differences:

- Anchors are placed on/near Periods visually
- Only one anchor is "active" at a time
- Anchors have a visual card representation on the canvas
- Legacies are tracked in a separate list, not visually on the timeline

The UI should make this distinction clear, possibly through:

- Different icons (Anchor uses ⚓ or person icon, Legacy uses 🏛️ or legacy icon)
- Different visual styling
- Separate management screens
- Clear labeling in help documentation

---

## 6. Acceptance Criteria

### Data Model

- [ ] `Anchor` interface is defined in game types
- [ ] `AnchorPlacement` interface is defined
- [ ] Game interface includes `anchors` array
- [ ] Game interface includes `currentAnchorId` field
- [ ] Game interface includes `anchorPlacements` array
- [ ] Schema version is incremented
- [ ] Helper functions created: `createNewAnchor()`, `createAnchorPlacement()`

### Anchor Management

- [ ] User can create a new anchor character
- [ ] User can edit anchor name and description
- [ ] User can delete an anchor (with confirmation)
- [ ] Deleting an anchor removes associated placements
- [ ] All anchor changes trigger autosave

### Anchor Library UI

- [ ] "Anchors" menu item exists in header or canvas UI
- [ ] Anchor library shows all created anchors
- [ ] Anchor library allows creating new anchors
- [ ] Anchor library allows editing existing anchors
- [ ] Anchor library allows deleting anchors
- [ ] Anchor library is accessible on mobile

### Anchor Selection & Placement

- [ ] User can set an anchor for the current round
- [ ] Anchor selection shows list of existing anchors
- [ ] Anchor selection allows creating new anchor inline
- [ ] User selects which Period to anchor to
- [ ] Only one anchor can be current at a time
- [ ] Setting new anchor clears previous current anchor
- [ ] User can clear current anchor manually

### Anchor Card Visual Design

- [ ] Anchor card component is created
- [ ] Anchor card has distinct visual design (not confused with Period/Event/Scene)
- [ ] Anchor card shows character name
- [ ] Anchor card shows description (if present)
- [ ] Current anchor has visual distinction (glow, badge, or color)
- [ ] Anchor card is zoom-aware (scales with canvas zoom)

### Canvas Integration

- [ ] Anchor card appears on/near the anchored Period
- [ ] Anchor card placement doesn't obscure Period information
- [ ] Anchor card is clickable/tappable to view details
- [ ] Multiple historical anchor placements can be shown
- [ ] Option to toggle historical anchor visibility exists
- [ ] Anchor cards work on mobile (touch-friendly)

### Action System Integration

- [ ] Create anchor action implemented
- [ ] Edit anchor action implemented
- [ ] Delete anchor action implemented
- [ ] Set current anchor action implemented
- [ ] Clear current anchor action implemented
- [ ] All anchor actions support undo/redo

### Export Support

- [ ] Anchor data included in JSON export
- [ ] Anchor data correctly imported from JSON
- [ ] Anchors section added to Markdown export
- [ ] Anchor placements indicated in Markdown Period descriptions
- [ ] Schema migration handles older games without anchor data

### Accessibility

- [ ] Anchor cards are keyboard navigable
- [ ] Anchor cards have proper ARIA labels
- [ ] Anchor library is screen-reader friendly
- [ ] Focus management works correctly

### Help & Documentation

- [ ] Help dialog updated to explain anchor cards
- [ ] Difference between anchors and legacies explained
- [ ] Anchor workflow documented

---

## 7. Implementation Phases

To break this milestone into manageable chunks, implement in phases:

### Phase 1: Data Model & Actions (Foundation)

- Define `Anchor` and `AnchorPlacement` interfaces
- Update `Game` interface
- Create anchor CRUD actions
- Update schema version
- Write unit tests for anchor data model

### Phase 2: Anchor Management UI

- Create anchor library component (sheet/modal)
- Implement anchor list view
- Implement create/edit/delete workflows
- Add "Anchors" menu item to header

### Phase 3: Anchor Card Component

- Design and implement anchor card component
- Add visual styling (distinct from other cards)
- Implement current/historical anchor states
- Add zoom-aware sizing

### Phase 4: Canvas Integration

- Implement anchor card placement on Period cards
- Handle anchor selection workflow
- Add "Set Anchor" UI
- Integrate with canvas zoom/pan

### Phase 5: Export & Import

- Add anchor data to JSON export
- Handle anchor import
- Add anchors to Markdown export
- Test schema migration

### Phase 6: Polish & Testing

- Add undo/redo support
- Add accessibility improvements
- Update help documentation
- Test on mobile devices
- Final UX polish

---

## 8. Notes

### Design Philosophy

Anchor cards should feel like a **natural extension** of Microscope, not a tacked-on feature. They should:

- Enhance Chronicle play without disrupting classic Microscope
- Be visually distinct but harmonious with the existing aesthetic
- Provide value without adding complexity for users who don't use them
- Respect the "structure without enforcement" principle

### Alternative Design Considerations

**Alternative Placement Options**:

1. **Top of canvas**: Anchor cards in a dedicated row above Periods
   - Pros: Clear separation, no layout conflicts
   - Cons: Disconnected from Periods, wastes vertical space

2. **Sidebar**: Anchor cards in a sidebar or panel
   - Pros: Doesn't affect timeline layout
   - Cons: Less visually connected to the timeline

3. **Inline with Periods**: Anchor cards as separate columns
   - Pros: Part of the timeline flow
   - Cons: Breaks Period-only horizontal layout

**Recommended**: Overlay on Period card (as specified in main design) for best visual association and space efficiency.

### Future Enhancements (Beyond v1)

- Anchor card visual portraits/images
- Auto-suggest anchors based on Scene characters
- Anchor timeline view (show all placements chronologically)
- Multiple active anchors (if Chronicle rules evolve)
- Anchor-specific notes/journaling

---

## 9. Success Criteria

This milestone is successful if:

- Users can create, edit, and delete anchor characters
- Users can set an anchor for the current round and associate it with a Period
- Anchor cards are clearly visible on the canvas
- The distinction between anchors and legacies is clear
- Classic Microscope users are not confused by anchor features
- Chronicle users can effectively use anchors to focus play
- Anchor data is preserved in exports and imports
- The feature feels polished and integrated, not bolted-on
