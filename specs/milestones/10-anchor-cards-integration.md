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
  - Character-focused aesthetic (landscape-oriented, name-prominent)
  - Indicator for "current anchor" vs. historical anchors
  - "Hand of cards" stacking behavior for multiple anchors on one Period

- **Anchor Placement & Management**:
  - Place multiple anchor cards on a single Period card (visual attachment/association)
  - Multiple anchors can be placed on one Period simultaneously
  - Only one "active" anchor per round across all Periods
  - Clear visual indication of which anchor is currently active
  - View all anchor placements in game history
  - "Hand of cards" stacking with intelligent overlap and z-ordering

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
   - **Card Shape**: Landscape-oriented card (wider than tall, similar to Event cards)
   - **Color Scheme**: Distinct from tone colors (e.g., accent color, gold/amber border)
   - **Icon**: Character/person icon to distinguish from timeline items
   - **Typography**: Prominent character name, smaller description
   - **Placement**: Overlapping at top edge of Period card in "hand of cards" formation
   - **Active Indicator**: Visual badge or glow for the current anchor (active anchor always on top of stack)
   - **Hover Behavior**: When hovering over any anchor card, it temporarily moves to top of z-index order for full readability (like digital card games)

4. **Canvas Placement Strategy - "Hand of Cards" Stacking**:
   
   Multiple anchor cards can be placed on a single Period, stacking horizontally like a hand of cards:
   
   - **Single Anchor**: 
     - Positioned slightly overlapping the top-right corner of Period card
     - Approximately 20-30% of card extends above Period top edge
   
   - **Two Anchors**:
     - Newest anchor: Positioned at top-left area of Period (leftmost)
     - First anchor: Positioned at top-right area of Period (rightmost)
     - Newest anchor overlaps and appears on top (higher z-index)
     - Cards span from left to right edge of Period width
   
   - **Three or More Anchors**:
     - Cards distributed evenly across Period width
     - Newest anchor: Leftmost position (highest z-index)
     - Oldest anchor: Rightmost position (lowest z-index)
     - Middle anchors: Evenly spaced between newest and oldest
     - Each card overlaps the one to its right
     - Overlap amount adjusts based on total number of cards
     - Cards never exceed Period width horizontally
   
   - **Active Anchor Priority**:
     - If the active anchor is among the cards on a Period, it appears on top of the stack (highest z-index)
     - Active anchor positioned leftmost if it's the newest, otherwise brought to front visually
   
   - **Overlap Calculation**:
     - Formula: `overlap = (PeriodWidth - AnchorCardWidth) / (numberOfAnchors - 1)`
     - Ensures all cards fit within Period width
     - Overlap amount is fully dynamic based on number of anchors
     - Each card reveals enough to be identifiable and clickable
     - Hover elevates card to top z-index for full readability
   
   - **Hover Interaction**:
     - On mouse hover (or touch-and-hold on mobile), the hovered card temporarily rises to highest z-index
     - Card smoothly transitions to front of stack
     - Returns to original position when hover ends
     - Similar to digital card game hand interactions
     - Allows full readability regardless of overlap amount
   
   - **Implementation Details**:
     - Use CSS `position: absolute` within Period card container
     - Z-index determined by order (newest/active = highest)
     - Hover state adds temporary z-index boost (e.g., z-index: 9999)
     - Transform/translate for horizontal positioning
     - Smooth transitions when cards are added/removed or hovered
     - Touch targets remain accessible (44x44px minimum)

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
   - Once set, anchor card appears on selected Period in "hand of cards" formation
   - Multiple anchors can exist on the same Period (stacked horizontally)
   - Only one anchor can be "current/active" at a time across all Periods
   - Setting a new anchor automatically clears the previous current anchor
   - Anchors can be added to Periods that already have anchors (they stack)

7. **Current Anchor Indicator**:
   - Active anchor has visual distinction (border glow, badge, or color)
   - Active anchor appears on top of stack (highest z-index) when on a Period with multiple anchors
   - Inactive/historical anchors shown with muted styling
   - Option to toggle visibility of historical anchor placements
   - Stacking order: Active anchor > Newest anchor > Older anchors

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
- **Performance**: Minimize re-renders when toggling anchor visibility or reordering stacks
- **Accessibility**: Anchor cards must be keyboard navigable and screen-reader friendly
- **Stacking Logic**: Dynamic overlap calculation based on number of cards per Period
- **Z-Index Management**: Clear ordering rules (active > newest > older)

### Key Risks

- **Layout Complexity**: "Hand of cards" stacking with dynamic overlap requires careful CSS positioning
- **Visual Clutter**: Multiple anchor placements on one Period could clutter the timeline if not properly balanced
- **Overlap Calculation**: Must handle edge cases (1-10+ anchors on one Period) gracefully
- **Touch Targets**: Overlapping cards must maintain accessible tap targets on mobile (44x44px minimum)
- **Confusion with Legacies**: Anchors are similar to Legacies; must differentiate clearly
- **Backward Compatibility**: Must not break existing games or exports
- **Performance**: Re-calculating positions for large stacks could impact performance

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
- Touch-and-hold gesture brings card to front (equivalent to hover on desktop)
- Consider collapsible view of historical anchors on mobile

### User Experience

- **Discoverability**: Anchor feature should be easy to find for Chronicle users
- **Optional**: Classic Microscope users should not be confused by anchor UI
- **Clarity**: Clearly communicate what an anchor is and how it works
- **Flexibility**: Support both Chronicle (anchor-focused) and classic Microscope play
- **Visual Feedback**: Current anchor should be immediately obvious on the timeline
- **Hover Interaction**: Hovering over stacked cards brings them to front for full readability (like digital card games)
- **Smooth Animations**: Card transitions should be fluid and non-jarring

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
- [ ] Multiple anchors can be placed on the same Period
- [ ] Only one anchor can be current/active at a time across all Periods
- [ ] Setting new anchor clears previous current anchor
- [ ] User can clear current anchor manually

