# Milestone 04: Canvas Layout System

## 1. Purpose

This milestone implements the **visual canvas** where the Microscope timeline is displayed. It renders Periods, Events, and Scenes in a structured layout with pan and zoom functionality.

This milestone exists to:
* Transform abstract game data into a visual, interactive timeline
* Implement the core canvas interactions (pan, zoom)
* Establish the card-based visual hierarchy
* Enable users to see their world at a glance

---

## 2. Scope

### Included

* Canvas container with pan functionality (drag to pan)
* Zoom controls (visible +/– buttons)
* Zoom-out only for overview (no zoom-in beyond 100%)
* **Periods** rendered as vertical cards along horizontal axis
* **Events** rendered as smaller cards stacked vertically under their parent Period
* **Scenes** rendered as smallest cards stacked under their parent Event
* Card visual design:
  * Slight border
  * Subtle box shadow
  * Index-card aesthetic
  * 1–4 lines of readable text
* Visual hierarchy:
  * Periods visually dominant (largest)
  * Events secondary (medium)
  * Scenes tertiary (smallest)
* Tone indicators (Light/Dark) on cards
* Layout auto-adjusts when:
  * Items are added
  * Items are removed
  * Items are reordered (future milestone)
* Non-intrusive (+) buttons for adding items:
  * Between Periods
  * At timeline ends (before first, after last)
  * Under Event stacks (add Event to Period)
  * Under Scene stacks (add Scene to Event)
* Clicking (+) creates a placeholder item (minimal data)
* Card click/tap opens editing (editing UI in next milestone)
* Mobile touch support for pan

### Not Included

* Full editing UI (inline editing or modals)
* Drag-to-reorder functionality
* Undo/redo
* Focus/Legacy display
* Import/export

---

## 3. Dependencies

* **Milestone 01: Project Foundation** — Build system, CSS approach
* **Milestone 02: App Shell & Navigation** — App layout, routing to canvas view
* **Milestone 03: Game State & Persistence** — Game data model, loading game from IndexedDB

---

## 4. Implementation Strategy

### High-Level Approach

1. **Canvas Container**:
   * Full viewport area below header
   * Overflow hidden; content positioned via transform
   * Track pan offset (x, y translation)
   * Track zoom level (scale transform)

2. **Pan Interaction**:
   * Mouse: drag background to pan
   * Touch: drag (single finger) to pan
   * Update transform origin for smooth panning

3. **Zoom Interaction**:
   * Visible (+) and (–) buttons in corner
   * Discrete zoom levels (e.g., 100%, 75%, 50%, 25%)
   * No zoom beyond 100% (zoom-out only for overview)
   * Same controls on mobile and desktop

4. **Layout Algorithm**:
   * Periods arranged horizontally with consistent spacing
   * Events stacked vertically within Period column
   * Scenes stacked vertically within Event container
   * Use Flexbox or Grid; no absolute positioning
   * HTML-based layout (no SVG, no Canvas API, no WebGL)

5. **Card Components**:
   * `PeriodCard`: largest, portrait orientation, shows name and tone
   * `EventCard`: medium, landscape orientation, shows name and tone
   * `SceneCard`: smallest, portrait orientation, shows name
   * All cards show tone indicator (visual badge or border color)

6. **Add Buttons (+)**:
   * Small, unobtrusive buttons positioned between items
   * "Add Period" between Periods and at ends
   * "Add Event" below Events stack within a Period
   * "Add Scene" below Scenes stack within an Event
   * Clicking (+) creates new item with default name, triggers autosave

7. **Card Interaction**:
   * Click/tap card to signal intent to edit
   * Editing UI handled in next milestone; for now, log or show placeholder modal

### Architectural Considerations

* **Performance**: Minimize re-renders; memoize card components
* **Touch vs Mouse**: Abstract pointer events where possible
* **State Management**: Canvas view reads from game state; mutations trigger re-render and autosave
* **Responsiveness**: Cards and layout must work at various viewport sizes

### Key Risks

* **Complex Layout**: Timeline structure is hierarchical; ensure layout is robust
* **Pan/Zoom Conflicts**: Touch gestures must not conflict
* **Performance at Scale**: Test with many Periods/Events/Scenes

---

## 5. UX Considerations

### Loading States

* Canvas shows loading indicator while game data is being fetched
* Once loaded, timeline renders immediately

### Error States

* If game data is corrupted, show error message (do not crash)
* If individual item data is invalid, render placeholder card

### Mobile Considerations

* Pan via touch drag (no two-finger pan required)
* Zoom buttons are touch-friendly (44x44px minimum)
* Cards are legible at default zoom on mobile screens
* No hover-dependent interactions

### User Experience

* Timeline feels solid and structured, not floaty
* Pan and zoom feel smooth and predictable
* Adding an item is fast and doesn't interrupt flow
* Visual hierarchy makes the timeline scannable

---

## 6. Acceptance Criteria

### Canvas Container

- [ ] Canvas fills available viewport space
- [ ] Background is visible (starry night design)
- [ ] Canvas can be panned by dragging the background
- [ ] Pan works with mouse on desktop
- [ ] Pan works with touch on mobile
- [ ] Zoom level can be changed via (+) and (–) buttons
- [ ] Zoom is limited to zoom-out only (no zoom beyond 100%)
- [ ] Zoom buttons are visible and accessible

### Period Rendering

- [ ] Periods are displayed as vertical cards along horizontal axis
- [ ] Periods show their name
- [ ] Periods show tone indicator (Light/Dark)
- [ ] Periods have index-card visual style (border, shadow)
- [ ] Periods are the largest card type

### Event Rendering

- [ ] Events are displayed under their parent Period
- [ ] Events are stacked vertically
- [ ] Events show their name
- [ ] Events show tone indicator
- [ ] Events are medium-sized cards (smaller than Periods)

### Scene Rendering

- [ ] Scenes are displayed under their parent Event
- [ ] Scenes are stacked vertically
- [ ] Scenes show their name
- [ ] Scenes are the smallest card type

### Add Buttons

- [ ] (+) buttons appear between Periods
- [ ] (+) button appears before the first Period
- [ ] (+) button appears after the last Period
- [ ] (+) button appears below Events within a Period
- [ ] (+) button appears below Scenes within an Event
- [ ] Clicking (+) creates a new item with default values
- [ ] New items appear immediately in the layout
- [ ] New items are persisted via autosave

### Card Interaction

- [ ] Clicking/tapping a card registers the interaction
- [ ] Card click does not conflict with pan gesture

### Layout Behavior

- [ ] Layout adjusts when items are added
- [ ] Layout adjusts when items are removed
- [ ] Layout is HTML-based (no SVG, Canvas API, or WebGL)

### Visual Design

- [ ] Cards have subtle border and box shadow
- [ ] Visual hierarchy is clear (Period > Event > Scene)
- [ ] Dense layout supports power-user scanning
- [ ] Cards support 1–4 lines of text

### Performance

- [ ] Canvas remains responsive with 50+ cards
- [ ] Pan and zoom are smooth without jank

---

## 7. Notes

This milestone makes the app feel like a real product. The canvas is the core experience — invest in getting the feel right.

Key focus areas:
* Layout robustness
* Interaction smoothness
* Visual polish

Do not add editing features here; that's the next milestone.
