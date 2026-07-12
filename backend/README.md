# Backend

The Electron desktop runtime for Shiftwork. This folder owns the main process, isolated preload bridge, window/security policy, external-link handling, and Electron visual smoke tooling.

The backend waits for the frontend development server when running:

```bash
npm run dev:backend
```

Normally, launch both sides together from the repository root with `npm run dev`.
