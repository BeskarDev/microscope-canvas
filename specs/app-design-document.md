# Microscope Worldbuilding App — v1 Design Document

## 1. Purpose of This Document

This document defines the **complete vision, scope, constraints, and requirements** for **v1** of a client-side web application for the tabletop RPG *Microscope*.

Its goals are:

* Preserve the **core product vision**
* Prevent **scope creep**
* Ensure **UX, persistence, and reliability** are first-class concerns
* Provide a stable reference for milestone planning and implementation

This document intentionally avoids low-level technical specifications and code.

---

## 2. Product Vision

### 2.1 What This App Is

A **local-first, asynchronous worldbuilding notebook** for the game *Microscope*.

It is:

* Archive-first
* Single-player focused
* Structure-providing but rules-agnostic
* Designed for long-lived creative projects

### 2.2 What This App Is Not

* Not a multiplayer or live collaboration tool
* Not a turn-enforcing rules engine
* Not a freeform infinite whiteboard
* Not a cloud-synced or account-based service

---

## 3. Target User

**Primary user:**

* GM or solo worldbuilder using Microscope

**Usage pattern:**

* Works on a world over many sessions
* Expects data safety and exportability
* Values clarity, density, and efficiency over visual flair

---

## 4. Core Principles

These principles must guide all decisions:

1. **Local-first & user-owned data**
2. **Structure without enforcement**
3. **Predictable, readable layout**
4. **Undoable creative actions**
5. **Mobile parity, not mobile compromise**
6. **Failure-safe UX** (loading, error, recovery states)

---

## 5. App Architecture Overview (Conceptual)

### 5.1 App-Level Structure

* Static web app
* Entirely client-side
* No backend services
* No authentication

### 5.2 High-Level Views

1. **Home Screen**

   * List existing games
   * Create new game
   * Import game
2. **Game Canvas View**

   * Structured timeline canvas
   * Editing & navigation
3. **Global UI**

   * Header
   * Help dialog
   * Error notifications

---

## 6. Canvas & Layout System

### 6.1 Layout Model

The canvas represents a **structured timeline**, not free spatial placement.

* **Periods (Eras)**:

  * Horizontal axis
  * Larger, portrait-oriented cards
* **Events**:

  * Vertically stacked under a Period
  * Smaller, landscape-oriented cards
* **Scenes**:

  * Vertically stacked under Events
  * Smaller, portrait-oriented cards

The layout automatically adapts when:

* Items are added
* Items are removed
* Items are reordered

### 6.2 Canvas Behavior

* HTML-based layout (no SVG, no WebGL)
* Pan by dragging the background
* No infinite zoom
* Zoom-out only, for overview
* Zoom controlled by visible (+)/(–) buttons
* Same behavior on desktop and mobile

---

## 7. Visual Design Language

### 7.1 Cards

* Slight border
* Subtle box shadow
* Index-card aesthetic
* Dense layout (power-user oriented)
* Supports 1–4 lines of readable text at normal font size

### 7.2 Hierarchy

* Periods visually dominant
* Events secondary
* Scenes tertiary
* Clear visual grouping

### 7.3 Color & Background

* Black/white Microscope aesthetic
* Muted accent colors
* Background:

  * Soft, blurred black-and-white “starry night sky”
  * Non-distracting
  * Always lower contrast than cards

---

## 8. Interaction Model

### 8.1 Primary Interaction

* Mouse / touch first
* Click / tap to interact
* Drag to reorder within structural constraints

### 8.2 Item Creation

* Non-intrusive (+) buttons:

  * Between Periods
  * At timeline ends
  * Under Event/Scene stacks
* Buttons insert new items at that exact structural location

### 8.3 Discovery

* Minimal UI chrome
* Help button in app header
* Help opens a structured text dialog explaining:

  * Microscope concepts
  * App usage
  * Canvas interactions

---

## 9. Microscope Data Coverage

The app must support **all canonical Microscope data**, including:

* Periods
* Events
* Scenes
* Light / Dark tone
* Focus
* Legacy
* Notes / flavor text

Rules are **not enforced**, but all data must be editable.

---

## 10. State Management & History

### 10.1 Game State

* Each game is its own isolated state instance
* No shared global game state

### 10.2 Undo / Redo

* Action-based (game actions only)
* Covers:

  * Creating items
  * Deleting items
  * Editing text
  * Changing tone/state
* Limited to last **X** actions (configurable constant)
* Session-only

### 10.3 History

* Snapshot-based save history
* Each autosave creates a version
* User can:

  * View older versions
  * Restore a version
* Restored versions replace current state

---

## 11. Persistence Strategy

### 11.1 Primary Persistence

* IndexedDB
* Autosave on every game action
* No manual “Save” button

### 11.2 Save Format

* Canonical format: **JSON**
* Must include:

  * `schemaVersion`
  * All game data
  * Layout-relevant metadata
* Designed for:

  * Frequent reads/writes
  * Forward-compatible migrations

---

## 12. Import & Export

### 12.1 Import

* Import from JSON file
* Imported game becomes a **new local game**
* No overwriting existing games
* Drag-and-drop support preferred

### 12.2 Export

Two export formats:

1. **Technical Export**

   * JSON
   * Full fidelity
   * Intended for backup and transfer

2. **User-Facing Export**

   * Markdown
   * Nested list structure:

     * Periods

       * Events

         * Scenes
   * ASCII indicators for:

     * Tone (Light/Dark)
     * Hierarchy

No Mermaid, no print export in v1.

---

## 13. Mobile Support

* Mobile is a first-class target
* Full feature parity with desktop
* Touch-friendly hit targets
* Zoom only via UI buttons
* Same interaction logic across devices

---

## 14. Loading, Error & Recovery UX

These states must be explicitly designed and implemented.

### 14.1 Loading

* Initial app load
* Game load
* Import processing

### 14.2 Error States

* Corrupted save file
* Failed import
* IndexedDB failure
* Schema mismatch

Errors must:

* Be clearly explained
* Never silently fail
* Never destroy existing data

### 14.3 Recovery

* Graceful fallback when possible
* Clear messaging when recovery is not possible
* Encourage export/backup when issues occur

---

## 15. Limits & Safeguards

* Periods per game: soft cap (e.g. 1024)
* Events / scenes: similar soft caps
* Limits exist purely as technical safeguards
* Must never realistically constrain normal use

---

## 16. Deletion Philosophy

* Deletions are undoable within undo window
* After undo window:

  * Deletion is permanent
* No trash bin in v1

---

## 17. Explicitly Out of Scope (v1)

* Multiplayer / collaboration
* Cloud sync
* Accounts / authentication
* Rule enforcement
* Printing
* Mermaid diagrams
* Real-time sharing
* Server-side components

---

## 18. Milestone Philosophy

Milestones should:

* Deliver vertical slices
* Always include UX states (loading, error)
* Preserve data integrity at every step
* Avoid “temporary” shortcuts that become permanent

---

## 19. Success Criteria for v1

v1 is successful if:

* A user can create, edit, and evolve a Microscope world over weeks
* Data is never unexpectedly lost
* Exported data is readable and reusable
* The app feels calm, predictable, and reliable
* Mobile usage feels intentional, not compromised

---

## 20. Final Note to the Implementing Agent

This document is the **source of truth** for v1.

If a decision is not explicitly described here:

* Prefer simplicity
* Prefer local-first
* Prefer user control
* Prefer data safety

Do not introduce:

* New scope
* New dependencies
* New persistence models
