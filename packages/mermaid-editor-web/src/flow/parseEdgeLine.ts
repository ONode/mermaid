import { applyFlowEdgeStyle } from './edgeStyle';
import { unquoteMermaidString } from './mermaidText';
import type { FlowEdge, FlowEdgeLineStyle, FlowEdgeStrokeWeight, FlowNode, FlowShape } from './types';

type ArrowToken = '-.->' | '==>' | '-->';

type ArrowStyle = {
  token: ArrowToken;
  lineStyle: FlowEdgeLineStyle;
  strokeWeight: FlowEdgeStrokeWeight;
};

const ARROW_STYLES: Record<ArrowToken, Omit<ArrowStyle, 'token'>> = {
  '-.->': { lineStyle: 'dashed', strokeWeight: 'normal' },
  '==>': { lineStyle: 'solid', strokeWeight: 'thick' },
  '-->': { lineStyle: 'solid', strokeWeight: 'normal' },
};

const EDGE_SPLIT = /^(.+?)\s*(-\.->|==>|-->)\s*(.+)$/;

function unquoteEdgeLabel(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return unquoteMermaidString(t.slice(1, -1));
  }
  return t;
}

function edgeStyleData(lineStyle: FlowEdgeLineStyle, strokeWeight: FlowEdgeStrokeWeight) {
  const data: { lineStyle?: FlowEdgeLineStyle; strokeWeight?: FlowEdgeStrokeWeight } = {};
  if (lineStyle === 'dashed') {
    data.lineStyle = 'dashed';
  }
  if (strokeWeight === 'thick') {
    data.strokeWeight = 'thick';
  }
  return Object.keys(data).length > 0 ? data : undefined;
}

/** Inline node definition; patterns mirror standalone node lines. */
export function parseInlineNodeDef(s: string): { id: string; label: string; shape: FlowShape } | null {
  const t = s.trim();
  let m = /^(\w+)\[\(\s*"((?:\\.|[^"\\])*)"\s*\)\]\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: unquoteMermaidString(m[2]), shape: 'cylinder' };
  }
  m = /^(\w+)\[\(([^)\n]*)\)\]\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: m[2], shape: 'cylinder' };
  }
  m = /^(\w+)\["((?:\\.|[^"\\])*)"\]\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: unquoteMermaidString(m[2]), shape: 'rect' };
  }
  m = /^(\w+)\[([^\]\n]+)\]\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: m[2], shape: 'rect' };
  }
  m = /^(\w+)\(\[\s*"((?:\\.|[^"\\])*)"\s*\]\)\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: unquoteMermaidString(m[2]), shape: 'stadium' };
  }
  m = /^(\w+)\(\[([^\]\n]+)\]\)\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: m[2], shape: 'stadium' };
  }
  m = /^(\w+)\(\(\s*"((?:\\.|[^"\\])*)"\s*\)\)\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: unquoteMermaidString(m[2]), shape: 'circle' };
  }
  m = /^(\w+)\(\(([^)\n]*)\)\)\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: m[2], shape: 'circle' };
  }
  m = /^(\w+)\{"((?:\\.|[^"\\])*)"\}\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: unquoteMermaidString(m[2]), shape: 'diamond' };
  }
  m = /^(\w+)\{([^}\n]*)\}\s*$/.exec(t);
  if (m) {
    return { id: m[1], label: m[2], shape: 'diamond' };
  }
  return null;
}

function splitEndpoints(part: string): string[] {
  return part
    .split('&')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseEdgeRemainder(rest: string): { label?: string; targetsPart: string } | null {
  const trimmed = rest.trim();
  const labeled = /^\|([^|]*)\|\s*(.+)$/.exec(trimmed);
  if (labeled) {
    return {
      label: unquoteEdgeLabel(labeled[1]),
      targetsPart: labeled[2].trim(),
    };
  }
  return { targetsPart: trimmed };
}

function splitEdgeArrow(trimmed: string): { left: string; arrow: ArrowStyle; right: string } | null {
  const m = EDGE_SPLIT.exec(trimmed);
  if (!m) {
    return null;
  }
  const token = m[2] as ArrowToken;
  const style = ARROW_STYLES[token];
  return {
    left: m[1].trim(),
    arrow: { token, ...style },
    right: m[3].trim(),
  };
}

export type UpsertNodeFn = (
  nodes: Map<string, FlowNode>,
  id: string,
  label: string,
  shape: FlowShape,
  parentId?: string
) => void;

export type EnsureStubNodeFn = (
  nodes: Map<string, FlowNode>,
  id: string,
  parentId?: string
) => void;

function resolveEndpoint(
  token: string,
  nodes: Map<string, FlowNode>,
  upsertNode: UpsertNodeFn,
  ensureStubNode: EnsureStubNodeFn,
  parentId?: string
): string | null {
  const inline = parseInlineNodeDef(token);
  if (inline) {
    upsertNode(nodes, inline.id, inline.label, inline.shape, parentId);
    return inline.id;
  }
  if (/^\w+$/.test(token)) {
    ensureStubNode(nodes, token, parentId);
    return token;
  }
  return null;
}

/**
 * Parse one edge line: supports `A & B --> C & D`, inline nodes on either side, labelled and thick/dashed arrows.
 */
export function parseAndPushEdgeLine(
  trimmed: string,
  nodes: Map<string, FlowNode>,
  edges: FlowEdge[],
  upsertNode: UpsertNodeFn,
  ensureStubNode: EnsureStubNodeFn,
  parentId?: string
): boolean {
  const split = splitEdgeArrow(trimmed);
  if (!split) {
    return false;
  }

  const remainder = parseEdgeRemainder(split.right);
  if (!remainder || !remainder.targetsPart) {
    return false;
  }

  const sourceTokens = splitEndpoints(split.left);
  const targetTokens = splitEndpoints(remainder.targetsPart);
  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return false;
  }

  const sourceIds: string[] = [];
  for (const token of sourceTokens) {
    const id = resolveEndpoint(token, nodes, upsertNode, ensureStubNode, parentId);
    if (!id) {
      return false;
    }
    sourceIds.push(id);
  }

  const targetIds: string[] = [];
  for (const token of targetTokens) {
    const id = resolveEndpoint(token, nodes, upsertNode, ensureStubNode, parentId);
    if (!id) {
      return false;
    }
    targetIds.push(id);
  }

  const styleData = edgeStyleData(split.arrow.lineStyle, split.arrow.strokeWeight);

  for (const source of sourceIds) {
    for (const target of targetIds) {
      const id = `e-${source}-${target}-${edges.length}`;
      edges.push(
        applyFlowEdgeStyle({
          id,
          source,
          target,
          ...(remainder.label !== undefined ? { label: remainder.label } : {}),
          data: styleData,
        })
      );
    }
  }

  return true;
}
