---
description: 'General AI coding agent instructions for working in the Microscope Canvas repository'
applyTo: '**/*'
---

# Microscope Canvas - AI Coding Agent Instructions

This document provides guidance for AI coding agents working on the Microscope Canvas project.

## Project Overview

Microscope Canvas is a whiteboard-style canvas application for the tabletop RPG _Microscope_, designed for worldbuilding games. It is:

- A **local-first, single-player** application
- Built with **SvelteKit** and **TypeScript**
- Deployed as a **static site** to GitHub Pages
- Designed for **data safety** and **user control**

## Key Documents

Before making changes, familiarize yourself with:

1. **Design Document**: `specs/app-design-document.md` - The source of truth for v1 features and requirements
2. **Milestones**: `specs/milestones/` - Implementation phases with acceptance criteria
3. **Svelte Instructions**: `.github/instructions/svelte.instructions.md` - Svelte 5 development standards

## Project Structure

```
src/
├── lib/
│   ├── components/    # Reusable UI components
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── stores/        # Svelte stores for state management
│   └── assets/        # Static assets (icons, images)
├── routes/            # SvelteKit file-based routing
└── features/          # Feature-specific components and logic

specs/
├── app-design-document.md    # Core design document
└── milestones/               # Implementation milestones

.github/
├── workflows/         # CI/CD workflows
└── instructions/      # AI agent instructions
```

## Development Workflow

### Setup

```bash
npm install        # Install dependencies
npm run dev        # Start development server
```

### Quality Checks

```bash
npm run lint       # Run ESLint
npm run format     # Format with Prettier
npm run check      # TypeScript type checking
npm run test       # Run tests
npm run build      # Build for production
```

## Core Principles

When making changes, always prioritize:

1. **Local-first & user-owned data** - No cloud dependencies
2. **Structure without enforcement** - Guide users, don't restrict them
3. **Predictable, readable layout** - Clarity over visual complexity
4. **Undoable creative actions** - Support undo/redo for game actions
5. **Mobile parity** - Full feature parity on mobile devices
6. **Failure-safe UX** - Handle loading, error, and recovery states

## Decision Making

If a decision is not explicitly described in the design document:

- Prefer **simplicity**
- Prefer **local-first**
- Prefer **user control**
- Prefer **data safety**

Do **NOT** introduce:

- New scope beyond the design document
- New external dependencies without clear justification
- New persistence models
- Cloud sync or authentication features

## Code Quality Standards

- Use **Svelte 5 runes** syntax (`$state`, `$derived`, `$effect`, `$props`)
- Follow **TypeScript strict mode** - no `any` types without justification
- Write **unit tests** for utility functions and complex logic
- Keep components **small and focused** on single responsibilities
- Use **meaningful commit messages** describing the change

## Testing

- Use **Vitest** for unit tests
- Test files should be co-located with source files (`*.test.ts`)
- Focus on testing **behavior**, not implementation details
- Ensure tests pass before committing changes

## UI Components

- Use **shadcn-svelte** for UI components when available
- Follow the component library's patterns and conventions
- Ensure **accessibility** compliance (keyboard navigation, ARIA labels)
- Support both **light and dark themes**

## Milestone Implementation

When implementing a milestone:

1. Read the milestone document thoroughly
2. Check all acceptance criteria
3. Implement incrementally, testing each feature
4. Ensure no regressions in existing functionality
5. Update documentation if needed
