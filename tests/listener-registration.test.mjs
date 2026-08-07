import assert from "node:assert/strict";
import test from "node:test";
import { createListenerRegistration } from "../src/example/map/options/scene-center/listener-registration.mjs";

test("removes a registered listener when closed", async () => {
  let removed = 0;
  const registration = createListenerRegistration(async () => () => {
    removed += 1;
  });

  await registration.open();
  registration.close();

  assert.equal(removed, 1);
});

test("removes a listener that resolves after the component closes", async () => {
  let resolveRegistration;
  let removed = 0;
  const registration = createListenerRegistration(
    () =>
      new Promise((resolve) => {
        resolveRegistration = resolve;
      }),
  );

  const pending = registration.open();
  registration.close();
  resolveRegistration(() => {
    removed += 1;
  });
  await pending;

  assert.equal(removed, 1);
});
