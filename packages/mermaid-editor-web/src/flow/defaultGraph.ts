import { applyFlowEdgeStyle } from './edgeStyle';
import type { FlowEdge, FlowNode } from './types';

const templateNodes: FlowNode[] = [
  {
    id: 'A',
    type: 'flow',
    position: { x: 0, y: 80 },
    data: { label: 'Edit me', shape: 'rect' },
  },
  {
    id: 'B',
    type: 'flow',
    position: { x: 260, y: 80 },
    data: { label: 'Preview', shape: 'stadium' },
  },
  {
    id: 'C',
    type: 'flow',
    position: { x: 520, y: 60 },
    data: { label: 'Mermaid', shape: 'diamond' },
  },
];

const templateEdges: FlowEdge[] = [
  applyFlowEdgeStyle({ id: 'e-A-B', source: 'A', target: 'B' }),
  applyFlowEdgeStyle({ id: 'e-B-C', source: 'B', target: 'C' }),
];

export function createInitialNodes(): FlowNode[] {
  return structuredClone(templateNodes);
}

export function createInitialEdges(): FlowEdge[] {
  return structuredClone(templateEdges);
}
