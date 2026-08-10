# Example View Runtime Design

## Goal

Allow an example to declare custom DOM inside the runner iframe before its
`map.js` lifecycle starts. This enables layouts such as two side-by-side
Cesium viewers while preserving the existing iframe isolation and the delayed
mounting of parent-page control panels.

## Background

The current editor has two documents:

- The parent editor document renders an optional example `index.vue`.
- The runner iframe owns `#cesiumContainer` and executes `map.js`.

Consequently, DOM rendered by `index.vue` cannot be selected by `map.js`
inside the iframe. The current `mountAfterRun` order is intentional: the
parent control panel mounts only after the runner has exposed the `mapWork`
proxy. Reversing that order would not cross the iframe boundary and would
also reintroduce early control-panel access to an unavailable `mapWork`.

The Mars3D editor uses the same separation. Its iframe template creates the
map container before loading example code, while `index.vue` remains a parent
page control panel. This design adopts that separation while using a Vite-built
Vue component for an example-specific iframe layout.

## File Responsibilities

An example may contain the following files:

```text
src/example/<example-id>/
├── map.js
├── view.vue
└── index.vue
```

- `map.js` contains Cesium behavior and exported lifecycle/actions.
- `view.vue` is optional and renders only inside the runner iframe. It owns
  scene layout DOM such as `leftViewer` and `rightViewer`.
- `index.vue` is optional and renders only in the parent editor document. It
  is a control panel that calls exported `map.js` actions through `mapWork`.

The files are independent. An example may have neither optional component,
only one of them, or both.

## Runner Architecture

The runner owns a nullable `viewApp` reference in addition to `activeModule`.
It discovers example view components with a Vite glob keyed by example ID.

For every run, the runner performs these steps in order:

1. Dispose the previous example.
2. Load declared external resources.
3. Resolve the example's optional `view.vue`.
4. If present, create and mount a Vue app on `#cesiumContainer`.
5. Await Vue's next render tick so the view DOM is queryable.
6. Transform and import the submitted `map.js` source.
7. Call `beforeMounted`, then `onMounted`.
8. Return callable export names so the parent can create the `mapWork` proxy.
9. After the runner resolves, mount the optional parent `index.vue` using the
   existing `mountAfterRun` behavior.

Mounting the view before importing submitted code guarantees that both module
top-level code and lifecycle functions see the custom DOM. Examples without a
`view.vue` skip steps 3 through 5 and continue using `#cesiumContainer`
directly, preserving existing behavior.

## Disposal Lifecycle

Disposal runs in this order:

1. Clear the active module reference to prevent further parent invocations.
2. Call `map.js` `beforeUnmount` and `onUnmounted` hooks when present.
3. Unmount `viewApp` when present.
4. Clear `#cesiumContainer` and reset runner state.

Map-specific resources remain the responsibility of `map.js`. In particular,
an example that creates Cesium `Viewer` instances must call `destroy()` for
each surviving instance during `onUnmounted`. The runner guarantees the DOM
remains available until those hooks finish.

If view mounting fails, `map.js` is not imported or executed. If importing or
initializing `map.js` fails, the runner performs the same disposal sequence and
propagates the error to the existing `run-error` UI.

## Editor Presentation

The editor continues treating `map.js` as the only editable source. Vue files
remain read-only.

The source viewer distinguishes the two optional Vue roles:

- `view.vue`: displayed as **Scene Layout**.
- `index.vue`: displayed as **Control Panel**.

When only one exists, only that entry is shown. When both exist, the user can
switch between them. This avoids presenting iframe scene layout as a parent UI
panel.

## Compare Example Migration

The existing `map/double/compare/index.vue` scene markup and styles move to
`view.vue`. The example does not need an `index.vue` unless a separate control
panel is added later.

`view.vue` renders a full-size flex layout containing `#leftViewer` and
`#rightViewer`. After its DOM is mounted, `map.js` creates one Cesium `Viewer`
for each child container. Its `onUnmounted` implementation removes registered
listeners and destroys both viewers.

## Compatibility

- Existing examples without `view.vue` require no changes.
- The current iframe-per-run reset behavior remains unchanged.
- Existing parent `index.vue` components keep their current delayed mount
  order and `mapWork` contract.
- Runtime library aliases and declared resource loading remain unchanged.
- A `view.vue` must not create a competing Viewer on `#cesiumContainer`; when
  present, `map.js` targets containers rendered by the view.

## Verification

Automated verification covers:

1. A view DOM node exists before submitted module top-level code and
   `onMounted` execute.
2. An example without `view.vue` follows the existing direct-container path.
3. View-mount failure prevents map execution and surfaces the original error.
4. Map initialization failure invokes cleanup and unmounts the view.
5. Disposal calls map hooks before removing the view DOM.
6. The existing test that mounts the parent panel only after runner readiness
   continues to pass.

Project verification also runs the complete test suite and production build.
Manual browser verification covers one unchanged single-Viewer example and
`map/double/compare`, including initial load, Run, Reset, navigation away, and
return navigation.

## Out of Scope

- Editing `view.vue` or `index.vue` live in the code editor.
- Removing the iframe boundary.
- Passing Vue component instances across the iframe boundary.
- Automatically destroying Cesium objects created by example code.
