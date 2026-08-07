# Example Resource Loading Design

## Goal

Make the `resources` field in `src/config/example.json` an executable, visible example-level dependency declaration. The code editor must show the current example's resources, allow each resource to be opened in a new browser tab, and load JavaScript or CSS resources before executing the example `map.js`.

The first consumer is `layer-graphic/geojson/mask`, which needs the bundled UMD build at `src/libs/polygon-clipping/polygon-clipping.umd.min.js`.

## Scope

- Preserve the existing `resources?: string[]` catalog schema and declaration order.
- Resolve packaged files to build-safe URLs instead of relying on runtime `/src/...` paths.
- Show a resource button only when the selected example declares resources.
- Open a selected resource URL in a new browser tab.
- Load JavaScript and CSS resources in the preview iframe before evaluating `map.js`.
- Expose polygon-clipping through its existing UMD global, `globalThis.polygonClipping`.

The following are out of scope:

- Editing dependency files inside the code editor.
- Treating resource strings as ESM imports or binding their exports into `map.js`.
- Adding package-manager dependencies or copying polygon-clipping into `public`.
- Changing examples without a `resources` declaration.

## Current Constraints

The editor reads each `map.js` as text and sends it to the iframe runner. The runner transforms supported bare imports, creates a Blob URL, and imports that Blob. A relative import from `map.js` therefore resolves against a `blob:` URL and cannot reliably reach `src/libs`.

Although `CatalogObject` and many catalog entries already define `resources`, the current editor does not locate the active catalog item or pass resources to the preview, and the runner does not load them.

## Catalog Declaration

The mask catalog item will declare the UMD file using its source alias path:

```json
"resources": [
  "@/libs/polygon-clipping/polygon-clipping.umd.min.js"
]
```

The configured string remains the user-facing label. It is not used directly as a browser URL.

## Resource Resolution

The editor owns resource resolution because it runs as a Vite module and can use build-time glob imports. It will build URL lookup tables with literal `import.meta.glob` patterns restricted to `**/*.{js,css}` and with `query: "?url"` for:

- files under `src/libs`;
- files under `src/example` for example-relative resource declarations.

Resolution rules are applied in this order:

1. `http://`, `https://`, and protocol-relative URLs remain external URLs.
2. `@/libs/...` is looked up in the bundled library-resource URL table.
3. A relative value such as `map.css` is resolved against `/src/example/<example main>/` and looked up in the example-resource URL table.
4. A root-relative value such as `/img/...` is converted to an application URL while respecting `import.meta.env.BASE_URL`.

Each resolved item has this internal shape:

```ts
type ResolvedResource = {
  label: string;
  url: string;
};
```

An unresolved packaged resource is reported as an editor run error with the original label. The example is not executed with a silently missing dependency.

## Editor UI

The active catalog item is found recursively by matching its `main` value with the `id` query parameter already used to load the example.

When the item has resources, the JavaScript editor header shows a resource-link icon next to the existing JS icon. Clicking it opens a small popover matching the provided reference:

- heading: `当前示例依赖的资源文件（请注意顺序）`;
- resources listed in declaration order;
- each item displays the original catalog label;
- each item is an anchor using the resolved URL, `target="_blank"`, and `rel="noopener noreferrer"`.

The button is absent when the resource list is empty. Opening a resource is independent from running the example.

## Preview and Runner Flow

The resolved resource list is passed through the existing component boundary:

```text
example.json -> code-editor/index.vue -> code-editor/map.vue -> runner.run(...)
```

The runner receives resources as an additional argument. Before transforming and importing `map.js`, it loads resources sequentially to preserve declaration order:

- `.css` URLs create a `<link rel="stylesheet">` and wait for `load`;
- JavaScript URLs create a classic `<script>` and wait for `load`.

The runner iframe is recreated for each editor run, so injected globals and styles are naturally isolated to that run. The existing disposal lifecycle still destroys the Cesium viewer before the frame is replaced.

After the polygon-clipping UMD script loads, the mask example accesses `globalThis.polygonClipping`. It will validate that the expected API exists before attempting geometry operations and throw a descriptive error otherwise.

## Failure Handling

- URL resolution failure: show which configured resource could not be resolved and do not start the runner.
- Script or stylesheet load failure: reject the run with the failing resource URL.
- Unsupported resource extension: treat it as JavaScript only when it is an explicit JavaScript-like URL; otherwise reject it rather than guessing.
- Popup blocking does not affect example execution because links use normal user-initiated anchors.

## Verification

- Unit-test catalog lookup and URL-resolution behavior where it can be extracted as pure logic.
- Verify that the mask resource entry resolves to a Vite-emitted URL.
- Verify runner resource loading preserves order and waits before `map.js` lifecycle execution.
- Verify the resource button is hidden for entries without resources.
- Verify its popover lists the polygon-clipping path and the link uses `_blank` with `noopener noreferrer`.
- Run the production build to catch glob, asset URL, and TypeScript errors.
- Manually open the mask editor, open the resource popover, open polygon-clipping in a new tab, and run the example using `globalThis.polygonClipping`.
