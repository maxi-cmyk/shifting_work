# Shiftwork — Project Overview

## Product premise

Shiftwork is a desktop productivity app built around the physical language of a six-speed manual gearbox. The user loads a set of tasks, assigns each task a gear, and works through the day by moving a tactile H-pattern shifter. Lower gears support starting and building momentum; higher gears represent deeper focus and greater intensity.

The metaphor is meant to make changing pace feel deliberate and physical, without treating slower work as failure. The driver remains in control: recommendations can suggest an upshift or downshift, but the app never changes gear automatically.

## MVP goal

Prove that a manual gearbox is an understandable, satisfying way to control a desktop focus session.

The MVP must let a user:

1. Add at least three tasks, with visible progress toward the minimum.
2. Receive sequential G1→G6 defaults for new tasks while retaining manual editing.
3. Select a task and begin a timed focus session.
4. Shift through a six-speed H-pattern by dragging, clicking, or using the keyboard.
5. Pause in neutral, upshift, or downshift at any time.
6. Receive a non-blocking recommendation when a task is finished early or runs over its target.
7. Complete or abandon a session and see a local session history.
8. Close and reopen the app without losing tasks, preferences, or history.
9. Learn the controls through a short first-run onboarding flow.

## Decisions and working assumptions

These assumptions were proposed during the clarification pass and remain revisable:

- **Platform:** Desktop, initially macOS-friendly but designed to remain cross-platform.
- **Stack:** Electron, React, TypeScript, and Vite.
- **Storage:** Local-only persistence for the MVP. No login, cloud sync, or telemetry.
- **Task sorting:** Content-based sorting is deferred. The MVP advances new-task defaults sequentially from G1 through G6, and every assignment remains editable.
- **Control:** Shifts are always user initiated. Recommendations never move the lever.
- **Visual direction:** A brand-original precision cockpit influenced by classic six-speed sports-car interiors: graphite, warm metal, restrained signal red, engraved markings, and tactile motion. No Porsche name, crest, logos, or exact protected trade dress.
- **Working title:** Shiftwork.

## Gear model for the MVP

| Gear | Label | Intent | Default target |
| --- | --- | --- | ---: |
| 1 | Ignition | Start with something small and remove inertia | 10 min |
| 2 | Roll | Light, routine progress | 20 min |
| 3 | Cruise | Sustained everyday focus | 30 min |
| 4 | Drive | Complex, distraction-free work | 45 min |
| 5 | Push | High-output deep work | 60 min |
| 6 | Sprint | Short, maximum-intensity finish | 30 min |

Sixth gear is deliberately shorter than fifth: it represents intensity, not endurance. Targets can be edited per task.

## Recommendation rules

The MVP uses simple, visible timing rules—not the future sorting system:

- Finish with at least 20% of the target remaining: suggest an upshift for the next task.
- Finish within ±20% of the target: suggest holding the current gear.
- Exceed the target by at least 20%: suggest a downshift, a break, or splitting the task.
- Recommendation copy is supportive and optional.

## Primary experience

### 1. Load the drive

The user enters at least three tasks with a title and target time. New tasks advance one gear automatically, beginning at G1 and capping at G6; a visible three-segment meter explains when the drive is unlocked. A compact queue shows the planned order and allows manual gear editing or deletion.

### 2. Engage a gear

Selecting a task highlights its intended gear. The user moves the shifter into that gate and starts the session. A mismatched gear is allowed but acknowledged.

### 3. Work and adjust

Starting a session asks Electron to enter fullscreen and replaces the dashboard with exactly three visible elements: task name, elapsed timer, and gearbox. Neutral pauses the timer. Any gear remains selectable while the session is active, and `Enter` completes the task.

### 4. Review the run

Completing a task records elapsed time, target, finishing gear, and outcome. The app provides a recommendation and advances to the next queued task only when the user chooses.

## Input model

- **Pointer:** Drag the round knob through the H-pattern; the lever is constrained to vertical rails and the horizontal neutral channel. Release near a gate to engage it. Click a numbered gate as a precision alternative.
- **Keyboard:** Number keys `1`–`6` engage gears, `N` selects neutral, `Space` starts/pauses, and `Enter` completes the active task.
- **Accessibility:** Every drag action has an equivalent semantic button. Current gear and recommendations are announced. Focus is visible, and motion respects `prefers-reduced-motion`.

## Visual system

- **Tone:** Industrial, focused, premium, restrained.
- **Surfaces:** Carbon-fiber weave surrounding a tall faceted brushed-black gate plate, recessed black channels, exposed silver fasteners, a black shaft/grip, and a concentric-machined silver knob cap.
- **Accent:** Thin signal-red perimeter piping and channel edges, with warm copper/amber outlined gear numerals.
- **Typography:** A condensed display face for instrumentation paired with a highly legible grotesk body face; local fallbacks keep the app usable offline.
- **Motion:** One high-value mechanical interaction—the shifter. Other transitions are short fades or state changes.
- **Originality:** The six-speed `1–3–5 / 2–4–6` pattern and Shiftwork branding remain original; the material and portrait-console direction is adapted from the user-supplied gated-shifter reference.

## Data model

- `Task`: id, title, gear, targetMinutes, status, position, createdAt.
- `ActiveSession`: taskId, startedAt, accumulatedSeconds, running, currentGear.
- `SessionRecord`: id, task snapshot, targetSeconds, elapsedSeconds, finalGear, outcome, completedAt.
- `Preferences`: onboardingComplete, soundEnabled, reducedMotionOverride.

## Technical structure

- `frontend/` owns the Vite/React renderer, visual system, interaction logic, local MVP persistence, and frontend tests.
- `backend/` owns the Electron main process, isolated preload bridge, desktop window policy, build cleanup, and Electron visual verification.
- Root npm scripts orchestrate the two workflows; generated renderer files live only under `dist/frontend/`.
- The frontend source HTML must be served by Vite. Direct `file://` use shows launch instructions rather than impersonating a working application.

## Explicitly out of scope

- Automatic task-to-gear sorting or AI classification.
- Accounts, collaboration, cloud synchronization, and cross-device access.
- OS-level website/application blocking.
- Notifications, calendar integrations, analytics, and gamification economies.
- Mobile layouts and mobile-native gestures.
- Manufacturer branding or licensed vehicle assets.

## MVP success criteria

- A first-time user can see the three-task minimum, load a G1/G2/G3 route, and start Gear 1 without instructions outside the app.
- Drag, click, and keyboard shifting all reach the same valid states.
- Refreshing/reopening preserves meaningful state.
- Timing recommendations match the documented thresholds.
- Core flows work at desktop widths from 1024px upward and remain usable at 800px.
- Automated checks pass and the packaged renderer has no critical console errors.
