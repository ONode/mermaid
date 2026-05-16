import type { Edge, Node } from '@xyflow/react';

/** Mermaid `flowchart …` direction keywords supported by parse/serialize. */
export type FlowchartDirection = 'TD' | 'LR' | 'RL' | 'TB' | 'BT';

/** Mermaid flowchart node shapes supported by parse/serialize. */
export type FlowShape = 'rect' | 'stadium' | 'diamond' | 'circle';

export type FlowNodeData = {
  label: string;
  shape: FlowShape;
  /** Custom fill; omitted or null = theme default (no `style` line in Mermaid). */
  backgroundColor?: string | null;
};

export type FlowNode = Node<FlowNodeData, 'flow'>;

export type FlowEdge = Edge;
