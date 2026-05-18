import type { FlowEdgeArrowMode, FlowEdgeLineStyle, FlowEdgePathType, FlowShape } from './types';

/** Ten swatches: first clears custom fill; nine explicit fills for Mermaid `style` + canvas. */
export const PRESET_NODE_FILLS: readonly (string | null)[] = [
  null,
  '#141414',
  '#1e293b',
  '#134e4a',
  '#422006',
  '#3b0764',
  '#7f1d1d',
  '#0c4a6e',
  'rgba(245, 248, 194, 0.22)',
  '#3f3f46',
] as const;

export const FLOW_SHAPE_OPTIONS: readonly { shape: FlowShape; label: string; hint: string }[] = [
  { shape: 'rect', label: 'Rectangle', hint: '[]' },
  { shape: 'stadium', label: 'Stadium', hint: '([])' },
  { shape: 'cylinder', label: 'Cylinder', hint: '[()]' },
  { shape: 'diamond', label: 'Diamond', hint: '{}' },
  { shape: 'circle', label: 'Circle', hint: '(())' },
] as const;

export const PRESET_EDGE_STROKES: readonly (string | null)[] = [
  null,
  'rgba(245, 248, 194, 0.85)',
  '#94a3b8',
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#c084fc',
  '#fb7185',
  '#3f3f46',
] as const;

export const FLOW_EDGE_PATH_OPTIONS: readonly {
  pathType: FlowEdgePathType;
  label: string;
  hint: string;
}[] = [
  { pathType: 'smoothstep', label: 'Smooth', hint: 'rounded' },
  { pathType: 'step', label: 'Step', hint: '90°' },
  { pathType: 'default', label: 'Curve', hint: 'bezier' },
  { pathType: 'straight', label: 'Straight', hint: 'line' },
] as const;

export const FLOW_EDGE_LINE_STYLE_OPTIONS: readonly {
  lineStyle: FlowEdgeLineStyle;
  label: string;
}[] = [
  { lineStyle: 'solid', label: 'Solid' },
  { lineStyle: 'dashed', label: 'Dashed' },
] as const;

export const FLOW_EDGE_ARROW_OPTIONS: readonly {
  mode: FlowEdgeArrowMode;
  label: string;
  hint: string;
}[] = [
  { mode: 'end', label: '→', hint: 'to target' },
  { mode: 'start', label: '←', hint: 'from source' },
  { mode: 'both', label: '↔', hint: 'both ends' },
  { mode: 'none', label: '—', hint: 'no arrows' },
] as const;