### Anchor Card Visual Design

- [ ] Anchor card component is created (landscape-oriented)
- [ ] Anchor card has distinct visual design (not confused with Period/Event/Scene)
- [ ] Anchor card shows character name
- [ ] Anchor card shows description (if present)
- [ ] Current anchor has visual distinction (glow, badge, or color)
- [ ] Anchor card is zoom-aware (scales with canvas zoom)
- [ ] Cards use landscape orientation (wider than tall)

### Canvas Integration - "Hand of Cards" Stacking

- [ ] Single anchor appears at top-right of Period card with slight overlap
- [ ] Two anchors stack horizontally (newest left, oldest right)
- [ ] Three or more anchors distribute evenly across Period width
- [ ] Overlap amount adjusts dynamically based on number of cards (fully dynamic, no minimum)
- [ ] Cards never exceed Period width horizontally
- [ ] Active anchor always appears on top (highest z-index) when in a stack
- [ ] Newest anchor is leftmost in stack (unless active anchor takes priority)
- [ ] Each card overlaps the one to its right
- [ ] Hovering over any card temporarily brings it to top z-index for full readability
- [ ] Hover transition is smooth and immediate
- [ ] Card returns to original z-index when hover ends
- [ ] Anchor card placement doesn't obscure critical Period information
- [ ] Anchor cards are clickable/tappable to view details
- [ ] Overlapping cards maintain minimum 44x44px touch targets on mobile
- [ ] Touch-and-hold on mobile brings card to front (equivalent to hover)
- [ ] Multiple historical anchor placements can be shown
- [ ] Option to toggle historical anchor visibility exists
- [ ] Anchor cards work on mobile (touch-friendly)
- [ ] Z-index ordering is correct (active > newest > older, unless hovering)
- [ ] Smooth transitions when cards are added/removed from stack

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
- [ ] Overlapping cards can be accessed via keyboard (tab through stack)
- [ ] Anchor library is screen-reader friendly
- [ ] Focus management works correctly
- [ ] Screen readers announce position in stack (e.g., "Card 1 of 3")

### Help & Documentation

- [ ] Help dialog updated to explain anchor cards
- [ ] Difference between anchors and legacies explained
- [ ] Anchor workflow documented
- [ ] "Hand of cards" stacking behavior explained
- [ ] Active anchor priority documented
- [ ] Hover interaction documented (hover to reveal full card)

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

- Design and implement anchor card component (landscape-oriented)
- Add visual styling (distinct from other cards)
- Implement current/historical anchor states
- Add zoom-aware sizing
- Design active anchor indicator
- Implement hover state with z-index elevation

### Phase 4: Canvas Integration & Stacking Logic

- Implement "hand of cards" stacking behavior
- Calculate dynamic overlap based on number of cards (fully dynamic, no minimum)
- Implement z-index ordering (active > newest > older, hover overrides)
- Handle anchor card placement on Period cards
- Implement positioning algorithm:
  - Single anchor: top-right with slight overlap
  - Two anchors: left-to-right distribution
  - Three+ anchors: even distribution with dynamic overlap
- Implement hover interaction:
  - Mouse hover elevates card to top z-index
  - Touch-and-hold equivalent for mobile
  - Smooth transitions in/out of hover state
- Handle anchor selection workflow
- Add "Set Anchor" UI
- Integrate with canvas zoom/pan
- Ensure cards never exceed Period width
- Add smooth transitions for card additions/removals and hover effects

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

**Alternative Placement Options Considered**:

1. **Top of canvas**: Anchor cards in a dedicated row above Periods
   - Pros: Clear separation, no layout conflicts
   - Cons: Disconnected from Periods, wastes vertical space

2. **Sidebar**: Anchor cards in a sidebar or panel
   - Pros: Doesn't affect timeline layout
   - Cons: Less visually connected to the timeline

3. **Inline with Periods**: Anchor cards as separate columns
   - Pros: Part of the timeline flow
   - Cons: Breaks Period-only horizontal layout

4. **Single card overlay**: Only one anchor per Period at top-right
   - Pros: Simpler implementation, cleaner look
   - Cons: Cannot show multiple anchors on same Period, loses historical context

**Selected**: "Hand of cards" overlay stacking on Period cards for best visual association, space efficiency, and ability to show multiple anchors per Period while maintaining clear hierarchy.

**Stacking Behavior Rationale**:

The "hand of cards" metaphor provides:
- Visual clarity about which anchors are associated with each Period
- Efficient use of space (cards overlap rather than spreading horizontally)
- Clear z-ordering hierarchy (active anchor always visible on top)
- Intuitive visual language (newest left, oldest right, like dealing cards)
- Scalability (works with 1-10+ anchors per Period)
- Hover-to-reveal interaction borrowed from digital card games for full readability
- Fully dynamic overlap allows maximum space efficiency without losing information

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
- Multiple anchors can be placed on a single Period with clear visual stacking
- Anchor cards are clearly visible on the canvas in "hand of cards" formation
- Hovering over any anchor card brings it to the front for full readability (like digital card games)
- Active anchor is immediately identifiable (on top of stack)
- The distinction between anchors and legacies is clear
- Classic Microscope users are not confused by anchor features
- Chronicle users can effectively use anchors to focus play
- Anchor data is preserved in exports and imports
- Stacking behavior works smoothly with 1-10+ anchors per Period
- Hover interactions feel smooth and responsive
- The feature feels polished and integrated, not bolted-on
