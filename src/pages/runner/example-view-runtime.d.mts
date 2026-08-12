import type { App, Component } from "vue";

type ViewApp = Pick<App, "mount" | "unmount">;

type ExampleLifecycle = {
  beforeUnmount?: () => void | Promise<void>;
  onUnmounted?: () => void | Promise<void>;
};

export function resolveExampleViewLoader(
  viewModules: Record<string, (() => Promise<Component>) | undefined>,
  exampleId: string,
): (() => Promise<Component>) | undefined;

export function mountExampleView(options: {
  loader?: () => Promise<Component>;
  container: Element;
  createApp: (component: Component) => ViewApp;
  nextTick: () => Promise<void>;
}): Promise<ViewApp | undefined>;

export function disposeExampleRuntime(options: {
  module?: ExampleLifecycle;
  viewApp?: ViewApp;
  container?: Element;
}): Promise<void>;
