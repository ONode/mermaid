import type { Edge, Node } from '@xyflow/react';

/** Mermaid `flowchart …` direction keywords supported by parse/serialize. */
export type FlowchartDirection = 'TD' | 'LR' | 'RL' | 'TB' | 'BT';

/** Mermaid flowchart node shapes supported by parse/serialize. */
export type FlowShape = 'rect' | 'stadium' | 'cylinder' | 'diamond' | 'circle';

export type FlowShapeNodeData = {
  label: string;
  shape: FlowShape;
  /** Custom fill; omitted or null = theme default (no `style` line in Mermaid). */
  backgroundColor?: string | null;
};

export type FlowSubgraphNodeData = {
  title: string;
  /** `direction` line inside the subgraph block. */
  direction?: FlowchartDirection;
};

export type FlowShapeNode = Node<FlowShapeNodeData, 'flow'>;
export type FlowSubgraphNode = Node<FlowSubgraphNodeData, 'subgraph'>;

export type FlowNode = FlowShapeNode | FlowSubgraphNode;

/** React Flow edge path algorithm. */
export type FlowEdgePathType = 'smoothstep' | 'step' | 'default' | 'straight';

/** Canvas stroke pattern. */
export type FlowEdgeLineStyle = 'solid' | 'dashed';

/** Mermaid `==>` thick stroke vs default `–>`. */
export type FlowEdgeStrokeWeight = 'normal' | 'thick';

export type FlowEdgeArrowMode = 'end' | 'start' | 'both' | 'none';

export type FlowEdgeData = {
  pathType?: FlowEdgePathType;
  lineStyle?: FlowEdgeLineStyle;
  strokeWeight?: FlowEdgeStrokeWeight;
  strokeColor?: string | null;
  arrowStart?: boolean;
  arrowEnd?: boolean;
};

export type FlowEdge = Edge<FlowEdgeData>;

export function isFlowShapeNode(node: FlowNode): node is FlowShapeNode {
  return node.type === 'flow';
}

export function isFlowSubgraphNode(node: FlowNode): node is FlowSubgraphNode {
  return node.type === 'subgraph';
}

export function nodeDisplayLabel(node: FlowNode): string {
  return isFlowSubgraphNode(node) ? node.data.title : node.data.label;
}
