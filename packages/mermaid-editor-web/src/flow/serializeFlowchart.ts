import { resolveFlowEdgeData } from './edgeStyle';
import type { FlowchartDirection, FlowEdge, FlowNode, FlowShapeNode } from './types';
import { isFlowShapeNode, isFlowSubgraphNode } from './types';

function escapeQuotedLabel(label: string): string {
  return label.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Use Mermaid quoted form when plain `[…]` / `{…}` text would lose clarity or risk parse issues. */
function formatRectLabel(label: string): string {
  if (/[\n[\]"<>()]|^\s|\s$/.test(label)) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatDiamondLabel(label: string): string {
  if (/[\n{}<>()"]|^\s|\s$/.test(label)) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatStadiumLabel(label: string): string {
  if (/[\n[\]"<>()]|^\s|\s$/.test(label)) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatCircleLabel(label: string): string {
  if (/[\n")]|^\s|\s$/.test(label) || label.includes(')')) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatCylinderLabel(label: string): string {
  if (/[\n\[\]"<>]|^\s|\s$/.test(label)) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatSubgraphTitle(title: string): string {
  if (/[\n[\]"<>()]|^\s|\s$/.test(title)) {
    return `"${escapeQuotedLabel(title)}"`;
  }
  return title;
}

function formatShapeNodeLine(node: FlowShapeNode, indent: string): string {
  const { label, shape } = node.data;
  if (shape === 'diamond') {
    const inner = formatDiamondLabel(label);
    return `${indent}${node.id}{${inner}}`;
  }
  if (shape === 'circle') {
    const inner = formatCircleLabel(label);
    return `${indent}${node.id}((${inner}))`;
  }
  if (shape === 'stadium') {
    const inner = formatStadiumLabel(label);
    return `${indent}${node.id}([${inner}])`;
  }
  if (shape === 'cylinder') {
    const inner = formatCylinderLabel(label);
    return `${indent}${node.id}[(${inner})]`;
  }
  const inner = formatRectLabel(label);
  return `${indent}${node.id}[${inner}]`;
}

function serializeNodeTree(nodes: FlowNode[], parentId: string | undefined, indent: string): string[] {
  const children = nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.id.localeCompare(b.id));

  const lines: string[] = [];
  for (const node of children) {
    if (isFlowSubgraphNode(node)) {
      const titlePart =
        node.id === node.data.title
          ? `subgraph ${node.id}`
          : `subgraph ${node.id} [${formatSubgraphTitle(node.data.title)}]`;
      lines.push(`${indent}${titlePart}`);
      if (node.data.direction) {
        lines.push(`${indent}    direction ${node.data.direction}`);
      }
      lines.push(...serializeNodeTree(nodes, node.id, `${indent}    `));
      lines.push(`${indent}end`);
    } else if (isFlowShapeNode(node)) {
      lines.push(formatShapeNodeLine(node, indent));
    }
  }
  return lines;
}

function mermaidEdgeArrow(edge: FlowEdge): string {
  const { lineStyle, strokeWeight, arrowStart, arrowEnd } = resolveFlowEdgeData(edge);
  const bidirectional = arrowStart && arrowEnd;
  if (bidirectional && lineStyle === 'dashed') {
    return '<-.->';
  }
  if (bidirectional) {
    return '<-->';
  }
  if (lineStyle === 'dashed') {
    return '-.->';
  }
  if (strokeWeight === 'thick') {
    return '==>';
  }
  return '-->';
}

function formatEdgeLabel(label: string): string {
  return /[\n|<>()"$—]/.test(label) ? `"${escapeQuotedLabel(label)}"` : label;
}

function formatEdgeLine(edge: FlowEdge): string {
  const arrow = mermaidEdgeArrow(edge);
  const label =
    typeof edge.label === 'string' && edge.label.length > 0 ? edge.label : undefined;
  if (label !== undefined) {
    const safe = formatEdgeLabel(label);
    return `    ${edge.source} ${arrow}|${safe}| ${edge.target}`;
  }
  return `    ${edge.source} ${arrow} ${edge.target}`;
}

/**
 * Deterministic `flowchart …` text from React Flow nodes and edges.
 */
export function serializeFlowchart(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: FlowchartDirection = 'TD'
): string {
  const sortedEdges = [...edges].sort((a, b) => {
    const s = a.source.localeCompare(b.source);
    if (s !== 0) {
      return s;
    }
    const t = a.target.localeCompare(b.target);
    if (t !== 0) {
      return t;
    }
    return a.id.localeCompare(b.id);
  });

  const styleLines = nodes
    .filter(isFlowShapeNode)
    .filter((n) => {
      const c = n.data.backgroundColor;
      return typeof c === 'string' && c.length > 0;
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((n) => `    style ${n.id} fill:${n.data.backgroundColor}`);

  const lines = [
    `flowchart ${direction}`,
    ...serializeNodeTree(nodes, undefined, '    '),
    ...sortedEdges.map(formatEdgeLine),
    ...styleLines,
  ];
  return `${lines.join('\n')}\n`;
}
