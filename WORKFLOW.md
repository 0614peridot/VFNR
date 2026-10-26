# WebVR Tutorial Development Workflow

This file is the execution contract for building the prototype described in [PRD.md](PRD.md). It is not a planning deliverable. Work from this workflow must create and validate runnable application code in this repository.

[AGENTS.md](AGENTS.md) governs implementation. The root [PRD.md](PRD.md) is the product source of truth. [Project_Brief.md](Project_Brief.md) provides broader context only when it does not conflict with the prototype scope.

## Build location

Build the prototype directly in this repository root. `WORKFLOW.md` tracks progress; the application belongs in real source files:

```text
VFNR_Tutorial/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── assets/
├── src/
│   ├── main.ts
│   ├── styles.css
│   ├── app/
│   ├── input/
│   ├── interactions/
│   ├── locomotion/
│   ├── recovery/
│   ├── scene/
│   ├── tutorial/
│   └── ui/
└── tests/
```

Use `public/assets/` for approved, optimized source assets. When assets are unavailable, implement the functional prototype with neutral Three.js primitives and mark them provisional. Missing artwork does not block graybox development.

## Execution rules

- Work on the first incomplete phase unless the user explicitly selects another phase.
- At phase start, set its status to `IN PROGRESS`.
- Check a task only after implementation and appropriate validation.
- Keep the application runnable at the end of every phase.
- Update the phase Results and Execution Log in this file while working.
- Show short progress updates in chat and link changed source files.
- Do not replace implementation with new planning or baseline documents.
- Use one Three.js scene, application state, tutorial state machine, semantic action layer, and completion model across VR and desktop.
- Keep platform input mappings separate from tutorial logic.
- Use the Figma MCP before implementing or changing user-facing UI. If no approved design exists, create or use neutral low-fidelity Figma states and label them provisional.
- Do not implement mobile, a backend, analytics, polished branding, or the full experiment.
- If local validation is blocked by missing tools or hardware, create the implementation, run every available check, record the blocker, and continue with independent work.

## Current execution status

- **Active phase:** Phase 0 — Bootstrap a runnable prototype
- **Application status:** Source scaffold complete; runtime validation pending
- **Next action:** Install Node.js/npm, generate the lockfile, and run the Phase 0 validation commands
- **Known environment issue:** Node.js and npm were not found on `PATH`. This blocks dependency installation and build validation, but not creation of the project source.

---

## Phase 0 — Bootstrap a runnable prototype

**Status:** IN PROGRESS — IMPLEMENTED, VALIDATION BLOCKED

### Goal

Create the real application foundation. The output is a runnable Three.js page that supports desktop rendering, detects immersive WebXR capability, and offers the correct entry choices.

### Build

- [x] Create a Vite + TypeScript project in the repository root.
- [x] Pin Node/npm expectations, Three.js, Vite, TypeScript, and test dependencies.
- [x] Add `dev`, `build`, `preview`, `typecheck`, and `test` scripts.
- [x] Configure an HTTPS-capable development path without committing private keys.
- [x] Create the Phase 0 app, scene, and UI source structure shown above; later feature directories are created by their owning phases.
- [x] Create a Three.js renderer, camera, scene, lighting, ground, resize handling, and neutral graybox reference objects.
- [x] Use `renderer.setAnimationLoop` and enable `renderer.xr`.
- [x] Detect `immersive-vr` with `navigator.xr.isSessionSupported("immersive-vr")`, never user-agent matching.
- [x] Show **Enter VR** only when immersive VR is supported.
- [x] Always offer **Continue on Screen** when desktop mode is available.
- [x] Add visible loading, ready, VR-unavailable, and recoverable-error states so the page never fails blank.
- [x] Put shared state in a dedicated module rather than embedding it all in `main.ts`.
- [x] Add smoke tests for application state and WebXR capability handling.
- [x] Add `README.md` with installation, HTTPS development, desktop launch, and Quest connection instructions.
- [ ] Create or confirm a provisional Figma source for the Phase 0 entry, fallback, and error surfaces before treating them as approved UI.

### Required outputs

`package.json`, lockfile, `index.html`, Vite and TypeScript configuration, `src/main.ts`, initial app/scene/UI modules, test configuration, tests, and `README.md`.

