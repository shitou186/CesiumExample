const moduleExtensionPattern = /\.(?:[cm]?[jt]s|[jt]sx)$/;

function createClassModuleAlias(modulePath) {
  const normalizedPath = modulePath.replaceAll("\\", "/");
  const classDirectoryMarker = "/class/";
  const markerIndex = normalizedPath.lastIndexOf(classDirectoryMarker);

  if (markerIndex === -1 || !moduleExtensionPattern.test(normalizedPath)) {
    throw new Error(`Invalid class module path: ${modulePath}`);
  }

  const relativePath = normalizedPath
    .slice(markerIndex + classDirectoryMarker.length)
    .replace(moduleExtensionPattern, "");
  return `@class/${relativePath}`;
}

export function createClassModuleRegistry(modules) {
  const loaders = {};
  const aliases = {};

  Object.entries(modules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .forEach(([modulePath, loader]) => {
      const alias = createClassModuleAlias(modulePath);
      if (Object.hasOwn(loaders, alias)) {
        throw new Error(`Duplicate class module alias: ${alias}`);
      }

      loaders[alias] = loader;
      aliases[alias] = alias;
    });

  return { loaders, aliases };
}
