import type { FlowShape } from './types';

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
  { shape: 'diamond', label: 'Diamond', hint: '{}' },
  { shape: 'circle', label: 'Circle', hint: '(())' },
] as const;