### Validate

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev -- --host
```

Manually confirm that desktop reaches the graybox, resizing is correct, unsupported WebXR remains usable, and a supported Quest can request an immersive session over HTTPS.

### Gate

- [ ] Desktop displays the graybox without console errors.
- [ ] Type checking, automated tests, and production build pass.
- [ ] Desktop and VR entry use the same application and scene.
- [ ] Unsupported VR produces a useful desktop fallback.
- [ ] Another developer can run the prototype from the README.

### Results

- Implemented the Vite/TypeScript project manifest and configuration with pinned versions.
- Implemented one shared Three.js graybox containing a floor/grid, destination markers, a door-frame reference, and a grabbable reference object.
- Implemented API-based WebXR capability detection, same-scene desktop/VR entry, XR session start/end handling, and visible fallback/error states.
- Added shared application state, a neutral provisional desktop entry surface, smoke tests, ignore rules, and run instructions.
- The entry surface is an engineering shell and has not yet been reconciled with a Figma source; it is not approved product UI.
- `package-lock.json` was not generated because Node.js/npm is unavailable.
- A Node.js 24.22.1 LTS installation was approved and started, but the administrator installer was cancelled; no alternative installation route was attempted.
- `npm install`, type checking, tests, build, browser smoke test, and Quest validation remain blocked by the missing local Node.js/npm toolchain and physical Quest access.

---

## Phase 1 — Shared state, actions, and input adapters

**Status:** NOT STARTED

- [ ] Define semantic actions: `move`, `turn`, `select`, `startTeleport`, `completeTeleport`, `cancelTeleport`, `grab`, `drop`, `openMenu`, and `chooseMapDestination`.
- [ ] Implement shared application and tutorial state machines.
- [ ] Implement desktop and WebXR adapters that emit the same semantic actions.
- [ ] Ensure tutorial modules never read keys, buttons, or axes directly.
- [ ] Preserve the active tutorial step through recoverable interruptions and unexpected XR session endings.
- [ ] Add tests for action normalization and valid/invalid state transitions.

**Gate:** mocked desktop and Quest input produce identical semantic state changes, and interruption recovery preserves the active step.

---

## Phase 2 — Graybox locomotion

**Status:** NOT STARTED

- [ ] Build a compact graybox with destinations, a turn, a door, and a grabbable object.
- [ ] Implement continuous movement from Quest left thumbstick and desktop `WASD`/arrow keys.
- [ ] Implement 30-degree Quest snap turning and the desktop look/turn equivalent.
- [ ] Implement teleport aiming, destination validation, completion, and cancellation.
- [ ] Keep continuous movement and teleport available as a hybrid.
- [ ] Add collision and ground constraints sufficient for the tutorial.
- [ ] Prevent unavailable input/tracking from moving the learner or advancing state.
- [ ] Instrument movement, turns, successful/invalid teleports, and cancellation for testing.

**Gate:** locomotion works through semantic actions without tutorial coupling and is ready for the first physical Quest comfort test.

---

## Phase 3 — First complete tutorial slice

**Status:** NOT STARTED

- [ ] Create or confirm provisional Figma states for lounge entry, welcome, movement instruction, feedback, progress, pause, and exit confirmation.
- [ ] Implement lounge choices: Tutorial, Experiment, and Exit.
- [ ] Implement welcome and continuous-movement lessons.
- [ ] Implement instruction → action → feedback → confirmation → advance.
- [ ] Allow retry without resetting progress.
- [ ] Show only the active platform mapping and current progress.
- [ ] Implement pause/resume, restart, settings placeholder, and exit confirmation.
- [ ] Implement desktop HTML/CSS presentation over the shared canvas.
- [ ] Implement readable world-space VR panels placed from the current headset pose and then anchored in world space.
- [ ] Add integration tests for the vertical slice.

**Gate:** lounge → welcome → movement completion works in desktop and Quest-ready code with the same tutorial state; pause/resume and exit cancellation preserve progress.

---

## Phase 4 — Complete tutorial interactions

**Status:** NOT STARTED

Implement in PRD order:

- [ ] Continuous movement.
- [ ] 30-degree snap turning.
- [ ] Open and pass through a door.
- [ ] Teleport to a nearby location.
- [ ] Grab and drop an object.
- [ ] Open the wrist menu.
- [ ] Open the map through the wrist menu and teleport with it.
- [ ] Enter the experiment through a scoped transition placeholder.
- [ ] Return to the lounge with stable camera orientation.
- [ ] Add completion, invalid-attempt, retry, and progress tests for every lesson.
- [ ] Match all Quest and desktop mappings in the PRD; VR prompts must identify controller side and required input.

**Gate:** the complete lounge-to-lounge tutorial runs in both modes without implementing the full experiment.

---

## Phase 5 — Recovery and interruption states

**Status:** NOT STARTED

- [ ] Loading progress, failure, and retry.
- [ ] Entering VR with brief safety guidance.
- [ ] VR unavailable with desktop fallback.
- [ ] Missing left or right controller.
- [ ] Tracking or controller connection lost.
- [ ] Tutorial paused.
- [ ] Exit confirmation.
- [ ] Lounge-return transition and failure recovery.
- [ ] Unexpected WebXR session ending.
- [ ] Verify that unavailable input/tracking cannot advance tutorial progress.
- [ ] Verify that every recoverable interruption preserves the active step.

**Gate:** every required state communicates status, provides an appropriate next action, and passes recovery tests without blank screens or unintended progress.

---

## Phase 6 — Asset integration and performance

**Status:** NOT STARTED

- [ ] Inventory each supplied asset with source, provenance, format, size, and intended use.
- [ ] Replace graybox pieces only when an approved existing asset is available.
- [ ] Convert or optimize assets to web-ready glTF/GLB.
- [ ] Optimize geometry, textures, materials, lighting, and loading from measured Quest results.
- [ ] Retain documented primitive fallbacks for unavailable or unsuitable assets.
- [ ] Measure frame rate, load time, payload size, draw calls, triangles, and texture memory on the target headset.
- [ ] Establish final performance targets from the device baseline.
- [ ] Test slow loading and forced asset failures.

**Gate:** asset integration does not regress tutorial behavior, and the full tutorial remains stable and comfortable on the target Quest and supported desktop browsers.

---

## Phase 7 — Cross-platform usability validation and iteration

**Status:** NOT STARTED

- [ ] Run type checking, tests, and the production build.
- [ ] Validate the full flow on the named Quest/browser.
- [ ] Validate the full flow in the agreed desktop browsers.
- [ ] Conduct PME review and representative-user testing.
- [ ] Record completion, errors, retries, assistance, comprehension, discomfort, and qualitative observations.
- [ ] Test at least one recoverable interruption.
- [ ] Fix issues that block completion, cause discomfort, teach the wrong input, or make success unclear.
- [ ] Update Figma before implementing UI revisions.
- [ ] Re-run affected Quest and desktop tests.
- [ ] Document remaining limitations.

### Prototype definition of done

- [ ] Users complete the tutorial from the lounge through return to the lounge.
- [ ] Users perform required interactions with little or no facilitator assistance.
- [ ] Users understand step completion and the next action.
- [ ] Required recovery states work without unintended progress loss.
- [ ] Quest and desktop share the scene, state, tutorial logic, semantic actions, and completion rules.
- [ ] The prototype remains front-end only and excludes mobile, analytics, the full experiment, and production-only expansion.
- [ ] Testing produces prioritized improvements and at least one verified iteration.

---

## Execution log

| Date | Phase | Work completed | Validation | Blocker / next action |
| --- | --- | --- | --- | --- |
| 2026-10-26 | Workflow reset | Replaced the planning-oriented workflow with an application-development execution contract. Defined the repository root as the build location and made runnable code the Phase 0 output. | Source documents rechecked; workflow reviewed against PRD and AGENTS requirements. | Execute Phase 0. Node.js/npm is required for dependency and build validation. |
| 2026-10-26 | Phase 0 | Created the Vite/TypeScript/Three.js application shell, graybox scene, shared state, WebXR capability/session handling, provisional entry UI, smoke tests, and README. | Static scaffold checks passed; an independent review corrected WebXR types, scene-start recovery, and `local-floor` requirements. Runtime commands could not run because Node.js/npm is absent. | Install Node.js 24 LTS, run `npm install`, then run typecheck, tests, build, desktop smoke test, and Quest HTTPS test. Confirm or create the provisional Figma source. |
| 2026-10-26 | Phase 0 | Attempted the approved Node.js 24.22.1 LTS installation. | Installer downloaded and verified, then exited with Windows code 1602 after the administrator installation was cancelled. | Wait for an available Node.js/npm toolchain before runtime validation; do not bypass the cancelled installation. |

