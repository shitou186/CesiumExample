import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findCatalogItemByMain } from "../src/components/code-editor/example-resources.mjs";

const configPath = new URL("../src/config/example.json", import.meta.url);
const mapPath = new URL(
  "../src/example/layer-graphic/geojson/mask/map.js",
  import.meta.url,
);

test("declares the polygon-clipping UMD resource", async () => {
  const catalog = JSON.parse(await readFile(configPath, "utf8"));
  const item = findCatalogItemByMain(catalog, "layer-graphic/geojson/mask");

  assert.deepEqual(item.resources, [
    "@/libs/polygon-clipping/polygon-clipping.umd.min.js",
  ]);
});

test("uses and validates the polygonClipping UMD global", async () => {
  const source = await readFile(mapPath, "utf8");

  assert.match(source, /globalThis\.polygonClipping/);
  assert.match(source, /typeof library\.difference !== "function"/);
  assert.match(
    source,
    /export function difference\(subject, \.\.\.clipGeometries\)/,
  );
  assert.match(
    source,
    /library\.difference\(subject, \.\.\.clipGeometries\)/,
  );
});
