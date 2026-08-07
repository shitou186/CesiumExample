import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const editorPath = new URL(
  "../src/components/code-editor/index.vue",
  import.meta.url,
);

test("shows ordered resources as safe new-tab links", async () => {
  const source = await readFile(editorPath, "utf8");

  assert.match(source, /当前示例依赖的资源文件（请注意顺序）/);
  assert.match(source, /v-for="resource in resources"/);
  assert.match(source, /:href="resource\.url"/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noopener noreferrer"/);
});

test("passes resolved resources to the preview component", async () => {
  const source = await readFile(editorPath, "utf8");

  assert.match(source, /<Map[^>]*:resources="resources"/s);
  assert.match(
    source,
    /import\.meta\.glob\("\/src\/libs\/\*\*\/\*\.\{js,css\}"/,
  );
  assert.match(
    source,
    /import\.meta\.glob\("\/src\/example\/\*\*\/\*\.\{js,css\}"/,
  );
});
