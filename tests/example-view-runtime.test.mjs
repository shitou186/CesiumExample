import assert from "node:assert/strict";
import test from "node:test";
import {
  disposeExampleRuntime,
  mountExampleView,
  resolveExampleViewLoader,
} from "../src/pages/runner/example-view-runtime.mjs";

test("resolves a view loader by example id", () => {
  const loader = async () => ({ name: "CompareView" });
  const modules = {
    "/src/example/map/double/compare/view.vue": loader,
  };

  assert.equal(
    resolveExampleViewLoader(modules, "map/double/compare"),
    loader,
  );
  assert.equal(resolveExampleViewLoader(modules, "map/create"), undefined);
});

test("mounts a view and waits for its DOM tick", async () => {
  const events = [];
  const component = { name: "CompareView" };
  const app = {
    mount(container) {
      events.push(["mount", container]);
    },
    unmount() {
      events.push(["unmount"]);
    },
  };
  const container = {};

  const result = await mountExampleView({
    loader: async () => {
      events.push(["load"]);
      return component;
    },
    container,
    createApp(received) {
      events.push(["create", received]);
      return app;
    },
    nextTick: async () => events.push(["tick"]),
  });

  assert.equal(result, app);
  assert.deepEqual(events, [
    ["load"],
    ["create", component],
    ["mount", container],
    ["tick"],
  ]);
});

test("does nothing when an example has no view", async () => {
  let createCalls = 0;
  const result = await mountExampleView({
    loader: undefined,
    container: {},
    createApp() {
      createCalls += 1;
    },
    nextTick: async () => {},
  });

  assert.equal(result, undefined);
  assert.equal(createCalls, 0);
});

test("finishes the view DOM tick before map module execution", async () => {
  const events = [];
  await mountExampleView({
    loader: async () => ({}),
    container: {},
    createApp: () => ({
      mount: () => events.push("view-mounted"),
      unmount() {},
    }),
    nextTick: async () => events.push("view-dom-ready"),
  });

  events.push("map-module-top-level");
  events.push("map-onMounted");
  assert.deepEqual(events, [
    "view-mounted",
    "view-dom-ready",
    "map-module-top-level",
    "map-onMounted",
  ]);
});

test("cleans a view when its render tick fails", async () => {
  const events = [];
  const container = {
    replaceChildren() {
      events.push("clear");
    },
  };

  await assert.rejects(
    mountExampleView({
      loader: async () => ({}),
      container,
      createApp: () => ({
        mount: () => events.push("mount"),
        unmount: () => events.push("unmount"),
      }),
      nextTick: async () => {
        throw new Error("view render failed");
      },
    }),
    /view render failed/,
  );

  assert.deepEqual(events, ["mount", "unmount", "clear"]);
});

test("disposes map hooks before view DOM", async () => {
  const events = [];

  await disposeExampleRuntime({
    module: {
      beforeUnmount: async () => events.push("before-map"),
      onUnmounted: async () => events.push("after-map"),
    },
    viewApp: { unmount: () => events.push("view") },
    container: { replaceChildren: () => events.push("clear") },
  });

  assert.deepEqual(events, ["before-map", "after-map", "view", "clear"]);
});
