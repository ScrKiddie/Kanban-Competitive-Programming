# KanbanCP

<p align="center">
  <img src="https://github.com/user-attachments/assets/7dc02b7b-fa94-4418-ad89-952b5d942ced" alt="KanbanCP preview" width="100%" />
</p>

KanbanCP is a local-first desktop app for organizing competitive programming practice with kanban boards, solution notes, AI review, and optional GitHub sync.

Designed for daily problem solving workflows: collect problems, move them through practice stages, write solutions, review attempts, and keep everything stored locally on your machine.

## Features

- Local-first kanban boards for competitive programming practice.
- Board management with create, edit, delete, search, and safe deletion flow.
- Problem tracking across `Todo`, `In Progress`, `Review`, and `Done` stages.
- Manual problem entry and catalog-based problem adding.
- Duplicate problem entries allowed for repeated practice and variants.
- Problem detail panel with notes, solution code, tags, platform, difficulty, and status.
- Built-in code editor powered by Monaco Editor.
- Optional AI review for submitted solution notes/code.
- Optional GitHub sync for saving problem files to a repository.
- Local SQLite persistence through Tauri SQL plugin.
- Responsive board layout for desktop and smaller screens.
- Stable custom tooltip behavior using Floating UI.
- Drag-and-drop cards powered by `@hello-pangea/dnd`.

## Tech Stack

| Layer | Stack |
| ----- | ----- |
| Desktop | Tauri 2 |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4, Radix UI primitives |
| Database | SQLite via Tauri SQL plugin |
| Storage | Tauri Store plugin |
| Drag & Drop | `@hello-pangea/dnd` |
| Tooltip | Floating UI |
| Code Editor | Monaco Editor |
| Package Manager | pnpm |

## Project Structure

```text
src/
├── assets/         Static application assets
├── components/     App UI, board, problem, onboarding, and shared components
├── hooks/          Custom React hooks and application state
├── lib/            Local API client, database, settings, scraper, and utilities
└── shared/         Shared constants, catalog data, and problem helpers

src-tauri/
├── capabilities/   Tauri permission configuration
├── icons/          Desktop bundle icons
└── src/            Rust entrypoint and plugin setup
```

## Data Storage

KanbanCP does not require a custom backend server.

The app stores data locally using SQLite:

```text
brickcp.db
```

Runtime settings such as AI and GitHub configuration are stored with Tauri Store.

Deleting a board also deletes its local problems. Deleting a problem removes its notes, solution code, AI review data, tags, and sync metadata from the local database.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/ScrKiddie/KanbanCP.git
cd KanbanCP
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the frontend only:

```bash
pnpm dev
```

4. Run the desktop app:

```bash
pnpm tauri dev
```

5. Build the frontend:

```bash
pnpm build
```

6. Build the desktop bundle:

```bash
pnpm tauri build
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start Vite development server |
| `pnpm build` | Type-check and build frontend assets |
| `pnpm preview` | Preview built frontend assets |
| `pnpm lint` | Run ESLint |
| `pnpm tauri dev` | Run the Tauri desktop app in development mode |
| `pnpm tauri build` | Build desktop installers/bundles |

## GitHub Sync

GitHub sync is optional. When enabled, KanbanCP can write problem notes and solution files into a selected repository path.

The local app remains the source of daily work. Deleting local data does not automatically delete remote files already synced to GitHub.

## Release Versioning

The desktop app version is configured in:

```text
src-tauri/tauri.conf.json
```

Build a release bundle locally with:

```bash
pnpm tauri build
```
