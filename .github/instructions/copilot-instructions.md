---
description: 'Coding style and clean code guidelines for the Microscope Canvas repository'
applyTo: '**/*'
---

# Coding Style Guidelines

This document outlines the coding standards and clean code principles for the Microscope Canvas project.

## Clean Code Principles

### Single Responsibility Principle (SRP)

- Each component, function, or module should have one clear purpose
- Components should focus on UI rendering; extract business logic to services/composables
- If a file exceeds ~200 lines, consider splitting into smaller focused units

### DRY (Don't Repeat Yourself)

- Extract repeated logic into reusable functions or components
- Use composables/stores for shared state management
- Create utility functions for common operations

### Meaningful Names

- Use descriptive names that reveal intent
- Prefer `handleCreateGame()` over `create()` for event handlers
- Use consistent naming conventions: `onEventName` for callbacks, `handleEventName` for handlers
- Name boolean variables with `is`, `has`, `can` prefixes (e.g., `isLoading`, `hasErrors`)

### Small Functions

- Functions should be under 50 lines
- Each function should do one thing well
- Extract complex logic into separate helper functions
- Use early returns to reduce nesting

## Development Workflow

### Before Making Changes

1. Run `npm run lint` to check for existing lint errors
2. Run `npm run check` to verify TypeScript types
3. Understand the existing code structure

### After Making Changes

1. **Always** run `npm run lint` to ensure no lint errors
2. **Always** run `npm run check` to verify TypeScript types
3. Run `npm run test` to ensure tests pass
4. Run `npm run format` to format code with Prettier

### Configuration References

- TypeScript: `tsconfig.json`
- Svelte: `svelte.config.js`
- ESLint: `eslint.config.js`
- Prettier: `.prettierrc`

## File Organization

### Component Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # shadcn-svelte base components
│   │   └── canvas/     # Game canvas components
│   ├── services/       # Business logic and data operations
│   ├── stores/         # Svelte stores for state management
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Pure utility functions
│   └── hooks/          # Reusable composables/hooks
├── routes/             # SvelteKit file-based routing
│   └── game/[id]/      # Game page with sub-components
```

### Separation of Concerns

- **Components**: UI rendering, user interactions
- **Services**: Data persistence, API calls, business operations
- **Stores**: Global state management, undo/redo history
- **Utils**: Pure functions with no side effects
- **Hooks**: Reusable stateful logic (composables)

## Svelte 5 Patterns

### Use Runes

```typescript
// State
let count = $state(0);
let items = $state<string[]>([]);

// Derived values
const total = $derived(items.length);

// Effects
$effect(() => {
  console.log('Count changed:', count);
});

// Props
interface Props {
  name: string;
  onSave: (data: Data) => void;
}
let { name, onSave }: Props = $props();
```

### Component Guidelines

- Keep components under 300 lines when possible
- Extract complex template sections into child components
- Use TypeScript interfaces for component props
- Prefer composition over prop drilling

## Testing

- Write tests for utility functions and services
- Test files should be co-located: `file.ts` → `file.test.ts`
- Focus on behavior, not implementation details
- Aim for 80%+ code coverage on critical paths

## Preserve Functionality

- Do not change existing functionality unless explicitly requested
- When refactoring, ensure tests continue to pass
- Test edge cases manually when making UI changes
