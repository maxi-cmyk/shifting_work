# Shiftwork — Build Progress

## Current status

**Phase:** MVP complete · **State:** Ready for product review

The workspace began empty. A runnable Electron/React MVP now implements the documented manual-gear productivity loop. Automatic sorting remains deferred for the next product discussion.

## Build log

### 2026-07-12 — Reference-photo shifter adaptation

- Used the user-supplied gated-shifter photo as the material and layout reference.
- Replaced the wide oval plate with a portrait faceted gate console.
- Added carbon-fiber weave, brushed vertical grain, red perimeter piping, red-edged slots, and four silver corner fasteners.
- Moved copper/amber outlined numerals outside the slot endpoints in the correct `1–3–5 / 2–4–6` pattern.
- Rebuilt the knob with a concentric machined-silver cap, textured black grip, and dark polished shaft.
- Retained the rail-constrained H-pattern mechanics, keyboard/click alternatives, and fullscreen focus composition.
- Electron comparison captures confirmed the dashboard and focus layouts with zero renderer errors.

### 2026-07-12 — Three-task route and physical focus-mode revision

- Added a three-task minimum with a visible segmented meter and exact remaining-task feedback.
- Added sequential new-task defaults from G1 through G6 while preserving manual overrides.
- Locked session start until the initial three-task route exists; completed tasks preserve the unlock.
- Replaced React state updates during every pointer move with direct `translate3d` lever transforms.
- Added a rail state machine that constrains pointer movement to the H-pattern.
- Added multi-segment click/keyboard animation and synchronized shaft pivoting through neutral.
- Rebuilt the gearbox as a beveled, layered 3D plate with recessed channels, leather boot, metal shaft, and round engraved knob.
- Added an isolated Electron IPC bridge for native fullscreen entry/exit.
- Replaced the active dashboard with a focus-only view containing the task name, timer, and gearbox.
- Expanded automated coverage to 16 tests, including minimum-task feedback, automatic G1/G2/G3 assignment, fullscreen focus DOM, IPC invocation, and G1→G6 route geometry.
- Electron smoke verification observed native fullscreen and reported zero renderer errors.

### 2026-07-12 — Development CSS fix and frontend/backend split

- Reproduced the exact unstyled Electron development renderer shown by the user.
- Captured three CSP errors proving that `style-src 'self'` blocked Vite’s development-time style injection.
- Updated the CSP to allow local inline styles while keeping JavaScript restricted to local application sources.
- Captured the corrected development renderer: full cockpit styling restored and zero renderer errors.
- Split all React, Vite, visual, domain, persistence, and test code into `frontend/`.
- Split Electron main/preload and build/smoke scripts into `backend/`.
- Updated root scripts so `npm run dev` launches `dev:frontend` and `dev:backend` together.
- Changed production output to `dist/frontend/` and added a safe build cleanup to prevent stale pre-split HTML from being opened.
- Added an explicit launch message when `frontend/index.html` is opened without Vite.
- Re-ran the automated tests, TypeScript, the production build, full workflow launch, and both Electron render modes successfully.

### 2026-07-12 — MVP implementation and verification

- Scaffolded Electron 43, React 19, TypeScript 7, Vite 8, and Vitest 4.
- Built local task creation, editing, deletion, selection, and accessible reorder controls.
- Built the original six-speed H-pattern with pointer snapping, semantic gate buttons, number-key selection, and neutral.
- Added start, pause/resume, manual shifting, completion, abandonment, timer overrun, advisory recommendations, and recent history.
- Added versioned local persistence with malformed-data filtering and safe paused-session restoration.
- Added interactive first-run onboarding, reduced-motion support, settings, keyboard hints, focus states, skip navigation, and local-only privacy messaging.
- Added an Electron-native visual smoke harness that captures onboarding, 1440×920 cockpit, and 800×720 compact layouts.
- Found and fixed a production-only Electron asset-path defect by using a relative Vite base.
- Removed remote font loading so the packaged renderer works offline.
- Added a strict content-security policy; the final Electron renderer emitted zero console errors.
- Found and fixed a window-level keyboard event bug during the final automated test pass.
- Upgraded `concurrently` from 9.2.1 to 9.2.4 to resolve the reported `shell-quote` advisory; the final npm audit reports zero vulnerabilities.

### 2026-07-12 — Definition and clarification

- Defined the desktop MVP around task entry, manual gear assignment, an H-pattern shifter, focus timing, recommendations, persistence, history, and onboarding.
- Explicitly deferred automatic task sorting until after the interaction MVP is working.
- Asked for confirmation on framework, persistence, MVP boundary, and visual/legal direction.
- With no revisions supplied in the continuation, recorded the recommended choices as revisable working assumptions rather than silently treating them as permanent decisions.
- Ran the UI design-system and accessibility guidance pass.
- Chose a brand-original “precision cockpit” direction and rejected manufacturer marks or exact console reproduction.
- Created `PROJECT_OVERVIEW.md`, `TASKS.md`, and `PROGRESS.md` as living artifacts.

## Revisable assumptions for product review

- Electron + React + TypeScript is acceptable for the desktop MVP.
- Local-only storage is sufficient for the MVP.
- Manual task gear assignment is acceptable until the sorting discussion.
- The documented MVP boundary is correct.
- Manufacturer-neutral sports-car inspiration is acceptable.

## Verification evidence

- `npm run check` — passed.
- TypeScript project build — passed with no errors.
- Vitest — 4 files passed, 16 tests passed.
- Vite production build — passed; renderer bundle generated under `dist/`.
- `npm audit` — 0 vulnerabilities after the dependency patch.
- Electron visual smoke — onboarding, full cockpit, and compact layout captured successfully.
- Electron renderer console — 0 errors after CSP and relative-asset fixes.
- Development regression reproduction — 3 CSP style violations and visibly unstyled UI before the fix.
- Corrected development renderer — fully styled 1440×920 cockpit and 0 renderer errors.
- Corrected production renderer — loaded from `dist/frontend/index.html` with 0 renderer errors.
- Full workflow — `npm run dev` started both `dev:frontend` and `dev:backend`; Electron exited only when the verification session was intentionally stopped.
- Split-output audit — `dist/frontend/index.html` exists and obsolete `dist/index.html` does not.
- Verified interaction coverage — task creation/start, pointer gate snapping, click shifting, keyboard shifting, recommendation boundaries, persistence parsing, and safe session restoration.

## Known risks

- The drag interaction must not become the only way to shift; click and keyboard parity are required.
- A realistic gearbox can obscure productivity meaning, so labels and onboarding must remain clear.
- Timer state must survive renderer refreshes without pretending time continued while a restored session is paused.
- Sixth gear must communicate intensity rather than “best” or “most productive.”
- Exact automotive trade dress would create unnecessary legal and product-identity risk.
- The sound preference is stored but intentionally produces no audio yet; an original sound-design pass is needed before enabling it.
- The app is runnable through the development/production start commands but does not yet generate signed installers.
- Task sorting, OS-level distraction blocking, accounts, and cloud sync remain explicitly out of scope.

## Next checkpoint

Review the MVP interaction and visual direction with the user. After approval, define the transparent task-sorting model for duration, difficulty, focus requirement, urgency, and current energy.
