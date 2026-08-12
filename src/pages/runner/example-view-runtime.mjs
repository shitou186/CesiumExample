export function resolveExampleViewLoader(viewModules, exampleId) {
  return viewModules[`/src/example/${exampleId}/view.vue`];
}

export async function mountExampleView({
  loader,
  container,
  createApp,
  nextTick,
}) {
  if (!loader) return undefined;

  const component = await loader();
  const viewApp = createApp(component);
  try {
    viewApp.mount(container);
    await nextTick();
    return viewApp;
  } catch (error) {
    viewApp.unmount();
    container.replaceChildren();
    throw error;
  }
}

export async function disposeExampleRuntime({ module, viewApp, container }) {
  try {
    await module?.beforeUnmount?.();
    await module?.onUnmounted?.();
  } finally {
    viewApp?.unmount();
    container?.replaceChildren();
  }
}
