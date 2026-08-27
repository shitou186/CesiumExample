export type ClassModuleLoader = () => Promise<unknown>;

export type ClassModuleRegistry = {
  loaders: Record<string, ClassModuleLoader>;
  aliases: Record<string, string>;
};

export function createClassModuleRegistry(
  modules: Record<string, ClassModuleLoader>,
): ClassModuleRegistry;
