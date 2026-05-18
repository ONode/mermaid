import type { Edge, Node } from '@xyflow/react';

/** Mermaid `flowchart …` direction keywords supported by parse/serialize. */
export type FlowchartDirection = 'TD' | 'LR' | 'RL' | 'TB' | 'BT';

/** Mermaid flowchart node shapes supported by parse/serialize. */
export type FlowShape = 'rect' | 'stadium' | 'cylinder' | 'diamond' | 'circle';

export type FlowNodeData = {
  label: string;
  shape: FlowShape;
  /** Custom fill; omitted or null = theme default (no `style` line in Mermaid). */
  backgroundColor?: string | null;
};

export type FlowNode = Node<FlowNodeData, 'flow'>;

/** React Flow edge path algorithm. */
export type FlowEdgePathType = 'smoothstep' | 'step' | 'default' | 'straight';

/** Canvas stroke pattern (Mermaid export stays solid `–>` for now). */
export type FlowEdgeLineStyle = 'solid' | 'dashed';

export type FlowEdgeArrowMode = 'end' | 'start' | 'both' | 'none';

export type FlowEdgeData = {
  pathType?: FlowEdgePathType;
  lineStyle?: FlowEdgeLineStyle;
  strokeColor?: string | null;
  arrowStart?: boolean;
  arrowEnd?: boolean;
};

export type FlowEdge = Edge<FlowEdgeData>;
