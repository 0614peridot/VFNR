# Virtual FNR WebXR Tutorial Prototype

Low-fidelity, front-end-only Three.js/WebXR tutorial prototype for Meta Quest and desktop browsers. The root `PRD.md` defines product behavior; `WORKFLOW.md` tracks implementation.

## Requirements

- Node.js 24 LTS
- npm
- A modern desktop browser
- Meta Quest plus Meta Quest Browser for immersive validation

## Install and run

```powershell
npm install
npm run dev -- --host
```

Vite serves the development build over HTTPS. The included basic certificate is untrusted and is intended only for early local development. For Quest testing, use a team-approved trusted certificate or an approved temporary HTTPS preview host.

Open the local URL printed by Vite. Choose **Continue on Screen** for desktop mode. **Enter VR** appears only when the browser reports support for `immersive-vr` through the WebXR Device API.

## Validate

```powershell
npm run typecheck
npm test
npm run build
npm run preview -- --host
```

## Current scope

Phase 0 provides one shared Three.js graybox and the desktop/WebXR entry shell. Tutorial movement, interactions, progression, world-space VR panels, and recovery behavior are implemented in later workflow phases.

The current interface is a neutral provisional developer shell, not an approved visual design.
