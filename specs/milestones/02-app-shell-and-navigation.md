# Milestone 02: App Shell & Navigation

## 1. Purpose

This milestone establishes the **application shell** — the foundational UI structure that contains all views. It implements the **Home Screen** and basic **navigation** between views.

This milestone exists to:
* Provide a working UI skeleton before game logic is added
* Establish navigation patterns used throughout the app
* Implement the first user-facing view (Home Screen)
* Set the visual design language baseline

---

## 2. Scope

### Included

* Global app layout structure (header, main content area)
* Home Screen view with:
  * Game list display (empty state initially)
  * "Create New Game" button (creates placeholder entry)
  * "Import Game" button (non-functional in this milestone)
* Basic routing between Home Screen and Game Canvas View (placeholder)
* App header with:
  * App title/logo
  * Help button (opens Help dialog)
* Help dialog with:
  * Microscope concepts explanation
  * App usage instructions
  * Canvas interaction guide
* Visual design baseline:
  * Black/white Microscope aesthetic
  * Muted accent colors
  * Soft, blurred starry night background
* Global error notification system (UI only, not wired to errors yet)
* Responsive layout foundation (mobile-first)

### Not Included

* Actual game state or persistence
* Functional import/export
* Game canvas implementation
* Undo/redo functionality
* Real game CRUD operations

---

## 3. Dependencies

* **Milestone 01: Project Foundation** — Requires working build system, component library, and CI/CD

---

## 4. Implementation Strategy

### High-Level Approach

1. **App Layout Component**:
   * Header with app title and help button
   * Main content area that renders routed views
   * Use CSS Grid or Flexbox for layout

2. **Routing**:
   * Client-side routing (React Router or equivalent)
   * Routes:
     * `/` — Home Screen
     * `/game/:id` — Game Canvas View (placeholder)

3. **Home Screen**:
   * Component that will eventually display game list
   * Empty state UI when no games exist
   * "Create New Game" button — for now, just logs or shows a placeholder
   * "Import Game" button — visually present, non-functional

4. **Help Dialog**:
   * Modal component triggered by Help button
   * Structured content explaining Microscope and app usage
   * Keyboard accessible (Escape to close)
   * Trap focus when open

5. **Visual Design System**:
   * Define CSS custom properties for colors, spacing, shadows
   * Background: blurred starry night (CSS gradient or static image)
   * Card styles preview (will be refined in Canvas milestone)

6. **Error Notification System**:
   * Toast/notification component
   * Positioned consistently (e.g., top-right or bottom-center)
   * Support for different severity levels (info, warning, error)
   * No actual errors wired yet — just the UI component

### Architectural Considerations

* Keep routing simple; avoid nested routes initially
* Design components for reusability (Button, Dialog, Card)
* Use semantic HTML for accessibility
* Ensure header and navigation work well on mobile

### Key Risks

* **Over-designing**: Keep the Home Screen simple; it will be enhanced when persistence is added
* **Accessibility gaps**: Ensure dialog and navigation are keyboard accessible from the start

---

## 5. UX Considerations

### Loading States

* Initial app load should show a brief loading indicator if needed
* Home Screen should render quickly (no heavy data fetching yet)

### Error States

* Error notification component is built but not triggered
* No actual error scenarios exist yet

### Mobile Considerations

* Header should collapse gracefully on small screens
* Touch-friendly button sizes (min 44x44px hit targets)
* Help dialog should be full-screen or near-full-screen on mobile

### User Experience

* First launch shows friendly empty state, not a blank screen
* Help is easily discoverable
* Visual design should feel calm and professional

---

## 6. Acceptance Criteria

### Navigation

- [ ] App loads at root URL (`/`)
- [ ] Home Screen is displayed by default
- [ ] Clicking a game (when available) navigates to `/game/:id`
- [ ] Back navigation returns to Home Screen
- [ ] Direct URL access to `/game/:id` shows placeholder canvas view

### Home Screen

- [ ] Empty state is displayed when no games exist
- [ ] "Create New Game" button is visible and clickable
- [ ] "Import Game" button is visible (can be disabled or show "coming soon")
- [ ] Game list area is present (empty initially)

### Header

- [ ] App title/logo is visible
- [ ] Help button is visible and clickable
- [ ] Header is present on all views

### Help Dialog

- [ ] Help button opens the Help dialog
- [ ] Dialog contains Microscope concept explanations
- [ ] Dialog contains app usage instructions
- [ ] Dialog can be closed via close button
- [ ] Dialog can be closed via Escape key
- [ ] Focus is trapped within the dialog when open
- [ ] Focus returns to Help button when dialog closes

### Visual Design

- [ ] Background has soft, blurred starry night aesthetic
- [ ] Color scheme follows black/white with muted accents
- [ ] Typography is readable and consistent
- [ ] Layout is responsive and works on mobile screens

### Error Notifications

- [ ] Notification component exists and can be triggered programmatically
- [ ] Notifications appear in a consistent location
- [ ] Notifications can be dismissed

### Accessibility

- [ ] All interactive elements are keyboard accessible
- [ ] Focus states are visible
- [ ] Semantic HTML is used appropriately
- [ ] No accessibility violations in automated checks

---

## 7. Notes

This milestone delivers the "shell" of the application. After this, a user can navigate the app, access help, and see where games will appear — but no actual game functionality exists yet.

The visual design established here sets the tone for the entire app. Take time to get the aesthetics right.
