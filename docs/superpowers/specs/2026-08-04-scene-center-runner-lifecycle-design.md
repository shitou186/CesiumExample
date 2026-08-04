# Scene Center Runner Lifecycle Fix

## Problem

When the `map/options/scene-center` example opens, its Vue control panel can mount before the iframe runner has finished loading `map.js` and publishing the exported methods to `window.mapWork`. Calling `window.mapWork.openListener()` during that interval fails.

The example also contains two independent runtime errors:

- `onMounted()` calls an undefined `loadTerrain()` function even though this example does not need terrain.
- `getCameraView()` creates `cartographic` but reads from an undefined `position` variable.

## Chosen Design

Use the existing runner-success boundary as the readiness contract:

1. Load the example source and Vue panel module together, but do not mount the panel yet.
2. Run `map.js` and wait until `Map.run()` has completed. At that point `window.mapWork` contains proxies for the module exports.
3. Mount the Vue panel only after the runner succeeds.
4. Remove the unused `loadTerrain()` call from the scene-center example.
5. Read longitude, latitude, and altitude from `camera.positionCartographic`.
6. Return Cesium's listener-removal callback from `openListener()`. The Vue panel awaits registration and invokes the removal callback during unmount.

This keeps readiness orchestration in the code editor, where runner state is owned, without adding polling or expanding the iframe API.

## Data Flow

`CodeEditor.onMounted` loads source and panel metadata, calls `Map.run`, and waits for `runner.run`. The map runner imports the module and executes its lifecycle. `Map.vue` then creates `window.mapWork`, resolves `run`, and only afterward does the editor mount the panel. The panel registers its camera listener through the ready proxy and retains the returned cleanup function.

## Error Handling

If the runner fails, the panel remains unmounted and the existing runner error alert displays the failure. Listener cleanup is guarded so an incomplete registration cannot throw during component teardown.

## Verification

- A regression check must prove the panel is assigned only after `Map.run()` resolves.
- A regression check must prove the scene-center example no longer calls `loadTerrain()` and reads `cartographic` coordinates.
- The production build must pass.
- Manual verification should confirm the page opens without `openListener is not a function`, moving the camera does not raise `position is not defined`, and leaving the page removes the listener.

## Scope

No changes are required in `src/pages/runner/main.ts`. No terrain is loaded, and no general-purpose event bridge or polling mechanism is introduced.
