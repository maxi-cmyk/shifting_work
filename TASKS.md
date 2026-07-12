# Shiftwork — MVP Task Sheet

Status key: `[ ]` pending · `[~]` in progress · `[x]` complete

## 0. Product definition

- [x] Define the MVP boundary and defer automatic sorting.
- [x] Document the six-gear model and timing recommendations.
- [x] Establish an original, manufacturer-neutral visual direction.
- [x] Record the clarification questions and revisable working assumptions.

## 1. Foundation

- [x] Scaffold Electron + React + TypeScript + Vite.
- [x] Add development, start, test, type-check, and production-build commands.
- [x] Define typed task, session, recommendation, and preference models.
- [x] Add local persistence with safe schema defaults.
- [x] Establish semantic design tokens, typography, and layout primitives.

## 2. Task queue

- [x] Build the task-entry form with title, gear, and target time.
- [x] Validate inputs with clear inline recovery messages.
- [x] Build queued, active, and completed task states.
- [x] Add edit, delete, select, and reorder controls.
- [x] Add a purposeful empty state for a new drive.

## 3. Gearbox

- [x] Draw the original six-speed H-pattern and neutral channel.
- [x] Implement pointer dragging with gate snapping and drag thresholds.
- [x] Add numbered gate buttons as click and accessibility alternatives.
- [x] Add keyboard controls for gears `1`–`6` and neutral `N`.
- [x] Announce current gear and preserve visible focus states.
- [x] Respect reduced-motion preferences.

## 4. Focus session

- [x] Start a selected task only after a gear is engaged.
- [x] Implement elapsed and target timing with overrun display.
- [x] Pause/resume by moving to/from neutral or pressing `Space`.
- [x] Allow manual upshifts and downshifts during a session.
- [x] Complete or abandon a session without losing queue state.
- [x] Restore a safely paused session after relaunch.

## 5. Feedback and history

- [x] Implement early, on-target, and overrun recommendation rules.
- [x] Keep recommendations advisory and require user-confirmed shifts.
- [x] Record completed session snapshots locally.
- [x] Build a compact recent-session history view.
- [x] Add supportive empty and completion states.

## 6. Onboarding and settings

- [x] Explain gears, neutral, and all three control methods.
- [x] Require a short interactive first shift before dismissing onboarding.
- [x] Persist onboarding completion locally.
- [x] Add reduced-motion and sound preference controls.

## 7. Verification

- [x] Unit-test timing recommendations and persistence parsing.
- [x] Component-test task creation and session controls.
- [x] Test drag, click, and keyboard shifting.
- [x] Run type-check, unit tests, production build, and dependency audit.
- [x] Verify the Electron renderer at 1440×920 and 800×720.
- [x] Verify keyboard shifting and reduced-motion behavior.
- [x] Record final evidence and known limitations in `PROGRESS.md`.

## 8. Development-renderer correction

- [x] Reproduce the user-visible unstyled renderer in Electron development mode.
- [x] Trace the failure to CSP blocking Vite’s inline development CSS.
- [x] Permit local inline styles while retaining local-only script restrictions.
- [x] Move the React/Vite renderer and tests into `frontend/`.
- [x] Move Electron runtime and smoke tooling into `backend/`.
- [x] Update all root development, test, build, and start commands for the split.
- [x] Remove stale pre-split output during every production build.
- [x] Add a direct-open launch message to the frontend source entrypoint.
- [x] Verify styled development and production Electron renderers with zero console errors.

## 9. Task loading, lever mechanics, and focus mode

- [x] Require three tasks before unlocking the first focus session.
- [x] Show live `0 of 3` through `3 of 3` loading feedback and remaining-task guidance.
- [x] Default subsequent tasks to the next gear, capped at Gear 6, while retaining manual edits.
- [x] Replace React pointer-move state updates with direct GPU-friendly transforms.
- [x] Constrain dragging to connected H-pattern rails and the neutral channel.
- [x] Route click and keyboard shifts through the physical gate rather than diagonally.
- [x] Rebuild the lever with a round engraved knob, metal shaft, center boot, and beveled 3D plate.
- [x] Replace the dashboard with task name, timer, and gearbox during an active session.
- [x] Enter and leave native Electron fullscreen through the isolated preload bridge.
- [x] Test the minimum gate, sequential gears, route geometry, focus-only DOM, and fullscreen IPC call.
- [x] Verify native fullscreen was observed and the final renderer emitted zero errors.

## 10. Reference-driven shifter styling

- [x] Inspect the supplied gated-shifter photo for layout, material, and color cues.
- [x] Convert the gearbox from a wide oval console to a tall faceted plate.
- [x] Add a carbon-fiber surround and thin red double-edge treatment.
- [x] Add a brushed-black insert, recessed channels, and four exposed silver screws.
- [x] Move warm copper outlined numerals outside the gate endpoints.
- [x] Restyle the lever as a black shaft and textured grip with a machined silver cap.
- [x] Preserve the correct six-forward-gear pattern and existing constrained motion.
- [x] Verify dashboard and focus-mode renders against the reference with zero renderer errors.

## Later: sorting-system discussion

- [ ] Decide which task signals are required versus optional.
- [ ] Design the duration/difficulty/focus/urgency scoring model.
- [ ] Decide how user energy affects assignment without being punitive.
- [ ] Design explanations and user overrides for automatic assignments.
- [ ] Validate sorting against real task sets before enabling it by default.
