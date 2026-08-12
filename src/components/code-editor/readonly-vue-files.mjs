export function buildReadonlyVueFiles({ viewSource, panelSource }) {
  return [
    viewSource === undefined
      ? undefined
      : { key: "view", label: "场景布局", source: viewSource },
    panelSource === undefined
      ? undefined
      : { key: "panel", label: "操作面板", source: panelSource },
  ].filter(Boolean);
}
