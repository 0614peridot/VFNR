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

### Preview on Meta Quest

1. Connect the development computer and Quest to the same local network.
2. Start the server with `npm run dev -- --host` and note the HTTPS network URL printed by Vite.
3. Open that URL in Meta Quest Browser.
4. For the self-signed development certificate, continue only on a trusted local network after confirming the certificate belongs to this development server. If the browser refuses WebXR, use a team-approved trusted certificate or HTTPS preview host.
5. Select **Enter VR** when it appears and approve the headset's immersive-session prompt.

The graybox is intentionally provisional. It contains a spawn area, movement and turn checkpoints, a door, three teleport destinations, boundaries, and a grabbable-object pedestal so later interaction phases can attach behavior without replacing the environment.

## Interaction controls

The interaction layer is implemented without tutorial or guide UI so interface work can subscribe to semantic results later.

### Desktop

- Move: `WASD` or arrow keys
- Turn: drag horizontally with the left mouse button
- Open the door: click the door while close enough
- Teleport: press `T`, point at a teal destination pad, then click; press `T` again or `Escape` to cancel
- Grab or drop the orange cube: point at it and press `E`
- Open or close the menu: press `Tab` or click **Menu (Tab)**; `Escape` also closes it
- Teleport with the map: open the menu, choose **Map**, then click a pad
- Enter the experiment placeholder: click the blue panel on the far wall; click the teal button inside to return to the lounge (spawn) facing forward

### Meta Quest

- Move: left thumbstick
- Snap turn: right thumbstick left/right in 30° increments
- Teleport: hold the right thumbstick forward to aim, release to complete, or pull backward to cancel
- Select/open: either trigger
- Grab/drop: either grip
- Open or close the wrist menu: X on the left controller when a supported Quest Touch profile is reported; the menu appears above the left controller
- Teleport with the map: point the right controller at **Map** on the wrist menu, pull the trigger, then select a numbered pad
- Enter the experiment placeholder: point at the blue panel on the far wall and pull a trigger; select the teal button inside to return to the lounge

Quest mappings are implemented against WebXR `xr-standard` gamepads and still require physical-headset validation.

## Validate

```powershell
npm run typecheck
npm test
npm run build
npm run preview -- --host
```

## Current scope

The current prototype provides one shared Three.js graybox, desktop/WebXR entry, semantic actions, input adapters, locomotion, teleportation, door interaction, grab/drop, the menu and map, and a scoped experiment-entry and lounge-return placeholder with a fade transition. Tutorial progression, guide UI, and complete recovery presentation remain later work.

The current interface, including the wrist menu, desktop menu, and map, is a neutral provisional developer shell, not an approved visual design. Replace it with the Figma source once it exists.
