export function getResourceKind(url) {
  const pathname = new URL(url, "http://localhost").pathname.toLowerCase();

  if (pathname.endsWith(".css")) {
    return "style";
  }
  if (/\.(?:c|m)?js$/.test(pathname)) {
    return "script";
  }

  throw new Error(`Unsupported example resource type: ${url}`);
}

function appendAndWait(element, parent, resource) {
  return new Promise((resolve, reject) => {
    element.addEventListener("load", resolve, { once: true });
    element.addEventListener(
      "error",
      () => {
        reject(
          new Error(
            `Failed to load example resource: ${resource.label} (${resource.url})`,
          ),
        );
      },
      { once: true },
    );
    parent.append(element);
  });
}

export async function loadResources(resources, documentObject = document) {
  for (const resource of resources) {
    const kind = getResourceKind(resource.url);
    const element = documentObject.createElement(
      kind === "style" ? "link" : "script",
    );

    if (kind === "style") {
      element.rel = "stylesheet";
      element.href = resource.url;
    } else {
      element.src = resource.url;
    }

    await appendAndWait(element, documentObject.head, resource);
  }
}
