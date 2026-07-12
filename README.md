# Shiftwork

A desktop productivity MVP controlled through a six-speed manual gearbox. Load at least three tasks, let each new task advance to the next gear by default, engage the H-pattern lever, and adjust your pace manually while the app tracks time and offers non-blocking shift recommendations.

## Run locally

```bash
npm install
npm run dev
```

The root command starts both workflows: Vite serves `frontend/`, then `backend/` opens the Electron window. Do not double-click `frontend/index.html`; it is a Vite source entrypoint rather than a standalone page.

To run only one side during development:

```bash
npm run dev:frontend
npm run dev:backend
```

To build and run the production renderer in Electron:

```bash
npm start
```

If the shell has `ELECTRON_RUN_AS_NODE=1` set, remove that environment override before launching Electron.

## Verify

```bash
npm run check
```

This runs the TypeScript build, 16 unit/component tests, and the production Vite build.

## Project documents

- [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) — product premise, scope, behavior, and data model.
- [`TASKS.md`](./TASKS.md) — completed MVP sheet and deferred sorting work.
- [`PROGRESS.md`](./PROGRESS.md) — decision log, verification evidence, and known limitations.

## Repository structure

```text
frontend/
  index.html          Vite renderer entry
  src/                React UI, gearbox, state, persistence, tests
  vite.config.ts      Frontend dev/build/test configuration

backend/
  electron/           Electron main process and isolated preload
  scripts/            Build cleanup and Electron visual smoke checks

dist/frontend/        Generated production renderer; never edit directly
```

## If the window looks unstyled

Stop any old process and relaunch from the repository root with `npm run dev`. A stale pre-split `dist/index.html` is no longer generated; every build cleans `dist/` first. The development CSP now permits Vite’s runtime CSS injection while keeping scripts restricted to local application sources.

## Current boundary

Task-to-gear sorting is intentionally not implemented. New tasks receive transparent sequential defaults—G1, G2, G3, up to G6—and users can still edit them manually. Content-based sorting remains deferred.
# shifting_work
