import * as Cesium from "cesium";
import { init, parse } from "es-module-lexer";
import { createApp, nextTick, type App, type Component } from "vue";
import {
  loadResources,
  type ResolvedResource,
} from "./resource-loader.mjs";
import {
  disposeExampleRuntime,
  mountExampleView,
  resolveExampleViewLoader,
} from "./example-view-runtime.mjs";
import "./style.css";

type ExampleModule = Record<string, unknown> & {
  beforeMounted?: () => void | Promise<void>;
  onMounted?: () => void | Promise<void>;
  beforeUnmount?: () => void | Promise<void>;
  onUnmounted?: () => void | Promise<void>;
};

type LibraryName = "cesium" | "lodash-es" | "turf";

type SourceReplacement = {
  start: number;
  end: number;
  source: string;
};

const libraryLoaders: Record<LibraryName, () => Promise<unknown>> = {
  cesium: async () => Cesium,
  "lodash-es": () => import("lodash-es"),
  turf: () => import("@turf/turf"),
};

const libraryAliases: Record<string, LibraryName> = {
  cesium: "cesium",
  turf: "turf",
  "@turf/turf": "turf",
  lodash: "lodash-es",
  "lodash-es": "lodash-es",
};

const libraryCache = new Map<LibraryName, Promise<unknown>>();
const exampleViewModules = import.meta.glob<Component>(
  "@/example/**/view.vue",
  { import: "default" },
);
let activeModule: ExampleModule | undefined;
let activeViewApp: Pick<App, "mount" | "unmount"> | undefined;

async function importLibrary(name: LibraryName) {
  const loader = libraryLoaders[name];
  if (!loader) {
    throw new Error(`Unsupported runtime library: ${name}`);
  }

  let modulePromise = libraryCache.get(name);
  if (!modulePromise) {
    modulePromise = loader();
    libraryCache.set(name, modulePromise);
  }
  return modulePromise;
}

Object.assign(globalThis, { Cesium, importLibrary });

