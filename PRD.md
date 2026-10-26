# WebVR Tutorial Prototype

## 1. Overview

Create a low-fidelity WebVR tutorial prototype for the Virtual Ford Nuclear Reactor experience. The tutorial should teach one interaction at a time through short, guided steps so that new users can learn the controls before entering the experiment.

This prototype will be developed alongside user research and usability testing. Findings will be used to define the target persona, validate the problem, and improve the tutorial flow.

## 2. Problem

New users may not know how to navigate or interact in the WebVR experience. Teaching several controls at once can create confusion and make the experiment difficult to begin.

The tutorial needs a more intuitive, step-by-step approach that lets users practice each essential action and receive clear feedback before moving forward.

## 3. Goal

Help first-time users learn the essential WebVR controls well enough to enter the experiment confidently and return to the main lounge.

### Learning Objectives

By the end of the tutorial, users should be able to:

- Move continuously with the left thumbstick.
- Turn without requiring physical head or body movement.
- Open and pass through a door.
- Teleport to a nearby location.
- Grab and drop an object.
- Open the wrist menu.
- Open the map and teleport with it.
- Enter the experiment and return to the lounge.

## 4. Target Users

The initial audience is first-time or inexperienced VR users interested in the Virtual Ford Nuclear Reactor experience. This is a working assumption and will be refined through research with PME and representative users.

## 5. Tutorial Flow

1. Enter the tutorial from the main lounge, where **Tutorial**, **Experiment**, and **Exit** are available.
2. Receive a welcome message explaining the tutorial's purpose.
3. Learn and practice continuous movement with the left thumbstick.
4. Learn and practice snap turning with the right thumbstick.
5. Learn and practice opening a door.
6. Learn and practice teleporting as a comfort-oriented movement alternative.
7. Learn and practice grabbing and dropping an object.
8. Learn and practice opening the wrist menu.
9. Open the map and use it to teleport.
10. Enter the experiment.
11. Return to the main lounge.

### Step Behavior

Each learning step should:

- Present one clear instruction at a time.
- Let the user perform the action directly.
- Provide immediate visual or audio feedback.
- Confirm completion before introducing the next step.
- Allow the user to retry after an unsuccessful action.
- Show the user's progress through the tutorial.

## 6. Prototype Scope

### In Scope

- A low-fidelity, functional WebVR tutorial.
- The complete tutorial flow listed above.
- Basic interaction prompts, feedback, and progress indicators.
- Support for immersive VR on Meta Quest browsers and non-VR use on desktop browsers.
- Reuse or simplification of existing Virtual FNR assets.
- Iteration based on PME feedback and user testing.

### Out of Scope

- A complete recreation of the Virtual FNR experience.
- Production-quality visuals, animation, or audio.
- The full experiment experience.
- Mobile browser support during the initial prototype phase.
- Final personas or requirements before research is completed.
- Production deployment and analytics.

## 7. System States

The experience should clearly communicate transitions, interruptions, and recovery options. Each state should use concise language, provide visible feedback, and offer an obvious next action when user input is required.

| State | Expected behavior | User action or recovery |
| --- | --- | --- |
| Loading assets | Show loading progress and a short description of what is happening. Prevent interaction until required assets are ready. | Wait, or retry if loading fails. |
| Entering VR | Confirm that the immersive session is starting and provide brief safety guidance. | Select **Enter VR** and follow the headset prompt. |
| VR unavailable | Explain that immersive VR is unavailable without presenting it as a fatal error. | Continue in desktop mode or view supported-device guidance. |
| Controllers not detected | Pause controller-dependent instructions and identify which controller is missing. | Wake, reconnect, or replace the controller; continue when detection resumes. |
| Tracking or controller connection lost | Pause movement and tutorial progression so accidental actions do not count. Preserve the current tutorial step. | Restore tracking or reconnect the controller, then resume from the same step. |
| Tutorial paused | Freeze tutorial progression and expose resume, restart, settings, and exit options. | Resume the current step, restart the tutorial, adjust settings, or exit. |
| Exit confirmation | Prevent accidental exits and explain where the user will return. | Confirm exit or cancel and continue the tutorial. |
| Returning to the lounge | Show a brief transition while moving the user back to the lounge and preserve a stable camera orientation. | Wait for the lounge to load; retry if the transition fails. |
| Unexpected WebXR session ending | Preserve tutorial progress and explain that immersive mode ended unexpectedly. | Re-enter VR when available or continue on screen from the same step. |

### State Design Requirements

- Use the same visual language and terminology across VR and desktop modes.
- Never leave the user on a blank or frozen screen without status information.
- Preserve tutorial progress whenever recovery is possible.
- Provide a retry or fallback action for recoverable errors.
- Make pause and exit controls accessible from every tutorial step.
- Do not advance a tutorial step while input or tracking is unavailable.
- Design each state in Figma for both immersive VR presentation and desktop presentation.

## 8. Research and Testing

Research and testing should determine:

- Who needs the tutorial and what prior VR experience they have.
- Which controls and instructions are difficult to understand.
- Whether the order and pacing of the steps feel natural.
- Whether users understand why and when to use each interaction.
- Whether users can enter the experiment and return to the lounge without help.

Testing should include PME review and usability sessions with representative users. Observations and participant feedback will inform the persona, problem statement, tutorial requirements, and subsequent iterations.

## 9. Success Criteria

