# Microscope Canvas

A whiteboard-style canvas to use with Microscope for worldbuilding games. Intended for single-player use for TTRPG GMs and worldbuilders.

![](/example/example.png)

## Features

- **Local-first**: All data is stored locally in your browser
- **Single-player focused**: Designed for solo worldbuilding sessions
- **Archive-first**: Built for long-lived creative projects
- **Mobile-friendly**: Full feature parity on desktop and mobile

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
```

## Development Setup

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later

### Installation

```bash
# Clone the repository
git clone https://github.com/BeskarDev/microscope-canvas.git
cd microscope-canvas

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start development server     |
| `npm run build`        | Build for production         |
| `npm run preview`      | Preview production build     |
| `npm run lint`         | Run ESLint                   |
| `npm run lint:fix`     | Run ESLint and fix issues    |
| `npm run format`       | Format code with Prettier    |
| `npm run format:check` | Check code formatting        |
| `npm run check`        | Run TypeScript type checking |
| `npm run test`         | Run tests                    |
| `npm run test:watch`   | Run tests in watch mode      |

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **UI Components**: [shadcn-svelte](https://www.shadcn-svelte.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Linting**: ESLint + Prettier
- **Deployment**: GitHub Pages

## Documentation

- [Design Document](./specs/app-design-document.md) - Core design specifications
- [Milestones](./specs/milestones/) - Implementation phases

## License

See [LICENSE](./LICENSE) for details.
