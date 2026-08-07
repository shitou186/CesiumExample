import assert from "node:assert/strict";
import test from "node:test";
import {
  findCatalogItemByMain,
  resolveExampleResources,
} from "../src/components/code-editor/example-resources.mjs";

test("finds a nested catalog item by main", () => {
  const mask = {
    name: "mask",
    main: "layer-graphic/geojson/mask",
    resources: ["@/libs/polygon-clipping/polygon-clipping.umd.min.js"],
  };

  assert.equal(
    findCatalogItemByMain([{ children: [{ children: [mask] }] }], mask.main),
    mask,
  );
});

test("resolves resources in declaration order", () => {
  const result = resolveExampleResources({
    resources: [
      "@/libs/polygon-clipping/polygon-clipping.umd.min.js",
      "map.css",
      "/img/div-graphic/divGraphic.css",
      "https://cdn.example.com/plugin.js",
    ],
    exampleMain: "layer-graphic/geojson/mask",
    baseUrl: "https://example.com/cesium-example/",
    libraryResourceUrls: {
      "/src/libs/polygon-clipping/polygon-clipping.umd.min.js":
        "/cesium-example/assets/polygon-clipping.123.js",
    },
    exampleResourceUrls: {
      "/src/example/layer-graphic/geojson/mask/map.css":
        "/cesium-example/assets/mask.456.css",
    },
  });

  assert.deepEqual(result, [
    {
      label: "@/libs/polygon-clipping/polygon-clipping.umd.min.js",
      url: "/cesium-example/assets/polygon-clipping.123.js",
    },
    { label: "map.css", url: "/cesium-example/assets/mask.456.css" },
    {
      label: "/img/div-graphic/divGraphic.css",
      url: "https://example.com/cesium-example/img/div-graphic/divGraphic.css",
    },
    {
      label: "https://cdn.example.com/plugin.js",
      url: "https://cdn.example.com/plugin.js",
    },
  ]);
});

test("rejects an unresolved packaged resource", () => {
  assert.throws(
    () =>
      resolveExampleResources({
        resources: ["missing.js"],
        exampleMain: "layer-graphic/geojson/mask",
        baseUrl: "https://example.com/",
        libraryResourceUrls: {},
        exampleResourceUrls: {},
      }),
    /Unable to resolve example resource: missing\.js/,
  );
});
