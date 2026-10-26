# Project Implementation Rules

## Agent Collaboration

- Match the model and reasoning level to the task rather than always choosing the most powerful model.
- Delegate difficult reasoning, architecture, research synthesis, or creative work to the model best suited to those capabilities.
- Use a faster, less expensive model for routine coding, mechanical edits, searches, and straightforward validation when it can complete the work reliably.
- Delegate meaningful research, design, implementation, testing, or review work to subagents instead of completing everything in the main agent.
- Give each subagent a clear, self-contained scope and use parallel delegation when tasks are independent.
- Keep the main agent responsible for coordination, resolving conflicts, reviewing results, and integrating the final work.
- Handle trivial or tightly coupled edits directly when delegation would add unnecessary overhead.

## Product Source and Scope

- Treat [PRD.md](PRD.md) as the source of truth for the tutorial prototype. Use [Project_Brief.md](Project_Brief.md) for broader project context and constraints.
- Build the low-fidelity tutorial described in the PRD, not the complete Virtual FNR experience.
- Keep the prototype front-end only. Reuse, simplify, or optimize existing assets instead of creating new 3D assets.
- Prioritize Meta Quest WebXR and desktop browsers. Mobile requirements remain TBD unless explicitly requested.

## Tutorial Experience

- Follow the tutorial sequence and controller mappings in the PRD; do not add interactions or features without a defined learning need.
- Teach one action at a time, provide immediate feedback, confirm completion, allow retry, and show progress.
- Preserve the current tutorial step through recoverable interruptions and implement the system states defined in the PRD.
- Keep input mappings separate from tutorial logic so controls can change without rewriting progression.

## Build and Validation

- Use Three.js and the WebXR Device API, serve over HTTPS, and prefer optimized glTF or GLB assets.
- Validate changes in both Meta Quest VR and desktop mode when they affect shared behavior.
- Test locomotion early in a small graybox before coupling it to the complete environment.
- Favor clear, comfortable, and testable behavior over polish or additional features during the prototype phase.

## Design Source

- Use the Figma MCP whenever creating, changing, or implementing UI.
- Treat the relevant Figma designs, components, variables, and states as the UI source of truth.
- The final visual direction, moodboard, and branding are not yet defined. Do not invent a polished visual language unless explicitly requested.
- When no approved visual design exists, use neutral low-fidelity placeholders and clearly identify them as provisional.

## Shared Three.js Experience

- Use one pinned Three.js version for the VR, desktop, and future mobile experiences.
- Reuse the same Three.js scene, application state, tutorial logic, and interaction semantics across platforms.
- Adapt presentation and input by platform rather than creating separate product implementations.

## VR UI

- Implement essential immersive VR UI as world-space panels inside the Three.js scene. Do not rely on HTML/CSS DOM overlays for core VR interactions.
- Unless explicitly specified otherwise, place a panel directly in front of the user at a comfortable reading distance and near eye level when it opens.
- Determine the panel's initial position from the current headset pose, then anchor it in world space. Do not continuously attach it to the user's head.
- Keep panels readable, dismissible, and positioned so they do not unnecessarily block the environment or required interactions.
- Reposition or recenter a panel only through an explicit user action or explicitly defined behavior.

## Desktop and Mobile UI

- Render the 3D experience with the same Three.js scene used by VR.
- Implement desktop UI as HTML/CSS layered over or around the Three.js canvas.
- Mobile UI is TBD, but should use HTML/CSS over the Three.js canvas unless explicitly changed later.
- Share design tokens, terminology, component states, and tutorial progression across VR and screen-based variants while allowing platform-appropriate layouts and controls.