function splitImportClause(clause: string) {
  const parts: string[] = [];
  let start = 0;
  let braceDepth = 0;

  for (let index = 0; index < clause.length; index += 1) {
    const character = clause[index];
    if (character === "{") braceDepth += 1;
    if (character === "}") braceDepth -= 1;
    if (character === "," && braceDepth === 0) {
      parts.push(clause.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(clause.slice(start).trim());
  return parts.filter(Boolean);
}

function createStaticImportReplacement(
  clause: string,
  libraryName: LibraryName,
  importIndex: number,
) {
  if (!clause) {
    return {
      source: `await globalThis.importLibrary(${JSON.stringify(libraryName)});`,
      bindings: [] as string[],
    };
  }

  const parts = splitImportClause(clause);
  const defaultBinding = parts.find(
    (part) => !part.startsWith("{") && !part.startsWith("*"),
  );
  const namespacePart = parts.find((part) => part.startsWith("*"));
  const namedPart = parts.find((part) => part.startsWith("{"));
  const namespaceBinding = namespacePart?.match(
    /^\*\s+as\s+([A-Za-z_$][\w$]*)$/,
  )?.[1];
  const namedBindings = namedPart
    ? namedPart
        .slice(1, -1)
        .split(",")
        .map((binding) => binding.trim())
        .filter(Boolean)
    : [];

  if (namespacePart && !namespaceBinding) {
    throw new SyntaxError(`Unsupported runtime import clause: ${clause}`);
  }
  if (defaultBinding && !/^[A-Za-z_$][\w$]*$/.test(defaultBinding)) {
    throw new SyntaxError(`Unsupported default import binding: ${defaultBinding}`);
  }

  const bindings = [
    ...(defaultBinding ? [defaultBinding] : []),
    ...(namespaceBinding ? [namespaceBinding] : []),
    ...namedBindings.map((binding) => {
      const match = binding.match(
        /^(?:["'][^"']+["']|[A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/,
      );
      if (!match) {
        throw new SyntaxError(`Unsupported named import binding: ${binding}`);
      }
      return match[1] || binding;
    }),
  ];

  const moduleBinding = `__cesiumExampleImport${importIndex}`;
  const lines = [
    `const ${moduleBinding} = await globalThis.importLibrary(${JSON.stringify(libraryName)});`,
  ];

  if (defaultBinding) {
    lines.push(
      `const ${defaultBinding} = ${moduleBinding}.default ?? ${moduleBinding};`,
    );
  }
  if (namespaceBinding) {
    lines.push(`const ${namespaceBinding} = ${moduleBinding};`);
  }
  if (namedBindings.length) {
    const destructuring = namedBindings
      .map((binding) => binding.replace(/\s+as\s+/, ": "))
      .join(", ");
    lines.push(`const { ${destructuring} } = ${moduleBinding};`);
  }

  return { source: lines.join("\n"), bindings };
}

async function transformRuntimeImports(code: string) {
  await init;
  const [imports] = parse(code);
  const replacements: SourceReplacement[] = [];
  const importedBindings = new Set<string>();

  imports.forEach((importSpecifier, importIndex) => {
    if (importSpecifier.d !== -1 || !importSpecifier.n) return;

    const libraryName = libraryAliases[importSpecifier.n];
    if (!libraryName) {
      if (!importSpecifier.n.startsWith(".") && !importSpecifier.n.startsWith("/")) {
        throw new Error(
          `Unsupported bare module import "${importSpecifier.n}". Supported modules: ${Object.keys(libraryAliases).join(", ")}`,
        );
      }
      return;
    }

    const clauseWithFrom = code
      .slice(importSpecifier.ss + "import".length, importSpecifier.s - 1)
      .trim();
    const clause = clauseWithFrom.replace(/\s+from\s*$/, "").trim();
    const replacement = createStaticImportReplacement(
      clause,
      libraryName,
      importIndex,
    );
    replacement.bindings.forEach((binding) => importedBindings.add(binding));
    replacements.push({
      start: importSpecifier.ss,
      end: importSpecifier.se,
      source: replacement.source,
    });
  });

  let transformedCode = code;
  replacements
    .sort((left, right) => right.start - left.start)
    .forEach((replacement) => {
      transformedCode =
        transformedCode.slice(0, replacement.start) +
        replacement.source +
        transformedCode.slice(replacement.end);
    });

  return { code: transformedCode, importedBindings };
}

async function dispose() {
  const moduleToDispose = activeModule;
  const viewAppToDispose = activeViewApp;
  activeModule = undefined;
  activeViewApp = undefined;

  await disposeExampleRuntime({
    module: moduleToDispose,
    viewApp: viewAppToDispose,
    container: document.getElementById("cesiumContainer") ?? undefined,
  });
}

async function run(
  code: string,
  exampleId: string,
  resources: ResolvedResource[] = [],
) {
  await dispose();
  await loadResources(resources);

  const container = document.getElementById("cesiumContainer");
  if (!container) {
    throw new Error("Runner container #cesiumContainer was not found");
  }

  let moduleUrl: string | undefined;
  try {
    const viewLoader = resolveExampleViewLoader(exampleViewModules, exampleId);
    activeViewApp = await mountExampleView({
      loader: viewLoader,
      container,
      createApp,
      nextTick,
    });

    const transformed = await transformRuntimeImports(code);
    const cesiumBinding = transformed.importedBindings.has("Cesium")
      ? ""
      : "const Cesium = globalThis.Cesium;";

    const source = `
${cesiumBinding}
globalThis.Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxNDFhNjAwZC00ZGY5LTRlMDAtODkwNy00NTE3OWE5OWRjMWIiLCJpZCI6MzM2NjksImlhdCI6MTYyMzMwNTA1MX0.egWNYNFOcuWertsrejw0fjVD0GBhKbUUj0oQWVqJgSc";
const importLibrary = globalThis.importLibrary;
${transformed.code}
//# sourceURL=cesium-example://${exampleId}/map.js
`;
    moduleUrl = URL.createObjectURL(
      new Blob([source], { type: "text/javascript" }),
    );

    const loadedModule = (await import(
      /* @vite-ignore */ moduleUrl
    )) as ExampleModule;
    activeModule = loadedModule;
    await loadedModule.beforeMounted?.();
    await loadedModule.onMounted?.();

    return {
      exports: Object.keys(loadedModule).filter(
        (name) => typeof loadedModule[name] === "function",
      ),
    };
  } catch (error) {
    await dispose();
    throw error;
  } finally {
    if (moduleUrl) URL.revokeObjectURL(moduleUrl);
  }
}

function invoke(name: string, args: unknown[] = []) {
  const method = activeModule?.[name];
  if (typeof method !== "function") {
    throw new Error(`Runner export is not callable: ${name}`);
  }
  return method(...args);
}

const runnerApi = {
  run,
  invoke,
  dispose,
  libraries: Object.keys(libraryLoaders),
};

Object.assign(window, { __CESIUM_RUNNER__: runnerApi });
