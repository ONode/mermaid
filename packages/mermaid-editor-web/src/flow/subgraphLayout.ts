import type { FlowNode } from './types';
import { isFlowSubgraphNode } from './types';

const PADDING_X = 28;
const PADDING_Y = 40;
const DEFAULT_CHILD_W = 200;
const DEFAULT_CHILD_H = 88;
const DEFAULT_SUBGRAPH_W = 280;
const DEFAULT_SUBGRAPH_H = 200;

function childBounds(node: FlowNode): { w: number; h: number } {
  if (isFlowSubgraphNode(node)) {
    const width = typeof node.style?.width === 'number' ? node.style.width : DEFAULT_SUBGRAPH_W;
    const height = typeof node.style?.height === 'number' ? node.style.height : DEFAULT_SUBGRAPH_H;
    return { w: width, h: height };
  }
  return { w: DEFAULT_CHILD_W, h: DEFAULT_CHILD_H };
}

function subgraphDepth(nodeId: string, nodes: FlowNode[]): number {
  let depth = 0;
  let current = nodes.find((n) => n.id === nodeId);
  while (current?.parentId) {
    depth += 1;
    current = nodes.find((n) => n.id === current!.parentId);
  }
  return depth;
}

/** Resize subgraph group nodes from child positions (deepest groups first). */
export function fitSubgraphBounds(nodes: FlowNode[]): FlowNode[] {
  const subgraphIds = nodes.filter(isFlowSubgraphNode).map((n) => n.id);
  subgraphIds.sort((a, b) => subgraphDepth(b, nodes) - subgraphDepth(a, nodes));

  const next = new Map(nodes.map((n) => [n.id, n]));

  for (const sgId of subgraphIds) {
    const sg = next.get(sgId);
    if (!sg || !isFlowSubgraphNode(sg)) {
      continue;
    }
    const children = [...next.values()].filter((n) => n.parentId === sgId);
    if (children.length === 0) {
      continue;
    }
    let maxX = 0;
    let maxY = 0;
    for (const child of children) {
      const { w, h } = childBounds(child);
      maxX = Math.max(maxX, child.position.x + w);
      maxY = Math.max(maxY, child.position.y + h);
    }
    next.set(sgId, {
      ...sg,
      style: {
        ...sg.style,
        width: Math.max(DEFAULT_SUBGRAPH_W, maxX + PADDING_X),
        height: Math.max(DEFAULT_SUBGRAPH_H, maxY + PADDING_Y),
      },
    });
  }

  return [...next.values()];
}

export function placeChildNode(siblingIndex: number): { x: number; y: number } {
  const col = siblingIndex % 2;
  const row = Math.floor(siblingIndex / 2);
  return { x: 24 + col * 200, y: 36 + row * 100 };
}

export function placeSubgraphNode(index: number): { x: number; y: number } {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return { x: col * 320, y: row * 260 };
}