The prototype is successful when:

- Users can complete the tutorial from the lounge through their return to the lounge.
- Users can perform each required interaction with little or no facilitator assistance.
- Users understand when a step is complete and what to do next.
- Testing identifies major usability issues and produces actionable improvements.
- Research provides enough evidence to refine the target persona and problem statement.

Specific completion-time, error-rate, and assistance-rate targets will be established after initial baseline testing.

## 10. Technical Requirements

### Technology

- Build the experience with Three.js and the WebXR Device API.
- Run entirely in the browser with no required installation or backend service.
- Serve the experience over HTTPS, as required for WebXR access.
- Use optimized web-ready assets, preferably glTF or GLB for 3D content.

### Platform Priority

1. **VR:** The primary experience should run in the Meta Quest web browser and enter immersive VR through WebXR.
2. **Desktop:** The same tutorial should run as a non-VR 3D experience in a modern desktop browser.
3. **Mobile — TBD:** Mobile browser support is a future compatibility target. Its controls and feature scope will be defined after the VR and desktop flows are working and tested.

### Input and Interaction

- VR should support tracked controllers for pointing, selecting, teleporting, grabbing, dropping, and opening menus.
- Desktop should provide keyboard-and-mouse equivalents for movement, turning, selection, and object interaction.
- Tutorial instructions should change based on the active input mode so users see the correct controls.
- Core tutorial logic and step completion should remain consistent across VR and desktop modes.

#### Locomotion Requirements

- Continuous left-thumbstick movement is the initial movement method because it matches a familiar game-controller mental model.
- Teleportation should remain available as a comfort-oriented alternative rather than replacing continuous movement.
- Right-thumbstick left/right input should use 30° snap turning by default.
- Physical head or body turning may work naturally through headset tracking but not be required to navigate or complete the tutorial.
- Tutorial logic should respond to locomotion actions, such as `move`, `turn`, and `completeTeleport`, rather than directly depending on a specific button.

#### Meta Quest Controller Mapping

| Controller input | Action |
| --- | --- |
| Left thumbstick — move up, down, left, or right | Continuous movement |
| Right thumbstick — move left or right | Turn in 30° increments |
| Right thumbstick — push forward and hold | Aim teleport arc and destination marker |
| Right thumbstick — release | Complete teleport |
| Right thumbstick — pull backward while aiming | Cancel teleport |
| Left or right trigger | Select |
| Left or right grip button | Grab and drop |
| X button | Open the wrist menu |

- The map should be opened from the wrist menu rather than through a separate controller button.
- The tutorial should introduce these controls in the order defined in the tutorial flow instead of presenting the entire control scheme at once.
- Button prompts should identify both the controller side and the required input, such as **Press X on the left controller**.

#### Cross-Platform Control Mapping

| Action | Meta Quest VR | Desktop | Mobile |
| --- | --- | --- | --- |
| Move | Left thumbstick for continuous movement | `WASD` or arrow keys | TBD |
| Look or turn | Right thumbstick left/right for 30° snap turning; physical turning optional | Mouse movement or drag | TBD |
| Select or open a door | Aim and press either trigger | Aim and left-click | TBD |
| Teleport | Hold the right thumbstick forward to aim and release to teleport | Press `T`, aim, and left-click | TBD |
| Grab or drop | Left or right grip button | Press `E` | TBD |
| Open menu | Press X to open the wrist menu | Press `Tab` or select the menu button | TBD |
| Open map | Select the map from the wrist menu | Select the map from the menu | TBD |
| Teleport with map | Point at and select a destination | Click a destination | TBD |

- Preserve the purpose and completion criteria of each action across platforms even when its physical input is different.
- Avoid desktop inputs that conflict with common browser behavior, such as right-click.
- Show only the instructions for the user's active input mode.

#### Early Locomotion Testing

Before building the complete tutorial environment, test locomotion in a small graybox containing destinations, a turn, a door, and an interactable object.

Compare:

1. Continuous movement with 30° snap turning.
2. Teleportation with 30° snap turning.
3. A hybrid mode in which both movement methods are available.

Observe control comprehension, navigation errors, disorientation, discomfort, task completion, and user preference. Use the findings to confirm the final default while retaining an accessible alternative.

### Delivery and Mode Selection

- Use one website and URL for the VR and desktop experiences, with mobile added later if feasible.
- On entry, offer **Enter VR** when an immersive WebXR session is supported and always offer **Continue on Screen** when the non-VR experience is available.
- Detect immersive VR support through the WebXR API rather than relying only on device or browser names.
- Use one shared set of tutorial actions and completion states, with separate input mappings for VR, desktop, and future mobile controls.
- If immersive WebXR is unavailable, keep the user on the same site and provide the non-VR version instead.

### Performance and Compatibility

- Prioritize stable, comfortable performance on the target Meta Quest headset.
- Keep models, textures, lighting, and effects lightweight enough for browser delivery.
- Provide a clear fallback message when immersive WebXR is unavailable and allow the user to continue in desktop mode when supported.
- Define measurable frame-rate, loading-time, and browser-support targets after an initial technical test.

## 11. Constraints

- The prototype should be front-end only and based on Three.js and WebXR.
- Existing project assets should be reused or optimized rather than creating new 3D assets.
- The experience should account for VR comfort, performance, loading time, and accessibility.
- The prototype should remain small enough to test and iterate quickly during the research phase.
