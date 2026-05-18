import { parseAndPushEdgeLine } from './parseEdgeLine';
import { parseSubgraphHeader, uniqueSubgraphId } from './parseSubgraphHeader';
import { unquoteMermaidString } from './mermaidText';
import { fitSubgraphBounds, placeChildNode, placeSubgraphNode } from './subgraphLayout';
import type { FlowchartDirection, FlowEdge, FlowNode, FlowShape } from './types';
import { isFlowSubgraphNode } from './types';

export type ParseResult =
  | { ok: true; nodes: FlowNode[]; edges: FlowEdge[]; direction: FlowchartDirection }
  | { ok: false; error: string };

/** First line: any supported flowchart direction (canvas layout is independent). */
const HEADER = /^\s*flowchart\s+(TD|LR|RL|TB|BT)\s*$/i;

/** Full-line `%%` comments (not `%%{…}` directives). */
const COMMENT_LINE = /^\s*%%(?!\{)/;
const SUBGRAPH_OPEN = /^\s*subgraph\s+(.+)$/i;
const DIRECTION_LINE = /^\s*direction\s+(TD|BT|LR|RL|TB)\s*$/i;
const END_LINE = /^\s*end\s*$/i;
/** `classDef` / `class` styling (ignored for canvas; preview still uses full Mermaid). */
const CLASS_DEF_LINE = /^\s*classDef\b/i;
const CLASS_LINE = /^\s*class\s+/i;

/** Cylinder: id[(label)] */
const NODE_CYLINDER = /^\s*(\w+)\[\(([^)\n]*)\)\]\s*$/;
const NODE_CYLINDER_QUOTED = /^\s*(\w+)\[\(\s*"((?:\\.|[^"\\])*)"\s*\)\]\s*$/;
/** Unquoted rect: id[label] */
const NODE_RECT = /^\s*(\w+)\[([^\]\n]+)\]\s*$/;
/** Quoted rect: id["label with \" "] */
const NODE_RECT_QUOTED = /^\s*(\w+)\["((?:\\.|[^"\\])*)"\]\s*$/;
/** Stadium: id([label]) */
const NODE_STADIUM = /^\s*(\w+)\(\[([^\]\n]+)\]\)\s*$/;
const NODE_STADIUM_QUOTED = /^\s*(\w+)\(\[\s*"((?:\\.|[^"\\])*)"\s*\]\)\s*$/;
/** Circle: id((label)) */
const NODE_CIRCLE = /^\s*(\w+)\(\(([^)\n]*)\)\)\s*$/;
const NODE_CIRCLE_QUOTED = /^\s*(\w+)\(\(\s*"((?:\\.|[^"\\])*)"\s*\)\)\s*$/;
/** Diamond: id{text} */
const NODE_DIA = /^\s*(\w+)\{([^}\n]*)\}\s*$/;
/** Quoted diamond */
const NODE_DIA_QUOTED = /^\s*(\w+)\{"((?:\\.|[^"\\])*)"\}\s*$/;
/** style id fill:... (single-line; supports rgba with spaces) */
const STYLE_FILL = /^\s*style\s+(\w+)\s+fill:\s*(.+)$/;

function countChildren(nodes: Map<string, FlowNode>, parentId: string | undefined): number {
  return [...nodes.values()].filter((n) => n.parentId === parentId).length;
}

function currentParentId(stack: string[]): string | undefined {
  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}

function upsertSubgraphNode(
  nodes: Map<string, FlowNode>,
  id: string,
  title: string,
  parentId?: string
): void {
  const existing = nodes.get(id);
  const siblingIndex = countChildren(nodes, parentId);
  nodes.set(id, {
    id,
    type: 'subgraph',
    position:
      existing?.position ??
      (parentId ? placeChildNode(siblingIndex) : placeSubgraphNode(nodes.size)),
    parentId,
    zIndex: -1,
    data: {
      title,
      ...(existing && isFlowSubgraphNode(existing) && existing.data.direction
        ? { direction: existing.data.direction }
        : {}),
    },
    style: existing?.style ?? { width: 280, height: 200 },
  });
}

function ensureStubNode(
  nodes: Map<string, FlowNode>,
  id: string,
  parentId?: string
): void {
  if (nodes.has(id)) {
    return;
  }
  upsertNode(nodes, id, id, 'rect', parentId);
}

function upsertNode(
  nodes: Map<string, FlowNode>,
  id: string,
  label: string,
  shape: FlowShape,
  parentId?: string
): void {
  const existing = nodes.get(id);
  const flowData: { label: string; shape: FlowShape; backgroundColor?: string } = { label, shape };
  if (existing && existing.type === 'flow' && typeof existing.data.backgroundColor === 'string') {
    flowData.backgroundColor = existing.data.backgroundColor;
  }
  const siblingIndex = countChildren(nodes, parentId);
  nodes.set(id, {
    id,
    type: 'flow',
    position:
      existing?.position ??
      (parentId ? placeChildNode(siblingIndex) : placeNode(id, nodes.size)),
    parentId,
    extent: parentId ? 'parent' : undefined,
    data: flowData,
  });
}

