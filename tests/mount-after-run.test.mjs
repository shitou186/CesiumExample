import assert from "node:assert/strict";
import test from "node:test";
import { mountAfterRun } from "../src/components/code-editor/mount-after-run.mjs";

test("mounts the panel only after the runner resolves", async () => {
  const events = [];
  let finishRun;
  const runExample = () =>
    new Promise((resolve) => {
      finishRun = () => {
        events.push("runner-ready");
        resolve();
      };
    });

  const pending = mountAfterRun(runExample, () =>
    events.push("panel-mounted"),
  );
  assert.deepEqual(events, []);

  finishRun();
  await pending;

  assert.deepEqual(events, ["runner-ready", "panel-mounted"]);
});
