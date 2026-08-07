const externalUrlPattern = /^(?:https?:)?\/\//i;

export function findCatalogItemByMain(items, main) {
  for (const item of items || []) {
    if (item.main === main) {
      return item;
    }

    const childMatch = findCatalogItemByMain(item.children, main);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
}

export function resolveExampleResources({
  resources = [],
  exampleMain,
  baseUrl,
  libraryResourceUrls,
  exampleResourceUrls,
}) {
  return resources.map((label) => {
    if (externalUrlPattern.test(label)) {
      return { label, url: label };
    }

    if (label.startsWith("/")) {
      return {
        label,
        url: new URL(label.replace(/^\/+/, ""), baseUrl).href,
      };
    }

    const isLibraryResource = label.startsWith("@/libs/");
    const sourcePath = isLibraryResource
      ? `/src/${label.slice(2)}`
      : `/src/example/${exampleMain}/${label.replace(/^\.\//, "")}`;
    const url = isLibraryResource
      ? libraryResourceUrls[sourcePath]
      : exampleResourceUrls[sourcePath];

    if (!url) {
      throw new Error(`Unable to resolve example resource: ${label}`);
    }

    return { label, url };
  });
}