function applyStyleFill(nodes: Map<string, FlowNode>, id: string, fill: string): void {
  const node = nodes.get(id);
  if (!node || node.type !== 'flow') {
    return;
  }
  nodes.set(id, {
    ...node,
    data: { ...node.data, backgroundColor: fill },
  });
}

/**
 * Minimal parser: `flowchart` + direction (`TD`, `LR`, …), node lines `id[label]` / `id([...])` / `id((...))` / `id{"..."}` / `id{label}`,
 * edges, subgraph blocks, `style id fill:color`. Skips `%%` comments and `classDef` / `class` lines.
 * Unknown lines are errors.
 */
export function parseFlowchartMinimal(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const unknown: string[] = [];
  let direction: FlowchartDirection = 'TD';
  let sawFlowchartHeader = false;
  const subgraphStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (COMMENT_LINE.test(trimmed)) {
      continue;
    }
    if (CLASS_DEF_LINE.test(trimmed) || CLASS_LINE.test(trimmed)) {
      continue;
    }

    if (END_LINE.test(trimmed)) {
      if (subgraphStack.length > 0) {
        subgraphStack.pop();
      }
      continue;
    }

    const subgraphOpen = SUBGRAPH_OPEN.exec(trimmed);
    if (subgraphOpen) {
      const parsed = parseSubgraphHeader(subgraphOpen[1]);
      const id = uniqueSubgraphId(parsed.id, new Set(nodes.keys()));
      upsertSubgraphNode(nodes, id, parsed.title, currentParentId(subgraphStack));
      subgraphStack.push(id);
      continue;
    }

    const directionInSubgraph = DIRECTION_LINE.exec(trimmed);
    if (directionInSubgraph && subgraphStack.length > 0) {
      const sgId = subgraphStack[subgraphStack.length - 1];
      const sg = nodes.get(sgId);
      if (sg && isFlowSubgraphNode(sg)) {
        nodes.set(sgId, {
          ...sg,
          data: {
            ...sg.data,
            direction: directionInSubgraph[1].toUpperCase() as FlowchartDirection,
          },
        });
      }
      continue;
    }

    const parentId = currentParentId(subgraphStack);

    const headerMatch = HEADER.exec(trimmed);
    if (headerMatch) {
      if (!sawFlowchartHeader) {
        direction = headerMatch[1].toUpperCase() as FlowchartDirection;
        sawFlowchartHeader = true;
      }
      continue;
    }

    let m = NODE_CYLINDER_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquoteMermaidString(m[2]);
      upsertNode(nodes, id, label, 'cylinder', parentId);
      continue;
    }

    m = NODE_CYLINDER.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'cylinder', parentId);
      continue;
    }

    m = NODE_RECT_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquoteMermaidString(m[2]);
      upsertNode(nodes, id, label, 'rect', parentId);
      continue;
    }

    m = NODE_RECT.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'rect', parentId);
      continue;
    }

    m = NODE_STADIUM_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquoteMermaidString(m[2]);
      upsertNode(nodes, id, label, 'stadium', parentId);
      continue;
    }

    m = NODE_STADIUM.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'stadium', parentId);
      continue;
    }

    m = NODE_CIRCLE_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquoteMermaidString(m[2]);
      upsertNode(nodes, id, label, 'circle', parentId);
      continue;
    }

    m = NODE_CIRCLE.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'circle', parentId);
      continue;
    }

    m = NODE_DIA_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquoteMermaidString(m[2]);
      upsertNode(nodes, id, label, 'diamond', parentId);
      continue;
    }

    m = NODE_DIA.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'diamond', parentId);
      continue;
    }

    if (parseAndPushEdgeLine(trimmed, nodes, edges, upsertNode, ensureStubNode, parentId)) {
      continue;
    }

    m = STYLE_FILL.exec(trimmed);
    if (m) {
      const id = m[1];
      const fill = m[2];
      applyStyleFill(nodes, id, fill.trim());
      continue;
    }

    unknown.push(`Line ${i + 1}: ${trimmed}`);
  }

  if (unknown.length > 0) {
    return {
      ok: false,
      error: `Could not parse:\n${unknown.slice(0, 5).join('\n')}${unknown.length > 5 ? '\n…' : ''}`,
    };
  }

  if (nodes.size === 0 && edges.length === 0) {
    return { ok: false, error: 'No nodes or edges found.' };
  }

  for (const e of edges) {
    if (!nodes.has(e.source) || !nodes.has(e.target)) {
      return {
        ok: false,
        error: `Edge references unknown node: ${e.source} --> ${e.target}`,
      };
    }
  }

  const laidOut = fitSubgraphBounds([...nodes.values()]);
  return { ok: true, nodes: laidOut, edges, direction };
}

function placeNode(id: string, index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const hash = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { x: col * 220 + (hash % 40), y: row * 160 };
}
