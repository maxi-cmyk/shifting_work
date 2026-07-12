# Shiftwork

A desktop productivity app built around a six-speed manual gearbox. Load your tasks, assign each one a gear, and work through your day by shifting through an H-pattern lever — making pace feel deliberate and physical.

## Quick start

```bash
npm install
npm run dev
```

This launches both the Vite dev server and the Electron window. The app requires at least three tasks before you can start a focus session.

## Scripts

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start frontend + backend in development mode   |
| `npm run dev:frontend` | Vite dev server only (http://127.0.0.1:5173)   |
| `npm run dev:backend`  | Electron window pointed at the Vite dev server |
| `npm run dev:web`      | Vite dev server only (alias)                   |
| `npm start`            | Build and run the production Electron renderer |
| `npm run build`        | TypeScript build + production Vite bundle      |
| `npm run test`         | Run all 16 unit/component tests                |
| `npm run typecheck`    | TypeScript type checking                       |
| `npm run check`        | Full CI: typecheck + tests + production build  |

## Docs

- [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) — product premise, gear model, data model, scope, and visual system.
- [`backend/README.md`](./backend/README.md) — Electron main process and build scripts.
- [`frontend/README.md`](./frontend/README.md) — React renderer, components, and tests.

## Tech stack

Electron 43 · React 19 · TypeScript 7 · Vite 8 · Vitest 4
