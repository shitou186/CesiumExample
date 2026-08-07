export type ResolvedResource = Readonly<{
  label: string;
  url: string;
}>;

export function getResourceKind(url: string): "script" | "style";

export function loadResources(
  resources: readonly ResolvedResource[],
  documentObject?: Document,
): Promise<void>;
