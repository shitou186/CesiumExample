import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mapPath = new URL(
  "../src/example/map/other/mask-div/map.js",
  import.meta.url,
);

test("uses the model Z axis as building height in customShader2", async () => {
  const source = await readFile(mapPath, "utf8");
  const shader = source.match(
    /function customShader2\(tileset, color = Cesium\.Color\.CYAN\) \{([\s\S]*?)tileset\.customShader = customShader;/,
  )?.[1];

  assert.ok(shader, "customShader2 should create and assign a CustomShader");
  assert.match(shader, /fsInput\.attributes\.positionMC\.z/);
  assert.doesNotMatch(shader, /fsInput\.attributes\.positionMC\.y/);
});

test("binds customShader2 before the tileset is rendered", async () => {
  const source = await readFile(mapPath, "utf8");
  const add3dtiles = source.match(
    /async function add3dtiles\(\) \{([\s\S]*?)\n\}/,
  )?.[1];

  assert.ok(add3dtiles, "add3dtiles should load and render the tileset");
  assert.ok(
    add3dtiles.indexOf("customShader2(") <
      add3dtiles.indexOf("viewer.scene.primitives.add(tileset)"),
    "custom shader should be bound before the tileset enters the scene",
  );
});

test("passes the supplied color into customShader2 as a uniform", async () => {
  const source = await readFile(mapPath, "utf8");
  const shader = source.match(
    /function customShader2\(tileset, color = Cesium\.Color\.CYAN\) \{([\s\S]*?)tileset\.customShader = customShader;/,
  )?.[1];

  assert.ok(shader, "customShader2 should accept a Cesium.Color");
  assert.match(shader, /u_baseColor:\s*\{/);
  assert.match(shader, /type:\s*Cesium\.UniformType\.VEC3/);
  assert.match(
    shader,
    /new Cesium\.Cartesian3\(color\.red, color\.green, color\.blue\)/,
  );
  assert.match(shader, /material\.diffuse\s*=\s*u_baseColor\s*\*/);
  assert.match(
    source,
    /customShader2\(\s*tileset,\s*Cesium\.Color\.fromCssColorString\("#00ffff"\),?\s*\)/,
  );
});
