import type { FlowEdge, FlowNode, FlowShape } from './types';

export type ParseResult =
  | { ok: true; nodes: FlowNode[]; edges: FlowEdge[] }
  | { ok: false; error: string };

const HEADER = /^\s*flowchart\s+TD\s*$/i;

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
/** Edge with label */
const EDGE_LAB = /^\s*(\w+)\s*-->\s*\|([^|\n]+)\|\s*(\w+)\s*$/;
/** Plain edge */
const EDGE = /^\s*(\w+)\s*-->\s*(\w+)\s*$/;
/** style id fill:... (single-line; supports rgba with spaces) */
const STYLE_FILL = /^\s*style\s+(\w+)\s+fill:\s*(.+)$/;

function unquote(s: string): string {
  return s.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function upsertNode(nodes: Map<string, FlowNode>, id: string, label: string, shape: FlowShape): void {
  const existing = nodes.get(id);
  const data: FlowNode['data'] = { label, shape };
  const prevBg = existing?.data.backgroundColor;
  if (typeof prevBg === 'string' && prevBg.length > 0) {
    data.backgroundColor = prevBg;
  }
  nodes.set(id, {
    id,
    type: 'flow',
    position: existing?.position ?? placeNode(id, nodes.size),
    data,
  });
}

function applyStyleFill(nodes: Map<string, FlowNode>, id: string, fill: string): void {
  const node = nodes.get(id);
  if (!node) {
    return;
  }
  nodes.set(id, {
    ...node,
    data: { ...node.data, backgroundColor: fill },
  });
}

/**
 * Minimal parser: `flowchart TD`, node lines `id[label]` / `id([...])` / `id((...))` / `id{"..."}` / `id{label}`,
 * edges `a --> b` and `a -->|lbl| b`, `style id fill:color`. Ignores empty lines and unknown lines (error).
 */
export function parseFlowchartMinimal(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  const unknown: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (HEADER.test(trimmed)) {
      continue;
    }

    let m = NODE_RECT_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquote(m[2]);
      upsertNode(nodes, id, label, 'rect');
      continue;
    }

    m = NODE_RECT.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'rect');
      continue;
    }

    m = NODE_STADIUM_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquote(m[2]);
      upsertNode(nodes, id, label, 'stadium');
      continue;
    }

    m = NODE_STADIUM.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'stadium');
      continue;
    }

    m = NODE_CIRCLE_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquote(m[2]);
      upsertNode(nodes, id, label, 'circle');
      continue;
    }

    m = NODE_CIRCLE.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'circle');
      continue;
    }

    m = NODE_DIA_QUOTED.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = unquote(m[2]);
      upsertNode(nodes, id, label, 'diamond');
      continue;
    }

    m = NODE_DIA.exec(trimmed);
    if (m) {
      const id = m[1];
      const label = m[2];
      upsertNode(nodes, id, label, 'diamond');
      continue;
    }

    m = EDGE_LAB.exec(trimmed);
    if (m) {
      const id = `e-${m[1]}-${m[3]}-${edges.length}`;
      edges.push({
        id,
        source: m[1],
        target: m[3],
        label: m[2].trim(),
      });
      continue;
    }

    m = EDGE.exec(trimmed);
    if (m) {
      const id = `e-${m[1]}-${m[2]}-${edges.length}`;
      edges.push({ id, source: m[1], target: m[2] });
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

  return { ok: true, nodes: [...nodes.values()], edges };
}

function placeNode(id: string, index: number): { x: number; y: number } {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const hash = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { x: col * 220 + (hash % 40), y: row * 160 };
}
